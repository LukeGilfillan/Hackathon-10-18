"""
Grant Draft Generation Service

This service uses Google's Gemini AI to generate comprehensive grant application drafts
based on professor profiles and grant requirements.
"""

import json
import logging
from django.conf import settings
import google.generativeai as genai
from api.models import Professor, Grant
from .models import GrantDraft
from datetime import datetime

logger = logging.getLogger(__name__)


class GrantDraftService:
    """Service for AI-powered grant draft generation"""
    
    @staticmethod
    def generate_grant_draft(professor, grant, custom_instructions=None):
        """
        Generate a comprehensive grant application draft for a professor and grant.
        
        Args:
            professor: Professor instance
            grant: Grant instance
            custom_instructions: Optional custom instructions for the draft
            
        Returns:
            GrantDraft instance with generated content
        """
        try:
            logger.info(f"Generating grant draft for professor {professor.email} and grant {grant.id}")
            
            # Check if we have the required API key
            if not hasattr(settings, 'GEMINI_API_KEY') or not settings.GEMINI_API_KEY:
                logger.warning("No Gemini API key available for grant draft generation")
                return GrantDraftService._create_basic_draft(professor, grant)
            
            # Configure Gemini
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Prepare professor profile data
            professor_data = GrantDraftService._prepare_professor_data(professor)
            
            # Prepare grant data
            grant_data = GrantDraftService._prepare_grant_data(grant)
            
            # Generate the draft using AI
            draft_content = GrantDraftService._generate_draft_content(
                professor_data, grant_data, custom_instructions
            )
            
            # Create the GrantDraft instance
            draft = GrantDraft.objects.create(
                professor=professor,
                grant=grant,
                title=draft_content.get('title', f"Grant Application: {grant.title}"),
                project_summary=draft_content.get('project_summary', ''),
                research_objectives=draft_content.get('research_objectives', ''),
                methodology=draft_content.get('methodology', ''),
                expected_outcomes=draft_content.get('expected_outcomes', ''),
                budget_justification=draft_content.get('budget_justification', ''),
                timeline=draft_content.get('timeline', ''),
                team_description=draft_content.get('team_description', ''),
                institutional_support=draft_content.get('institutional_support', ''),
                broader_impacts=draft_content.get('broader_impacts', ''),
                ai_generated=True,
                generation_prompt=GrantDraftService._create_generation_prompt(professor_data, grant_data, custom_instructions),
                generation_model='gemini-2.0-flash',
                generation_confidence=draft_content.get('confidence', 0.8),
                user_notes=custom_instructions or ''
            )
            
            logger.info(f"Successfully generated grant draft {draft.id} for professor {professor.email}")
            return draft
            
        except Exception as e:
            logger.error(f"Error generating grant draft for professor {professor.email}: {str(e)}", exc_info=True)
            # Return a basic draft if AI generation fails
            return GrantDraftService._create_basic_draft(professor, grant)
    
    @staticmethod
    def _prepare_professor_data(professor):
        """Prepare professor data for AI generation"""
        def truncate_text(text, max_length=500):
            if not text:
                return ''
            return text[:max_length] + "..." if len(text) > max_length else text
        
        return {
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
            'collaboration_style': professor.collaboration_style or 'any',
            'website_url': professor.website_url or ''
        }
    
    @staticmethod
    def _prepare_grant_data(grant):
        """Prepare grant data for AI generation"""
        def truncate_text(text, max_length=800):
            if not text:
                return ''
            return text[:max_length] + "..." if len(text) > max_length else text
        
        return {
            'title': grant.title or '',
            'description': truncate_text(grant.description),
            'agency_name': grant.agency_name or '',
            'agency_code': grant.agency_code or '',
            'opportunity_number': grant.opportunity_number or '',
            'category_of_funding_activity': grant.category_of_funding_activity or '',
            'funding_instrument_type': grant.funding_instrument_type or '',
            'eligible_applicants': grant.eligible_applicants or '',
            'additional_information_on_eligibility': truncate_text(grant.additional_information_on_eligibility),
            'cost_sharing_or_matching_requirement': grant.cost_sharing_or_matching_requirement or '',
            'additional_information_text': truncate_text(grant.additional_information_text),
            'award_floor': float(grant.award_floor) if grant.award_floor else None,
            'award_ceiling': float(grant.award_ceiling) if grant.award_ceiling else None,
            'estimated_total_program_funding': float(grant.estimated_total_program_funding) if grant.estimated_total_program_funding else None,
            'close_date': grant.close_date.isoformat() if grant.close_date else '',
            'post_date': grant.post_date.isoformat() if grant.post_date else '',
            'days_until_close': grant.days_until_close if grant.days_until_close else None
        }
    
    @staticmethod
    def _create_generation_prompt(professor_data, grant_data, custom_instructions):
        """Create the prompt used for generation (for record keeping)"""
        prompt_parts = [
            f"Generate grant application for {professor_data['name']}",
            f"Grant: {grant_data['title']}",
            f"Agency: {grant_data['agency_name']}"
        ]
        if custom_instructions:
            prompt_parts.append(f"Custom instructions: {custom_instructions}")
        return " | ".join(prompt_parts)
    
    @staticmethod
    def _generate_draft_content(professor_data, grant_data, custom_instructions):
        """Generate draft content using Gemini AI"""
        try:
            # Create the comprehensive prompt
            prompt = f"""
            You are an expert grant writing consultant with deep knowledge of federal and private funding opportunities. 
            Generate a comprehensive, compelling grant application draft that maximizes the professor's chances of success.

            PROFESSOR PROFILE:
            {json.dumps(professor_data, indent=2)}

            GRANT OPPORTUNITY:
            {json.dumps(grant_data, indent=2)}

            CUSTOM INSTRUCTIONS:
            {custom_instructions or "None - use standard best practices"}

            Generate a complete grant application with the following sections. Each section should be:
            - Specific to this professor's expertise and research background
            - Aligned with the grant requirements and agency priorities
            - Compelling and well-justified
            - Professional and polished
            - Appropriate length for the section (typically 200-500 words per section)

            Required sections:

            1. PROJECT TITLE: Create a compelling, descriptive title that captures the essence of the proposed research

            2. PROJECT SUMMARY: A concise overview (200-300 words) that includes:
               - Research question/hypothesis
               - Methodology overview
               - Expected outcomes and broader impacts
               - Why this professor is uniquely qualified

            3. RESEARCH OBJECTIVES: Specific, measurable objectives (3-5 objectives) that:
               - Build on the professor's existing expertise
               - Address the grant's funding priorities
               - Are achievable within the proposed timeline
               - Have clear success metrics

            4. METHODOLOGY: Detailed research approach that:
               - Leverages the professor's technical expertise
               - Incorporates innovative approaches where appropriate
               - Addresses potential challenges and mitigation strategies
               - Aligns with the professor's research capabilities and resources

            5. EXPECTED OUTCOMES: Tangible results including:
               - Research outputs (publications, datasets, tools)
               - Broader impacts on society, education, or industry
               - Career advancement opportunities for the professor
               - Potential for follow-up funding

            6. BUDGET JUSTIFICATION: High-level justification that:
               - Aligns with the grant's funding range
               - Justifies key personnel, equipment, and materials
               - Leverages institutional resources
               - Demonstrates cost-effectiveness

            7. TIMELINE: Realistic project schedule that:
               - Accounts for the professor's existing commitments
               - Includes milestones and deliverables
               - Allows for unexpected challenges
               - Aligns with the grant's duration expectations

            8. TEAM DESCRIPTION: Research team composition that:
               - Highlights the professor's leadership capabilities
               - Includes appropriate collaborators and students
               - Leverages institutional strengths
               - Addresses the professor's collaboration preferences

            9. INSTITUTIONAL SUPPORT: University/department support including:
               - Facilities and resources available
               - Administrative support
               - Alignment with institutional priorities
               - Commitment to the research

            10. BROADER IMPACTS: Societal benefits including:
                - Educational impacts (student training, curriculum development)
                - Economic impacts (technology transfer, job creation)
                - Social impacts (addressing societal challenges)
                - Scientific impacts (advancing the field)

            Return ONLY a JSON object in this exact format:
            {{
                "title": "Compelling Project Title",
                "project_summary": "Comprehensive project summary...",
                "research_objectives": "Detailed research objectives...",
                "methodology": "Detailed methodology...",
                "expected_outcomes": "Expected outcomes and impacts...",
                "budget_justification": "Budget justification...",
                "timeline": "Project timeline...",
                "team_description": "Team description...",
                "institutional_support": "Institutional support...",
                "broader_impacts": "Broader impacts...",
                "confidence": 0.85
            }}

            Make the content specific, compelling, and tailored to this exact professor-grant combination.
            """
            
            # Get response from Gemini
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            
            if not response or not response.text:
                logger.warning("No response from Gemini for grant draft generation")
                return GrantDraftService._get_fallback_content(professor_data, grant_data)
            
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
                logger.info("Successfully generated grant draft content using Gemini")
                return result
                
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing Gemini response for grant draft: {e}")
                return GrantDraftService._get_fallback_content(professor_data, grant_data)
                
        except Exception as e:
            logger.error(f"Error in Gemini grant draft generation: {str(e)}")
            return GrantDraftService._get_fallback_content(professor_data, grant_data)
    
    @staticmethod
    def _get_fallback_content(professor_data, grant_data):
        """Generate basic fallback content when AI generation fails"""
        return {
            'title': f"Research Proposal: {grant_data['title']}",
            'project_summary': f"This proposal outlines a research project in {', '.join(professor_data['research_areas'][:3])} that aligns with the {grant_data['agency_name']} funding opportunity. The research will leverage {professor_data['name']}'s expertise in {', '.join(professor_data['expertise_keywords'][:3])} to address important questions in the field.",
            'research_objectives': f"1. Develop innovative approaches in {professor_data['research_areas'][0] if professor_data['research_areas'] else 'the research area'}\n2. Advance understanding of key challenges\n3. Generate practical applications and broader impacts",
            'methodology': f"The research will employ established methodologies in {professor_data['department']} while incorporating innovative approaches. The methodology will build on {professor_data['name']}'s previous work and expertise.",
            'expected_outcomes': "Expected outcomes include peer-reviewed publications, conference presentations, student training opportunities, and potential for technology transfer and broader societal impact.",
            'budget_justification': f"The proposed budget aligns with the grant's funding range and supports essential research activities including personnel, equipment, and materials necessary for successful project completion.",
            'timeline': "The project will be completed over the grant period with key milestones including literature review, methodology development, data collection, analysis, and dissemination of results.",
            'team_description': f"The research team will be led by {professor_data['name']} and will include graduate students and potentially undergraduate researchers, leveraging the collaborative environment at {professor_data['university']}.",
            'institutional_support': f"{professor_data['university']} and the {professor_data['department']} department provide strong support for this research through facilities, administrative support, and alignment with institutional priorities.",
            'broader_impacts': "The research will have broader impacts through student training, potential technology transfer, advancement of scientific knowledge, and addressing societal challenges in the field.",
            'confidence': 0.3
        }
    
    @staticmethod
    def _create_basic_draft(professor, grant):
        """Create a basic draft when AI generation is not available"""
        logger.info(f"Creating basic draft for professor {professor.email} and grant {grant.id}")
        
        draft = GrantDraft.objects.create(
            professor=professor,
            grant=grant,
            title=f"Grant Application: {grant.title}",
            project_summary=f"Research proposal for {grant.title} by {professor.name}",
            research_objectives="Research objectives to be defined",
            methodology="Methodology to be developed",
            expected_outcomes="Expected outcomes to be specified",
            budget_justification="Budget justification to be prepared",
            timeline="Project timeline to be established",
            team_description="Research team composition to be determined",
            institutional_support="Institutional support details to be added",
            broader_impacts="Broader impacts to be articulated",
            ai_generated=False,
            generation_confidence=0.1,
            user_notes="Basic draft created - requires manual completion"
        )
        
        return draft
    
    @staticmethod
    def improve_draft_section(draft, section_name, improvement_instructions):
        """
        Improve a specific section of an existing draft using AI.
        
        Args:
            draft: GrantDraft instance
            section_name: Name of the section to improve
            improvement_instructions: Specific instructions for improvement
            
        Returns:
            Updated draft content for the section
        """
        try:
            logger.info(f"Improving {section_name} section for draft {draft.id}")
            
            # Check if we have the required API key
            if not hasattr(settings, 'GEMINI_API_KEY') or not settings.GEMINI_API_KEY:
                logger.warning("No Gemini API key available for draft improvement")
                return None
            
            # Configure Gemini
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Prepare context data
            professor_data = GrantDraftService._prepare_professor_data(draft.professor)
            grant_data = GrantDraftService._prepare_grant_data(draft.grant)
            current_content = draft.get_full_content()
            
            # Create improvement prompt
            prompt = f"""
            You are an expert grant writing consultant. Improve the following section of a grant application.

            PROFESSOR PROFILE:
            {json.dumps(professor_data, indent=2)}

            GRANT OPPORTUNITY:
            {json.dumps(grant_data, indent=2)}

            CURRENT DRAFT CONTENT:
            {json.dumps(current_content, indent=2)}

            SECTION TO IMPROVE: {section_name}
            CURRENT CONTENT: {current_content.get(section_name, 'No content available')}

            IMPROVEMENT INSTRUCTIONS: {improvement_instructions}

            Provide an improved version of the {section_name} section that:
            - Addresses the improvement instructions
            - Maintains consistency with the rest of the draft
            - Aligns with the professor's expertise and the grant requirements
            - Is compelling and well-written
            - Is appropriate length (typically 200-500 words)

            Return ONLY the improved content as plain text, not JSON.
            """
            
            # Get response from Gemini
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            
            if response and response.text:
                improved_content = response.text.strip()
                logger.info(f"Successfully improved {section_name} section for draft {draft.id}")
                return improved_content
            else:
                logger.warning(f"No response from Gemini for {section_name} improvement")
                return None
                
        except Exception as e:
            logger.error(f"Error improving {section_name} section for draft {draft.id}: {str(e)}")
            return None
    
    @staticmethod
    def get_draft_suggestions(draft):
        """
        Get AI-powered suggestions for improving a draft.
        
        Args:
            draft: GrantDraft instance
            
        Returns:
            Dictionary with suggestions for each section
        """
        try:
            logger.info(f"Getting suggestions for draft {draft.id}")
            
            # Check if we have the required API key
            if not hasattr(settings, 'GEMINI_API_KEY') or not settings.GEMINI_API_KEY:
                logger.warning("No Gemini API key available for draft suggestions")
                return {}
            
            # Configure Gemini
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Prepare context data
            professor_data = GrantDraftService._prepare_professor_data(draft.professor)
            grant_data = GrantDraftService._prepare_grant_data(draft.grant)
            current_content = draft.get_full_content()
            
            # Create suggestions prompt
            prompt = f"""
            You are an expert grant writing consultant. Review this grant application draft and provide specific, actionable suggestions for improvement.

            PROFESSOR PROFILE:
            {json.dumps(professor_data, indent=2)}

            GRANT OPPORTUNITY:
            {json.dumps(grant_data, indent=2)}

            CURRENT DRAFT CONTENT:
            {json.dumps(current_content, indent=2)}

            Provide specific suggestions for improving each section. Focus on:
            - Strengthening the connection between professor expertise and grant requirements
            - Improving clarity and persuasiveness
            - Addressing potential weaknesses
            - Enhancing alignment with agency priorities
            - Strengthening the broader impacts narrative

            Return ONLY a JSON object in this format:
            {{
                "project_summary": ["suggestion 1", "suggestion 2"],
                "research_objectives": ["suggestion 1", "suggestion 2"],
                "methodology": ["suggestion 1", "suggestion 2"],
                "expected_outcomes": ["suggestion 1", "suggestion 2"],
                "budget_justification": ["suggestion 1", "suggestion 2"],
                "timeline": ["suggestion 1", "suggestion 2"],
                "team_description": ["suggestion 1", "suggestion 2"],
                "institutional_support": ["suggestion 1", "suggestion 2"],
                "broader_impacts": ["suggestion 1", "suggestion 2"],
                "overall_suggestions": ["general suggestion 1", "general suggestion 2"]
            }}
            """
            
            # Get response from Gemini
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            
            if not response or not response.text:
                logger.warning("No response from Gemini for draft suggestions")
                return {}
            
            # Clean and parse response
            clean_text = response.text.strip()
            if clean_text.startswith('```json'):
                clean_text = clean_text[7:]
            if clean_text.endswith('```'):
                clean_text = clean_text[:-3]
            
            json_start = clean_text.find('{')
            json_end = clean_text.rfind('}')
            
            if json_start >= 0 and json_end >= 0:
                clean_text = clean_text[json_start:json_end + 1]
            
            try:
                suggestions = json.loads(clean_text)
                logger.info(f"Successfully generated suggestions for draft {draft.id}")
                return suggestions
                
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing suggestions response: {e}")
                return {}
                
        except Exception as e:
            logger.error(f"Error getting suggestions for draft {draft.id}: {str(e)}")
            return {}
