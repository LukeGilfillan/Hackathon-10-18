"""
LLM-based Professor-Grant Relevance Analysis Service

This service uses Google's Gemini AI to provide qualitative relevance analysis
for professor-grant matching, focusing on strategic alignment and research fit.
"""

import json
import logging
from django.conf import settings
import google.generativeai as genai
from .models import Professor, Grant

logger = logging.getLogger(__name__)


class ProfessorLLMService:
    """Service for LLM-based professor-grant relevance analysis"""
    
    @staticmethod
    def apply_llm_relevance_analysis(scored_grants, professor):
        """
        Apply LLM relevance analysis to the top grant opportunities and adjust their scores.
        
        Args:
            scored_grants: List of (grant, score) tuples
            professor: Professor instance
            
        Returns:
            List of (grant, adjusted_score) tuples
        """
        if not scored_grants:
            return scored_grants
        
        # Check if we have the required API key
        if not hasattr(settings, 'GEMINI_API_KEY') or not settings.GEMINI_API_KEY:
            logger.warning("No Gemini API key available for LLM relevance analysis")
            return scored_grants
        
        try:
            # Configure Gemini
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Prepare professor profile data for analysis
            def truncate_text(text, max_length=400):
                if not text:
                    return ''
                return text[:max_length] + "..." if len(text) > max_length else text
            
            professor_data = {
                'name': professor.name or '',
                'title': professor.title or '',
                'department': professor.department or '',
                'school': professor.school or '',
                'university': professor.university or '',
                'research_areas': professor.research_areas or [],
                'expertise_keywords': professor.expertise_keywords or [],
                'research_interests': truncate_text(professor.research_interests),
                'current_projects': truncate_text(professor.current_projects),
                'education': professor.education or [],
                'publications': professor.publications or [],
                'awards': professor.awards or [],
                'grants_received': professor.grants_received or [],
                'preferred_agencies': professor.preferred_agencies or [],
                'preferred_funding_types': professor.preferred_funding_types or [],
                'preferred_award_ranges': professor.preferred_award_ranges or {},
                'preferred_duration': professor.preferred_duration or {},
                'collaboration_style': professor.collaboration_style or 'any',
                'travel_willingness': professor.travel_willingness or 'moderate',
                'website_url': professor.website_url or ''
            }
            
            # Prepare grant data for analysis
            grants_data = []
            for grant, score in scored_grants:
                # Format deadline info
                deadline_info = {
                    'close_date': grant.close_date.isoformat() if grant.close_date else '',
                    'post_date': grant.post_date.isoformat() if grant.post_date else '',
                    'days_until_close': grant.days_until_close if grant.days_until_close else None
                }
                
                # Format financial info
                financial_info = {
                    'award_floor': float(grant.award_floor) if grant.award_floor else None,
                    'award_ceiling': float(grant.award_ceiling) if grant.award_ceiling else None,
                    'estimated_total_program_funding': float(grant.estimated_total_program_funding) if grant.estimated_total_program_funding else None,
                    'expected_number_of_awards': grant.expected_number_of_awards or ''
                }
                
                grant_data = {
                    'id': grant.id,
                    'title': grant.title or '',
                    'description': truncate_text(grant.description),
                    'agency_code': grant.agency_code or '',
                    'agency_name': grant.agency_name or '',
                    'opportunity_number': grant.opportunity_number or '',
                    'category_of_funding_activity': grant.category_of_funding_activity or '',
                    'funding_instrument_type': grant.funding_instrument_type or '',
                    'eligible_applicants': grant.eligible_applicants or '',
                    'additional_information_on_eligibility': truncate_text(grant.additional_information_on_eligibility),
                    'cost_sharing_or_matching_requirement': grant.cost_sharing_or_matching_requirement or '',
                    'additional_information_text': truncate_text(grant.additional_information_text),
                    'grantor_contact_name': grant.grantor_contact_name or '',
                    'grantor_contact_email': grant.grantor_contact_email or '',
                    'deadline_info': deadline_info,
                    'financial_info': financial_info,
                    'current_score': score
                }
                grants_data.append(grant_data)
            
            # Create the analysis prompt
            prompt = f"""
            You are an expert research funding consultant analyzing grant opportunities for strategic research fit.

            PROFESSOR PROFILE:
            {json.dumps(professor_data, indent=2)}
            
            GRANT OPPORTUNITIES TO ANALYZE:
            {json.dumps(grants_data, indent=2)}
            
            Focus on QUALITATIVE RESEARCH FIT factors that algorithms cannot assess:

            RESEARCH ALIGNMENT:
            - Does this grant align with the professor's current research trajectory and interests?
            - Does it leverage the professor's unique expertise and research capabilities?
            - Will this grant advance the professor's research agenda and career goals?

            METHODOLOGICAL FIT:
            - Does the professor have the technical expertise and methodological skills for this research?
            - Are there innovative approaches or technologies the professor can bring to this project?
            - Does the scope match the professor's research capacity and team structure?

            CAREER DEVELOPMENT:
            - Does this opportunity help establish the professor in a new research area or methodology?
            - Will success here open doors to larger or more prestigious funding opportunities?
            - Does it align with the professor's career stage and advancement goals?

            INSTITUTIONAL ALIGNMENT:
            - Does this grant fit with the professor's department and university priorities?
            - Will it enhance the professor's standing within their academic community?
            - Does it align with the professor's teaching and service responsibilities?

            COLLABORATION POTENTIAL:
            - Does this opportunity facilitate valuable research collaborations?
            - Will it help build relationships with key funding agencies or research communities?
            - Does it align with the professor's preferred collaboration style?

            FEASIBILITY ASSESSMENT:
            - Is the timeline realistic given the professor's current workload and commitments?
            - Are the resource requirements (funding, personnel, equipment) achievable?
            - What are the potential risks and how well can the professor mitigate them?

            Return a relevance score from 0.0 to 2.0 (where 1.0 = neutral, >1.0 = more relevant, <1.0 = less relevant).
            
            Return ONLY a JSON object in this format:
            {{
                "grant_analyses": [
                    {{
                        "id": grant_id,
                        "relevance_score": 1.2,
                        "reasoning": "Brief explanation of the relevance assessment"
                    }},
                    ...
                ]
            }}
            """
            
            # Get response from Gemini
            try:
                model = genai.GenerativeModel('gemini-2.0-flash')
                response = model.generate_content(prompt)
            except Exception as api_error:
                logger.error(f"Gemini API error: {str(api_error)}")
                return scored_grants
            
            if not response or not response.text:
                logger.warning("No response from Gemini for relevance analysis")
                return scored_grants
            
            # Clean the response text
            clean_text = response.text.strip()
            if clean_text.startswith('```json'):
                clean_text = clean_text[7:]
            if clean_text.endswith('```'):
                clean_text = clean_text[:-3]
            
            # Extract JSON if wrapped in other text
            json_start = clean_text.find('{')
            json_end = clean_text.rfind('}')
            
            if json_start >= 0 and json_end >= 0:
                clean_text = clean_text[json_start:json_end + 1]
            
            # Parse response
            try:
                result = json.loads(clean_text)
                analyses = result.get('grant_analyses', [])
                
                # Create a mapping of grant ID to analysis
                analysis_map = {analysis['id']: analysis for analysis in analyses}
                
                # Apply relevance adjustments to scores
                adjusted_grants = []
                for grant, original_score in scored_grants:
                    analysis = analysis_map.get(grant.id)
                    if analysis:
                        relevance_score = analysis.get('relevance_score', 1.0)
                        reasoning = analysis.get('reasoning', '')
                        
                        # Apply relevance multiplier to the original score
                        adjusted_score = original_score * relevance_score
                        adjusted_grants.append((grant, adjusted_score))
                        
                        logger.info(f"LLM analysis for grant {grant.id} ({grant.title[:50]}...): "
                                  f"original={original_score:.2f}, relevance={relevance_score:.2f}, "
                                  f"adjusted={adjusted_score:.2f}, reasoning={reasoning[:100]}...")
                    else:
                        # If no analysis available, keep original score
                        adjusted_grants.append((grant, original_score))
                
                # Re-sort by adjusted scores
                adjusted_grants.sort(key=lambda x: x[1], reverse=True)
                
                logger.info(f"Applied LLM relevance analysis to {len(adjusted_grants)} grants for professor {professor.email}")
                return adjusted_grants
                
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing LLM relevance analysis response: {e}")
                return scored_grants
                
        except Exception as e:
            logger.error(f"Error in LLM relevance analysis for professor {professor.email}: {str(e)}", exc_info=True)
            return scored_grants
    
    @staticmethod
    def analyze_single_grant(grant, professor):
        """
        Analyze a single grant for a professor using LLM.
        
        Args:
            grant: Grant instance
            professor: Professor instance
            
        Returns:
            Dictionary with relevance score and reasoning
        """
        try:
            # Use the batch analysis method with a single grant
            scored_grants = [(grant, 1.0)]  # Neutral base score
            analyzed_grants = ProfessorLLMService.apply_llm_relevance_analysis(scored_grants, professor)
            
            if analyzed_grants:
                analyzed_grant, adjusted_score = analyzed_grants[0]
                return {
                    'relevance_score': adjusted_score,
                    'reasoning': f"LLM analysis completed for grant {grant.title}"
                }
            else:
                return {
                    'relevance_score': 1.0,
                    'reasoning': "LLM analysis failed, using neutral score"
                }
                
        except Exception as e:
            logger.error(f"Error analyzing single grant {grant.id} for professor {professor.email}: {str(e)}")
            return {
                'relevance_score': 1.0,
                'reasoning': f"Error in analysis: {str(e)}"
            }
