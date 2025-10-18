import re
import json
import logging
import time
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.conf import settings
import google.generativeai as genai
from api.models import Grant

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Flag grant opportunities for Catholic social teaching compliance in batches'

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=50,
            help='Number of grants to process in each batch (default: 50)'
        )
        parser.add_argument(
            '--start-from',
            type=int,
            default=0,
            help='Start processing from this grant ID (default: 0)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without making changes to the database'
        )
        parser.add_argument(
            '--force-rerun',
            action='store_true',
            help='Rerun compliance check on already reviewed grants'
        )
        parser.add_argument(
            '--delay',
            type=float,
            default=1.0,
            help='Delay between API calls in seconds (default: 1.0)'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting Catholic social teaching compliance review...'))
        
        batch_size = options['batch_size']
        start_from = options['start_from']
        dry_run = options['dry_run']
        force_rerun = options['force_rerun']
        delay = options['delay']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be saved'))
        
        # Get grants to process
        queryset = Grant.objects.all()
        
        if not force_rerun:
            # Only process grants that haven't been reviewed yet
            queryset = queryset.filter(catholic_social_teaching_compliance='not_reviewed')
        
        # Apply start_from filter
        if start_from > 0:
            queryset = queryset.filter(id__gte=start_from)
        
        total_grants = queryset.count()
        self.stdout.write(f'Found {total_grants} grants to process')
        
        if total_grants == 0:
            self.stdout.write(self.style.WARNING('No grants to process'))
            return
        
        processed_count = 0
        flagged_count = 0
        compliant_count = 0
        non_compliant_count = 0
        
        # Process grants in batches
        for offset in range(0, total_grants, batch_size):
            batch_grants = queryset[offset:offset + batch_size]
            
            self.stdout.write(f'Processing batch {offset//batch_size + 1} ({len(batch_grants)} grants)...')
            
            with transaction.atomic():
                for grant in batch_grants:
                    try:
                        compliance_result = self.analyze_catholic_compliance(grant)
                        
                        if not dry_run:
                            grant.catholic_social_teaching_compliance = compliance_result['status']
                            grant.catholic_social_teaching_notes = compliance_result['notes']
                            grant.catholic_social_teaching_reviewed_at = timezone.now()
                            grant.save(update_fields=[
                                'catholic_social_teaching_compliance',
                                'catholic_social_teaching_notes', 
                                'catholic_social_teaching_reviewed_at'
                            ])
                        
                        # Update counters
                        processed_count += 1
                        if compliance_result['status'] == 'flagged':
                            flagged_count += 1
                        elif compliance_result['status'] == 'compliant':
                            compliant_count += 1
                        elif compliance_result['status'] == 'non_compliant':
                            non_compliant_count += 1
                        
                        # Log progress
                        if processed_count % 10 == 0:
                            self.stdout.write(f'Processed {processed_count}/{total_grants} grants...')
                        
                        # Add delay between API calls to avoid rate limiting
                        if delay > 0:
                            time.sleep(delay)
                            
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'Error processing grant {grant.id} ({grant.title}): {e}')
                        )
                        continue
            
            self.stdout.write(f'Completed batch {offset//batch_size + 1}')
        
        # Summary
        self.stdout.write(self.style.SUCCESS('\n=== COMPLIANCE REVIEW SUMMARY ==='))
        self.stdout.write(f'Total grants processed: {processed_count}')
        self.stdout.write(f'Compliant: {compliant_count}')
        self.stdout.write(f'Flagged for review: {flagged_count}')
        self.stdout.write(f'Non-compliant: {non_compliant_count}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes were saved'))

    def analyze_catholic_compliance(self, grant):
        """
        Analyze a grant for Catholic social teaching compliance using Gemini AI.
        Returns a dict with 'status' and 'notes' keys.
        """
        # Check if we have the required API key
        if not hasattr(settings, 'GEMINI_API_KEY') or not settings.GEMINI_API_KEY:
            logger.warning("No Gemini API key available for Catholic compliance analysis")
            return {
                'status': 'flagged',
                'notes': 'Unable to analyze - Gemini API key not configured'
            }
        
        try:
            # Configure Gemini
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Prepare grant data for analysis
            grant_data = {
                'title': grant.title or '',
                'description': grant.description or '',
                'agency_name': grant.agency_name or '',
                'category_of_funding_activity': grant.category_of_funding_activity or '',
                'eligible_applicants': grant.eligible_applicants or '',
                'additional_information_on_eligibility': grant.additional_information_on_eligibility or '',
                'additional_information_text': grant.additional_information_text or '',
                'category_explanation': grant.category_explanation or '',
            }
            
            # Create the prompt for Gemini
            prompt = self.create_catholic_compliance_prompt(grant_data)
            
            # Get response from Gemini
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            
            if not response or not response.text:
                logger.warning("No response from Gemini for Catholic compliance analysis")
                return {
                    'status': 'flagged',
                    'notes': 'Unable to analyze - No response from Gemini AI'
                }
            
            # Parse the response
            result = self.parse_gemini_response(response.text)
            logger.info(f"Successfully analyzed grant {grant.id} for Catholic compliance using Gemini")
            return result
            
        except Exception as e:
            logger.error(f"Error in Gemini Catholic compliance analysis: {str(e)}")
            return {
                'status': 'flagged',
                'notes': f'Analysis error: {str(e)}'
            }
    
    def create_catholic_compliance_prompt(self, grant_data):
        """Create a prompt for Gemini to analyze Catholic social teaching compliance"""
        
        # Combine relevant text fields
        text_content = ' '.join(filter(None, [
            grant_data['title'],
            grant_data['description'],
            grant_data['additional_information_text'],
            grant_data['eligible_applicants'],
            grant_data['additional_information_on_eligibility'],
            grant_data['category_of_funding_activity'],
            grant_data['category_explanation'],
        ]))
        
        prompt = f"""
You are an expert in Catholic social teaching and grant evaluation. Analyze the following grant opportunity for compliance with Catholic social teaching principles.

GRANT INFORMATION:
Title: {grant_data['title']}
Agency: {grant_data['agency_name']}
Category: {grant_data['category_of_funding_activity']}
Description: {text_content[:2000]}  # Limit to avoid token limits

CATHOLIC SOCIAL TEACHING PRINCIPLES TO CONSIDER:
1. Human Dignity - Respect for the inherent worth of every person
2. Common Good - Working for the benefit of all people
3. Solidarity - Unity and mutual support among people
4. Subsidiarity - Decisions should be made at the most appropriate level
5. Preferential Option for the Poor - Special concern for the vulnerable
6. Stewardship - Care for God's creation
7. Participation - All people have the right to participate in society
8. Rights and Responsibilities - Balance between individual rights and social responsibilities

AREAS OF CONCERN TO IDENTIFY:
- Research involving abortion, embryonic stem cells, or assisted suicide
- Military weapons development or warfare technology
- Activities that exploit or harm vulnerable populations
- Research that violates human dignity or fundamental rights
- Environmental destruction or unsustainable practices
- Surveillance or privacy violations
- Discrimination or exclusion based on protected characteristics

POSITIVE INDICATORS:
- Education, healthcare, or social services
- Poverty alleviation or community development
- Environmental protection or sustainability
- Peace and reconciliation efforts
- Research ethics and informed consent
- Support for vulnerable populations
- Scientific research that benefits humanity

Please analyze this grant and respond with a JSON object containing:
{{
    "status": "compliant" | "flagged" | "non_compliant",
    "reasoning": "Brief explanation of your analysis",
    "concerns": ["List of specific concerns if any"],
    "positive_aspects": ["List of positive aspects if any"],
    "recommendation": "Brief recommendation for manual review if needed"
}}

Guidelines:
- "compliant": Grant clearly aligns with Catholic social teaching
- "flagged": Grant has some concerns or needs manual review
- "non_compliant": Grant clearly violates Catholic social teaching principles

Be thorough but concise in your analysis.
"""
        
        return prompt
    
    def parse_gemini_response(self, response_text):
        """Parse Gemini's response and extract compliance information"""
        try:
            # Try to extract JSON from the response
            # Look for JSON-like content in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                result = json.loads(json_str)
                
                # Validate the response structure
                if 'status' in result and 'reasoning' in result:
                    notes = result['reasoning']
                    
                    if result.get('concerns'):
                        notes += f" | CONCERNS: {', '.join(result['concerns'])}"
                    
                    if result.get('positive_aspects'):
                        notes += f" | POSITIVE: {', '.join(result['positive_aspects'])}"
                    
                    if result.get('recommendation'):
                        notes += f" | RECOMMENDATION: {result['recommendation']}"
                    
                    return {
                        'status': result['status'],
                        'notes': notes
                    }
            
            # Fallback: try to extract status from text
            if 'non_compliant' in response_text.lower():
                status = 'non_compliant'
            elif 'flagged' in response_text.lower():
                status = 'flagged'
            elif 'compliant' in response_text.lower():
                status = 'compliant'
            else:
                status = 'flagged'
            
            return {
                'status': status,
                'notes': f"Gemini analysis: {response_text[:500]}..."
            }
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Error parsing Gemini response: {e}")
            return {
                'status': 'flagged',
                'notes': f"Response parsing error: {response_text[:200]}..."
            }
