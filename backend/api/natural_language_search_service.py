"""
Natural Language Search Service

This service provides intelligent natural language search capabilities for grants and profiles
using a two-stage AI approach:
1. Stage 1: Generate database filters from natural language query
2. Stage 2: AI ranking of top 25 results for relevance scoring
"""

import json
import logging
import re
from django.conf import settings
import google.generativeai as genai
from .models import Grant, ResearcherProfile
from django.db.models import Q
from django.utils.dateparse import parse_date
from datetime import datetime, timedelta
from decimal import Decimal

logger = logging.getLogger(__name__)


class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle Decimal objects"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


class NaturalLanguageSearchService:
    """Service for natural language search using two-stage AI approach"""
    
    @staticmethod
    def _normalize_name(name):
        """
        Normalize a name for better matching by removing common prefixes and suffixes.
        
        Args:
            name: Name string to normalize
            
        Returns:
            Normalized name string
        """
        if not name:
            return ""
        
        # Remove common prefixes
        prefixes_to_remove = ['dr.', 'prof.', 'professor', 'rev.', 'msgr.', 'fr.', 'mr.', 'ms.', 'mrs.']
        normalized = name.lower().strip()
        
        for prefix in prefixes_to_remove:
            if normalized.startswith(prefix + ' '):
                normalized = normalized[len(prefix):].strip()
        
        # Remove common suffixes
        suffixes_to_remove = ['ph.d.', 'md', 'jd', 'j.c.d.', 'j.c.l.', 'm.s.l.', 'c.s.p.']
        for suffix in suffixes_to_remove:
            if normalized.endswith(', ' + suffix):
                normalized = normalized[:-len(', ' + suffix)]
            elif normalized.endswith(' ' + suffix):
                normalized = normalized[:-len(' ' + suffix)]
        
        return normalized.strip()
    
    @staticmethod
    def _extract_name_parts(name):
        """
        Extract individual name parts from a full name.
        
        Args:
            name: Full name string
            
        Returns:
            List of name parts
        """
        if not name:
            return []
        
        # Split by common separators and clean up
        parts = re.split(r'[,\s]+', name.strip())
        # Remove empty parts and single characters
        parts = [part for part in parts if len(part) > 1]
        return parts
    
    @staticmethod
    def search_grants_with_nlp(query, limit=20):
        """
        Search grants using two-stage scoring algorithm.
        
        Stage 1: Generate search parameters from natural language query
        Stage 2: Score all grants using the generated parameters
        
        Args:
            query: Natural language search query
            limit: Maximum number of results to return
            
        Returns:
            List of Grant objects with relevance scores
        """
        if not query or not query.strip():
            return []
        
        # Check if we have the required API key
        if not hasattr(settings, 'GEMINI_API_KEY') or not settings.GEMINI_API_KEY:
            logger.warning("No Gemini API key available for natural language search")
            return NaturalLanguageSearchService._fallback_search_grants(query, limit)
        
        try:
            print(f"🔍 Starting two-stage grant search with query: '{query}'")
            
            # Stage 1: Generate search parameters from natural language query
            print("📝 Stage 1: Generating search parameters using AI...")
            search_params = NaturalLanguageSearchService._generate_grant_search_params(query)
            logger.info(f"Generated search parameters for query '{query}': {search_params}")
            print(f"✅ Generated search parameters: {search_params}")
            
            # Stage 2: Get all grants and score them using the parameters
            print("📊 Stage 2: Retrieving grants from database...")
            all_grants = list(Grant.objects.all()[:100])
            logger.info(f"Retrieved {len(all_grants)} grants from database")
            print(f"✅ Retrieved {len(all_grants)} grants from database")
            
            if not all_grants:
                return []
            
            # Score all grants using the generated parameters
            print("🤖 Stage 2: Scoring all grants using generated parameters...")
            scored_grants = NaturalLanguageSearchService._score_grants_with_params(query, search_params, all_grants)
            print(f"✅ Scoring completed. Returning top {min(limit, len(scored_grants))} results")
            
            # Return top results up to limit
            return scored_grants[:limit]
                
        except Exception as e:
            print(f"❌ Natural language search failed: {str(e)}")
            logger.error(f"Natural language search failed: {str(e)}")
            print("🔄 Falling back to basic keyword search...")
            return NaturalLanguageSearchService._fallback_search_grants(query, limit)
    
    
    @staticmethod
    def _generate_grant_search_params(query):
        """
        Stage 1: Generate search parameters from natural language query using AI.
        
        Args:
            query: Natural language search query
            
        Returns:
            Dictionary of search parameters
        """
        try:
            print(f"🤖 Generating grant search parameters for query: '{query}'")
            # Configure Gemini
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash')
            print("✅ Gemini model configured successfully")
            
            # Get current date for context
            from django.utils import timezone
            current_date = timezone.now().strftime('%Y-%m-%d')
            
            prompt = f"""
            You are an expert research funding consultant. Your task is to convert natural language queries into search parameters that will help users find relevant research grant opportunities. Always aim for broader, more inclusive search parameters to maximize relevant results.

            Today's date is {current_date}. Use this for any relative date calculations.

            Convert this natural language query into search parameters:
            "{query}"

            Return a JSON object with these possible fields (include a field only if it's relevant to the query):
            - term (string): for general keyword search
              * Include synonyms and related terms
              * Consider research-specific terminology
              * Include both specific and general terms
              * Example: "AI research" could expand to "artificial intelligence machine learning deep learning neural networks computer vision natural language processing"

            - agency_code (string): comma-separated agency codes
              * Include primary agency and related agencies
              * Examples: NSF, NIH, DOE, DOD, NASA, USDA, etc.
              * Consider both specific and broader funding agencies

            - agency_name (string): agency name keywords
              * Use common variations of agency names
              * Example: "NSF" expands to "National Science Foundation"

            - category_keywords (array): funding category keywords
              * Include primary and related research categories
              * Examples: ["STEM", "education", "healthcare", "environment", "technology"]
              * Consider both specific and broader categories

            - min_award_amount (number): minimum award amount in dollars
            - max_award_amount (number): maximum award amount in dollars
              * Only include if specifically mentioned

            - deadline_start (string): YYYY-MM-DD format
            - deadline_end (string): YYYY-MM-DD format
              * For date references:
              * "next X days/weeks/months" -> actual date range
              * "this month" -> current month range
              * "this year" -> current year range
              * If no dates specified, don't include these fields

            - eligible_applicants (array): eligible applicant types
              * Examples: ["universities", "nonprofits", "small businesses", "individuals"]
              * Only include if specifically mentioned

            - research_keywords (array): specific research area keywords
              * Include technical terms, methodologies, or specialized research areas
              * These will be used to search grant descriptions and titles
              * Example: ["machine learning", "climate change", "cancer research", "renewable energy"]
              * Only include if the query suggests specific research areas

            Example inputs and outputs:

            Input: "Find AI research grants from NSF in the next 30 days"
            Output:
            {{
                "term": "artificial intelligence machine learning deep learning neural networks computer vision natural language processing AI research",
                "agency_code": "NSF",
                "agency_name": "National Science Foundation",
                "deadline_start": "{current_date}",
                "deadline_end": "2024-04-19",
                "research_keywords": ["artificial intelligence", "machine learning", "deep learning", "neural networks", "computer vision", "NLP"]
            }}

            Input: "Show me healthcare grants with award amounts over $500,000"
            Output:
            {{
                "term": "healthcare health medical research biomedical clinical trials public health",
                "agency_code": "NIH,CDC,HRSA",
                "agency_name": "National Institutes of Health Centers for Disease Control",
                "min_award_amount": 500000,
                "research_keywords": ["healthcare", "medical research", "biomedical", "clinical trials", "public health", "disease prevention"]
            }}

            Input: "Find environmental research grants for universities"
            Output:
            {{
                "term": "environmental research climate change sustainability renewable energy conservation ecology",
                "agency_code": "NSF,EPA,DOE,USDA",
                "agency_name": "National Science Foundation Environmental Protection Agency Department of Energy",
                "eligible_applicants": ["universities", "colleges"],
                "research_keywords": ["environmental", "climate change", "sustainability", "renewable energy", "conservation", "ecology"]
            }}

            Guidelines:
            1. Always err on the side of being more inclusive with search terms and codes
            2. Include related terms and codes to capture all relevant opportunities
            3. Only include fields that are directly relevant to the query
            4. All fields are optional - only include what makes sense
            5. When in doubt, be broader rather than narrower

            Return ONLY the JSON object, no additional text.
            """
            
            print("📤 Sending prompt to Gemini for parameter generation...")
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            print(f"📥 Received response from Gemini: {response_text[:200]}...")
            
            # Parse the JSON response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                params = json.loads(json_text)
                print(f"✅ Successfully parsed search parameters: {params}")
                return params
            
            print("⚠️ Could not parse JSON from Gemini response")
            return {}
            
        except Exception as e:
            print(f"❌ Failed to generate search parameters: {str(e)}")
            logger.error(f"Failed to generate search parameters: {str(e)}")
            return {}
    
    @staticmethod
    def _score_grants_with_params(query, search_params, grants):
        """
        Stage 2: Score grants using generated search parameters.
        
        Args:
            query: Original natural language query
            search_params: Generated search parameters
            grants: List of Grant objects to score
            
        Returns:
            List of (grant, score) tuples sorted by relevance
        """
        if not grants:
            return []
        
        try:
            print(f"🔍 Scoring {len(grants)} grants using search parameters...")
            scored_grants = []
            
            for grant in grants:
                score = 0
                score_details = {}  # For debugging
                
                # Term matching score
                if search_params.get('term'):
                    term_score = 0
                    term_matches = []
                    terms = search_params['term'].split()
                    for term in terms:
                        if len(term) >= 3:
                            # Check title
                            if term.lower() in grant.title.lower():
                                term_score += 5
                                term_matches.append(f"title:{term}")
                            
                            # Check description
                            if grant.description and term.lower() in grant.description.lower():
                                term_score += 4
                                term_matches.append(f"desc:{term}")
                            
                            # Check category
                            if grant.category_of_funding_activity and term.lower() in grant.category_of_funding_activity.lower():
                                term_score += 3
                                term_matches.append(f"category:{term}")
                    
                    # Normalize term score
                    if terms:
                        term_score = min(term_score, 25)  # Cap at 25 points
                        score += term_score
                        score_details['term_score'] = term_score
                        score_details['term_matches'] = term_matches
                
                # Agency code scoring
                if search_params.get('agency_code') and grant.agency_code:
                    agency_codes = [code.strip() for code in search_params['agency_code'].split(',')]
                    if grant.agency_code in agency_codes:
                        agency_score = 20
                        score += agency_score
                        score_details['agency_score'] = agency_score
                        score_details['agency_match'] = grant.agency_code
                
                # Agency name scoring
                if search_params.get('agency_name') and grant.agency_name:
                    agency_score = 0
                    agency_matches = []
                    agency_terms = search_params['agency_name'].split()
                    for term in agency_terms:
                        if len(term) >= 3 and term.lower() in grant.agency_name.lower():
                            agency_score += 4
                            agency_matches.append(term)
                    
                    if agency_score > 0:
                        agency_score = min(agency_score, 15)  # Cap at 15 points
                        score += agency_score
                        score_details['agency_name_score'] = agency_score
                        score_details['agency_name_matches'] = agency_matches
                
                # Category keywords scoring
                if search_params.get('category_keywords') and grant.category_of_funding_activity:
                    category_score = 0
                    category_matches = []
                    for keyword in search_params['category_keywords']:
                        if keyword.lower() in grant.category_of_funding_activity.lower():
                            category_score += 8
                            category_matches.append(keyword)
                    
                    if category_score > 0:
                        category_score = min(category_score, 15)  # Cap at 15 points
                        score += category_score
                        score_details['category_score'] = category_score
                        score_details['category_matches'] = category_matches
                
                # Award amount scoring
                if search_params.get('min_award_amount') or search_params.get('max_award_amount'):
                    if grant.award_floor is not None or grant.award_ceiling is not None:
                        award_amount_matches = True
                        
                        # Check minimum amount
                        if search_params.get('min_award_amount'):
                            min_amount = search_params['min_award_amount']
                            if grant.award_floor and grant.award_floor < min_amount:
                                award_amount_matches = False
                        
                        # Check maximum amount
                        if search_params.get('max_award_amount'):
                            max_amount = search_params['max_award_amount']
                            if grant.award_ceiling and grant.award_ceiling > max_amount:
                                award_amount_matches = False
                        
                        if award_amount_matches:
                            award_score = 15
                            score += award_score
                            score_details['award_score'] = award_score
                            score_details['award_range'] = f"{grant.award_floor}-{grant.award_ceiling}"
                
                # Deadline scoring
                if search_params.get('deadline_start') and search_params.get('deadline_end') and grant.close_date:
                    try:
                        from datetime import datetime
                        start_date = datetime.strptime(search_params['deadline_start'], '%Y-%m-%d').date()
                        end_date = datetime.strptime(search_params['deadline_end'], '%Y-%m-%d').date()
                        deadline_date = grant.close_date.date()
                        
                        if start_date <= deadline_date <= end_date:
                            # Higher score for deadlines in the middle of the range
                            range_days = (end_date - start_date).days
                            if range_days > 0:
                                position = (deadline_date - start_date).days / range_days
                                # Score higher for deadlines in the middle of the range
                                deadline_score = 10 * (1 - abs(position - 0.5) * 2)
                                score += deadline_score
                                score_details['deadline_score'] = deadline_score
                                score_details['deadline_position'] = position
                            else:
                                deadline_score = 10
                                score += deadline_score
                                score_details['deadline_score'] = deadline_score
                    except Exception as e:
                        print(f"Error in deadline scoring: {str(e)}")
                
                # Eligible applicants scoring
                if search_params.get('eligible_applicants') and grant.eligible_applicants:
                    eligible_score = 0
                    eligible_matches = []
                    for applicant_type in search_params['eligible_applicants']:
                        if applicant_type.lower() in grant.eligible_applicants.lower():
                            eligible_score += 8
                            eligible_matches.append(applicant_type)
                    
                    if eligible_score > 0:
                        eligible_score = min(eligible_score, 12)  # Cap at 12 points
                        score += eligible_score
                        score_details['eligible_score'] = eligible_score
                        score_details['eligible_matches'] = eligible_matches
                
                # Research keywords scoring
                if search_params.get('research_keywords'):
                    research_score = 0
                    research_matches = []
                    for keyword in search_params['research_keywords']:
                        # Check title
                        if keyword.lower() in grant.title.lower():
                            research_score += 6
                            research_matches.append(f"title:{keyword}")
                        
                        # Check description
                        if grant.description and keyword.lower() in grant.description.lower():
                            research_score += 5
                            research_matches.append(f"desc:{keyword}")
                        
                        # Check category
                        if grant.category_of_funding_activity and keyword.lower() in grant.category_of_funding_activity.lower():
                            research_score += 4
                            research_matches.append(f"category:{keyword}")
                    
                    if research_score > 0:
                        research_score = min(research_score, 20)  # Cap at 20 points
                        score += research_score
                        score_details['research_score'] = research_score
                        score_details['research_matches'] = research_matches
                
                # Recency bonus - newer grants get a small boost
                if grant.close_date:
                    from django.utils import timezone
                    days_until_deadline = (grant.close_date - timezone.now().date()).days
                    if days_until_deadline > 0 and days_until_deadline <= 90:  # Upcoming deadlines
                        recency_score = 5 * (1 - days_until_deadline/90)  # Linear decay from 5 to 0 over 90 days
                        score += recency_score
                        score_details['recency_score'] = recency_score
                        score_details['days_until_deadline'] = days_until_deadline
                
                # Only include grants with a minimum score
                if score > 3:  # Adjust threshold as needed
                    scored_grants.append((grant, score))
            
            print(f"📊 Scored {len(scored_grants)} grants with minimum relevance")
            
            # Sort by score (descending)
            scored_grants.sort(key=lambda x: x[1], reverse=True)
            
            # Print top results for debugging
            for i, (grant, score) in enumerate(scored_grants[:3]):
                print(f"Top result #{i+1}: {grant.title} (Score: {score})")
            
            return scored_grants
                
        except Exception as e:
            logger.error(f"Failed to score grants with parameters: {str(e)}")
            # Return grants with default score
            return [(grant, 0.5) for grant in grants]
    
    @staticmethod
    def _score_grants_with_ai(query, grants):
        """
        Score grants using AI for relevance to the query.
        
        Args:
            query: Original natural language query
            grants: List of Grant objects to score
            
        Returns:
            List of (grant, score) tuples sorted by relevance
        """
        if not grants:
            return []
        
        try:
            # Configure Gemini
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Prepare grants data for AI analysis
            grants_data = []
            for grant in grants:
                grant_data = {
                    'id': grant.id,
                    'title': grant.title,
                    'description': grant.description[:500] if grant.description else '',
                    'agency_name': grant.agency_name,
                    'category_of_funding_activity': grant.category_of_funding_activity,
                    'award_floor': grant.award_floor,
                    'award_ceiling': grant.award_ceiling,
                    'close_date': grant.close_date.isoformat() if grant.close_date else None,
                    'eligible_applicants': grant.eligible_applicants,
                }
                grants_data.append(grant_data)
            
            prompt = f"""
            You are an expert research funding consultant analyzing grant opportunities for relevance.
            
            ORIGINAL USER QUERY: "{query}"
            
            GRANTS TO SCORE:
            {json.dumps(grants_data, indent=2, cls=DecimalEncoder)}
            
            Score each grant based on how well it matches the user's query. Consider:
            
            1. DIRECT RELEVANCE: How directly does the grant match the user's research interests?
            2. KEYWORD ALIGNMENT: How well do the grant title/description align with query keywords?
            3. RESEARCH DOMAIN FIT: Does the grant fall within the user's research domain?
            4. FUNDING SCOPE: Is the funding amount and scope appropriate for the user's needs?
            5. TIMELINE RELEVANCE: Is the deadline reasonable for the user's timeline?
            6. ELIGIBILITY MATCH: Does the user likely qualify for this grant?
            
            IMPORTANT: Score ALL grants, even if they seem unrelated. Use a scoring range of 0.0 to 1.0:
            - 0.9-1.0: Perfect or near-perfect match
            - 0.7-0.8: Strong relevance and good match
            - 0.5-0.6: Moderate relevance, some connection
            - 0.3-0.4: Weak relevance, minimal connection
            - 0.0-0.2: No relevance or completely unrelated
            
            Return ONLY a JSON object with grant IDs and relevance scores:
            {{
                "rankings": [
                    {{"grant_id": 1, "relevance_score": 0.95, "reason": "Perfect match for AI research with appropriate funding"}},
                    {{"grant_id": 2, "relevance_score": 0.87, "reason": "Strong alignment with machine learning focus"}},
                    {{"grant_id": 3, "relevance_score": 0.15, "reason": "No clear connection to query"}}
                ]
            }}
            
            Score ALL grants provided. Use scores between 0.0 and 1.0.
            """
            
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Parse the JSON response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                result_data = json.loads(json_text)
                
                # Create mapping of grant_id to score
                score_map = {}
                for ranking in result_data.get('rankings', []):
                    grant_id = ranking.get('grant_id')
                    score = ranking.get('relevance_score', 0.0)
                    score_map[grant_id] = score
                
                # Create scored grants list
                scored_grants = []
                for grant in grants:
                    score = score_map.get(grant.id, 0.0)
                    scored_grants.append((grant, score))
                
                # Sort by relevance score
                scored_grants.sort(key=lambda x: x[1], reverse=True)
                return scored_grants
                
        except Exception as e:
            logger.error(f"Failed to rank grants with AI: {str(e)}")
            # Return grants with default score
            return [(grant, 0.5) for grant in grants]
    
    @staticmethod
    def search_profiles_with_nlp(query, limit=20):
        """
        Search researcher profiles using two-stage scoring algorithm.
        
        Stage 1: Generate search parameters from natural language query
        Stage 2: Score all profiles using the generated parameters
        
        Args:
            query: Natural language search query
            limit: Maximum number of results to return
            
        Returns:
            List of ResearcherProfile objects with relevance scores
        """
        if not query or not query.strip():
            return []
        
        # Check if we have the required API key
        if not hasattr(settings, 'GEMINI_API_KEY') or not settings.GEMINI_API_KEY:
            logger.warning("No Gemini API key available for natural language search")
            return NaturalLanguageSearchService._fallback_search_profiles(query, limit)
        
        try:
            print(f"🔍 Starting two-stage profile search with query: '{query}'")
            
            # Stage 1: Generate search parameters from natural language query
            print("📝 Stage 1: Generating search parameters using AI...")
            search_params = NaturalLanguageSearchService._generate_profile_search_params(query)
            logger.info(f"Generated search parameters for query '{query}': {search_params}")
            print(f"✅ Generated search parameters: {search_params}")
            
            # Stage 2: Get all profiles and score them using the parameters
            print("📊 Stage 2: Retrieving profiles from database...")
            all_profiles = list(ResearcherProfile.objects.all()[:100])
            logger.info(f"Retrieved {len(all_profiles)} profiles from database")
            print(f"✅ Retrieved {len(all_profiles)} profiles from database")
            
            if not all_profiles:
                return []
            
            # Score all profiles using the generated parameters
            print("🤖 Stage 2: Scoring all profiles using generated parameters...")
            scored_profiles = NaturalLanguageSearchService._score_profiles_with_params(query, search_params, all_profiles)
            print(f"✅ Scoring completed. Returning top {min(limit, len(scored_profiles))} results")
            
            # Return top results up to limit
            return scored_profiles[:limit]
                
        except Exception as e:
            logger.error(f"Natural language search failed: {str(e)}")
            return NaturalLanguageSearchService._fallback_search_profiles(query, limit)
    
    
    @staticmethod
    def _generate_profile_search_params(query):
        """
        Stage 1: Generate search parameters from natural language query using AI.
        
        Args:
            query: Natural language search query
            
        Returns:
            Dictionary of search parameters
        """
        try:
            print(f"🤖 Generating profile search parameters for query: '{query}'")
            # Configure Gemini
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash')
            print("✅ Gemini model configured successfully")
            
            prompt = f"""
            You are an expert academic networking consultant. Your task is to convert natural language queries into search parameters that will help users find relevant researcher profiles. Always aim for broader, more inclusive search parameters to maximize relevant results.

            Convert this natural language query into search parameters:
            "{query}"

            Return a JSON object with these possible fields (include a field only if it's relevant to the query):
            - term (string): for general keyword search
              * Include synonyms and related terms
              * Consider academic and research terminology
              * Include both specific and general terms
              * Example: "AI researchers" could expand to "artificial intelligence machine learning deep learning neural networks computer vision natural language processing"

            - name_keywords (array): researcher name keywords - CRITICAL FOR NAME SEARCHES
              * Extract ALL possible name variations from the query
              * Include first names, last names, full names, and common variations
              * Include nicknames, shortened forms, and alternative spellings
              * Examples: "John" -> ["John", "Johnny", "Jon", "Jonathan"]
              * Examples: "Smith" -> ["Smith", "Smyth"]
              * Examples: "Dr. Sarah Johnson" -> ["Sarah", "Johnson", "Sarah Johnson", "Dr. Sarah Johnson"]
              * ALWAYS include this field if ANY name is mentioned in the query

            - position_keywords (array): job title/position keywords
              * Include academic positions and research roles
              * Examples: ["professor", "researcher", "scientist", "postdoc", "graduate student"]
              * Consider both specific and general positions

            - department_keywords (array): department keywords
              * Include academic departments and research units
              * Examples: ["Computer Science", "Biology", "Physics", "Engineering", "Medicine"]
              * Consider both specific and broader departments

            - school_keywords (array): institution keywords
              * Include university names and types
              * Examples: ["Stanford", "MIT", "Harvard", "research university", "community college"]
              * Consider both specific and general institution types

            - expertise_keywords (array): research expertise keywords
              * Include technical terms, methodologies, and research areas
              * These will be used to search researcher expertise and bio
              * Example: ["machine learning", "climate change", "cancer research", "renewable energy"]
              * Only include if the query suggests specific research areas

            - education_keywords (array): educational background keywords
              * Include degrees, institutions, and educational terms
              * Examples: ["PhD", "PhD in Computer Science", "Stanford", "postdoc"]
              * Only include if specifically mentioned

            - bio_keywords (array): biography/research description keywords
              * Include research methodologies, approaches, and interests
              * These will be used to search researcher biographies
              * Example: ["collaborative research", "interdisciplinary", "clinical trials", "field work"]
              * Only include if the query suggests specific research approaches

            Example inputs and outputs:

            Input: "Find John Smith"
            Output:
            {{
                "name_keywords": ["John", "Smith", "John Smith", "Johnny", "Jon", "Jonathan"],
                "term": "John Smith"
            }}

            Input: "Show me Dr. Sarah"
            Output:
            {{
                "name_keywords": ["Sarah", "Dr. Sarah", "Sara", "Sally"],
                "position_keywords": ["professor", "doctor", "researcher"],
                "term": "Sarah doctor"
            }}

            Input: "Find AI researchers at Stanford"
            Output:
            {{
                "term": "artificial intelligence machine learning deep learning neural networks computer vision natural language processing AI research",
                "school_keywords": ["Stanford", "Stanford University"],
                "expertise_keywords": ["artificial intelligence", "machine learning", "deep learning", "neural networks", "computer vision", "NLP"],
                "position_keywords": ["professor", "researcher", "scientist", "postdoc"]
            }}

            Input: "Show me biology professors with PhD in genetics"
            Output:
            {{
                "term": "biology genetics molecular biology genomics bioinformatics",
                "department_keywords": ["Biology", "Genetics", "Molecular Biology", "Biochemistry"],
                "position_keywords": ["professor", "associate professor", "assistant professor"],
                "education_keywords": ["PhD", "PhD in Genetics", "PhD in Biology"],
                "expertise_keywords": ["genetics", "molecular biology", "genomics", "bioinformatics", "gene expression"]
            }}

            Input: "Find climate change researchers for collaboration"
            Output:
            {{
                "term": "climate change global warming environmental science sustainability renewable energy",
                "expertise_keywords": ["climate change", "global warming", "environmental science", "sustainability", "renewable energy", "carbon emissions"],
                "position_keywords": ["professor", "researcher", "scientist", "postdoc", "graduate student"],
                "bio_keywords": ["collaborative research", "interdisciplinary", "field work", "climate modeling"]
            }}

            Input: "Peter from engineering"
            Output:
            {{
                "name_keywords": ["Peter", "Pete", "Petros", "Pedro"],
                "department_keywords": ["Engineering", "Computer Engineering", "Mechanical Engineering", "Electrical Engineering"],
                "term": "Peter engineering"
            }}

            Input: "Maria in computer science"
            Output:
            {{
                "name_keywords": ["Maria", "Mary", "Marie", "Mariam"],
                "department_keywords": ["Computer Science", "CS", "Computing", "Software Engineering"],
                "term": "Maria computer science"
            }}

            Guidelines:
            1. ALWAYS extract name keywords when ANY name is mentioned - this is critical for finding specific people
            2. Include common name variations, nicknames, and alternative spellings
            3. Always err on the side of being more inclusive with search terms
            4. Include related terms to capture all relevant researchers
            5. Only include fields that are directly relevant to the query
            6. All fields are optional - only include what makes sense
            7. When in doubt, be broader rather than narrower
            8. For name searches, prioritize name_keywords over other fields

            Return ONLY the JSON object, no additional text.
            """
            
            print("📤 Sending prompt to Gemini for parameter generation...")
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            print(f"📥 Received response from Gemini: {response_text[:200]}...")
            
            # Parse the JSON response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                params = json.loads(json_text)
                print(f"✅ Successfully parsed search parameters: {params}")
                return params
            
            print("⚠️ Could not parse JSON from Gemini response")
            return {}
            
        except Exception as e:
            print(f"❌ Failed to generate search parameters: {str(e)}")
            logger.error(f"Failed to generate search parameters: {str(e)}")
            return {}
    
    @staticmethod
    def _score_profiles_with_params(query, search_params, profiles):
        """
        Stage 2: Score profiles using generated search parameters.
        
        Args:
            query: Original natural language query
            search_params: Generated search parameters
            profiles: List of ResearcherProfile objects to score
            
        Returns:
            List of (profile, score) tuples sorted by relevance
        """
        if not profiles:
            return []
        
        try:
            print(f"🔍 Scoring {len(profiles)} profiles using search parameters...")
            scored_profiles = []
            
            for profile in profiles:
                score = 0
                score_details = {}  # For debugging
                
                # Term matching score
                if search_params.get('term'):
                    term_score = 0
                    term_matches = []
                    terms = search_params['term'].split()
                    for term in terms:
                        if len(term) >= 3:
                            # Check name
                            if term.lower() in profile.name.lower():
                                term_score += 5
                                term_matches.append(f"name:{term}")
                            
                            # Check bio
                            if profile.bio and term.lower() in profile.bio.lower():
                                term_score += 4
                                term_matches.append(f"bio:{term}")
                            
                            # Check position
                            if profile.position and term.lower() in profile.position.lower():
                                term_score += 3
                                term_matches.append(f"position:{term}")
                            
                            # Check department
                            if profile.department and term.lower() in profile.department.lower():
                                term_score += 3
                                term_matches.append(f"department:{term}")
                    
                    # Normalize term score
                    if terms:
                        term_score = min(term_score, 25)  # Cap at 25 points
                        score += term_score
                        score_details['term_score'] = term_score
                        score_details['term_matches'] = term_matches
                
                # Name keywords scoring - ENHANCED FOR BETTER NAME MATCHING
                if search_params.get('name_keywords'):
                    name_score = 0
                    name_matches = []
                    
                    # Normalize profile name for better matching
                    profile_name_normalized = NaturalLanguageSearchService._normalize_name(profile.name)
                    profile_name_parts = NaturalLanguageSearchService._extract_name_parts(profile_name_normalized)
                    
                    for keyword in search_params['name_keywords']:
                        keyword_normalized = NaturalLanguageSearchService._normalize_name(keyword)
                        keyword_parts = NaturalLanguageSearchService._extract_name_parts(keyword_normalized)
                        
                        # Exact full name match (highest priority)
                        if keyword_normalized == profile_name_normalized:
                            name_score += 50
                            name_matches.append(f"exact_full:{keyword}")
                        
                        # Check for exact matches with individual name parts
                        for keyword_part in keyword_parts:
                            for profile_part in profile_name_parts:
                                if keyword_part == profile_part and len(keyword_part) >= 2:
                                    # First name match (usually first part)
                                    if profile_name_parts and keyword_part == profile_name_parts[0]:
                                        name_score += 35
                                        name_matches.append(f"first_name:{keyword}")
                                    # Last name match (usually last part)
                                    elif len(profile_name_parts) > 1 and keyword_part == profile_name_parts[-1]:
                                        name_score += 30
                                        name_matches.append(f"last_name:{keyword}")
                                    # Middle name or other part
                                    else:
                                        name_score += 20
                                        name_matches.append(f"name_part:{keyword}")
                        
                        # Partial name match (for nicknames, variations)
                        if keyword_normalized in profile_name_normalized:
                            # Higher score for longer matches
                            match_ratio = len(keyword_normalized) / len(profile_name_normalized)
                            if match_ratio >= 0.5:  # At least 50% of the name
                                name_score += 15
                                name_matches.append(f"partial_long:{keyword}")
                            elif match_ratio >= 0.3:  # At least 30% of the name
                                name_score += 10
                                name_matches.append(f"partial_medium:{keyword}")
                            else:
                                name_score += 5
                                name_matches.append(f"partial_short:{keyword}")
                    
                    if name_score > 0:
                        name_score = min(name_score, 50)  # Increased cap to 50 points for name matches
                        score += name_score
                        score_details['name_score'] = name_score
                        score_details['name_matches'] = name_matches
                
                # Position keywords scoring
                if search_params.get('position_keywords') and profile.position:
                    position_score = 0
                    position_matches = []
                    for keyword in search_params['position_keywords']:
                        if keyword.lower() in profile.position.lower():
                            position_score += 8
                            position_matches.append(keyword)
                    
                    if position_score > 0:
                        position_score = min(position_score, 15)  # Cap at 15 points
                        score += position_score
                        score_details['position_score'] = position_score
                        score_details['position_matches'] = position_matches
                
                # Department keywords scoring
                if search_params.get('department_keywords') and profile.department:
                    department_score = 0
                    department_matches = []
                    for keyword in search_params['department_keywords']:
                        if keyword.lower() in profile.department.lower():
                            department_score += 8
                            department_matches.append(keyword)
                    
                    if department_score > 0:
                        department_score = min(department_score, 15)  # Cap at 15 points
                        score += department_score
                        score_details['department_score'] = department_score
                        score_details['department_matches'] = department_matches
                
                # School keywords scoring
                if search_params.get('school_keywords') and profile.school:
                    school_score = 0
                    school_matches = []
                    for keyword in search_params['school_keywords']:
                        if keyword.lower() in profile.school.lower():
                            school_score += 8
                            school_matches.append(keyword)
                    
                    if school_score > 0:
                        school_score = min(school_score, 15)  # Cap at 15 points
                        score += school_score
                        score_details['school_score'] = school_score
                        score_details['school_matches'] = school_matches
                
                # Expertise keywords scoring
                if search_params.get('expertise_keywords') and profile.expertise:
                    expertise_score = 0
                    expertise_matches = []
                    for keyword in search_params['expertise_keywords']:
                        if keyword.lower() in str(profile.expertise).lower():
                            expertise_score += 10
                            expertise_matches.append(keyword)
                    
                    if expertise_score > 0:
                        expertise_score = min(expertise_score, 20)  # Cap at 20 points
                        score += expertise_score
                        score_details['expertise_score'] = expertise_score
                        score_details['expertise_matches'] = expertise_matches
                
                # Education keywords scoring
                if search_params.get('education_keywords') and profile.education:
                    education_score = 0
                    education_matches = []
                    for keyword in search_params['education_keywords']:
                        if keyword.lower() in profile.education.lower():
                            education_score += 8
                            education_matches.append(keyword)
                    
                    if education_score > 0:
                        education_score = min(education_score, 12)  # Cap at 12 points
                        score += education_score
                        score_details['education_score'] = education_score
                        score_details['education_matches'] = education_matches
                
                # Bio keywords scoring
                if search_params.get('bio_keywords') and profile.bio:
                    bio_score = 0
                    bio_matches = []
                    for keyword in search_params['bio_keywords']:
                        if keyword.lower() in profile.bio.lower():
                            bio_score += 6
                            bio_matches.append(keyword)
                    
                    if bio_score > 0:
                        bio_score = min(bio_score, 15)  # Cap at 15 points
                        score += bio_score
                        score_details['bio_score'] = bio_score
                        score_details['bio_matches'] = bio_matches
                
                # Only include profiles with a minimum score
                if score > 3:  # Adjust threshold as needed
                    scored_profiles.append((profile, score))
            
            print(f"📊 Scored {len(scored_profiles)} profiles with minimum relevance")
            
            # Sort by score (descending)
            scored_profiles.sort(key=lambda x: x[1], reverse=True)
            
            # Print top results for debugging
            for i, (profile, score) in enumerate(scored_profiles[:3]):
                print(f"Top result #{i+1}: {profile.name} (Score: {score})")
            
            return scored_profiles
                
        except Exception as e:
            logger.error(f"Failed to score profiles with parameters: {str(e)}")
            # Return profiles with default score
            return [(profile, 0.5) for profile in profiles]
    
    @staticmethod
    def _score_profiles_with_ai(query, profiles):
        """
        Score profiles using AI for relevance to the query.
        
        Args:
            query: Original natural language query
            profiles: List of ResearcherProfile objects to score
            
        Returns:
            List of (profile, score) tuples sorted by relevance
        """
        if not profiles:
            return []
        
        try:
            # Configure Gemini
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Prepare profiles data for AI analysis
            profiles_data = []
            for profile in profiles:
                profile_data = {
                    'email': profile.email,
                    'name': profile.name,
                    'position': profile.position,
                    'department': profile.department,
                    'school': profile.school,
                    'expertise': profile.expertise,
                    'education': profile.education,
                    'bio': profile.bio[:500] if profile.bio else '',
                }
                profiles_data.append(profile_data)
            
            prompt = f"""
            You are an expert academic networking consultant analyzing researcher profiles for relevance.
            
            ORIGINAL USER QUERY: "{query}"
            
            RESEARCHER PROFILES TO SCORE:
            {json.dumps(profiles_data, indent=2, cls=DecimalEncoder)}
            
            Score each researcher based on how well they match the user's query. Consider:
            
            1. EXPERTISE ALIGNMENT: How well does the researcher's expertise match the query?
            2. RESEARCH DOMAIN FIT: Does the researcher work in the relevant research domain?
            3. COLLABORATION POTENTIAL: Would this researcher be a good collaborator for the user's needs?
            4. ACADEMIC CREDIBILITY: Does the researcher have appropriate credentials and experience?
            5. INSTITUTIONAL FIT: Is the researcher at an appropriate institution level?
            6. RESEARCH METHODOLOGY: Does the researcher use relevant methodologies or approaches?
            
            IMPORTANT: Score ALL profiles, even if they seem unrelated. Use a scoring range of 0.0 to 1.0:
            - 0.9-1.0: Perfect or near-perfect match
            - 0.7-0.8: Strong relevance and good match
            - 0.5-0.6: Moderate relevance, some connection
            - 0.3-0.4: Weak relevance, minimal connection
            - 0.0-0.2: No relevance or completely unrelated
            
            Return ONLY a JSON object with profile emails and relevance scores:
            {{
                "rankings": [
                    {{"profile_email": "researcher@university.edu", "relevance_score": 0.95, "reason": "Perfect match for AI research with strong credentials"}},
                    {{"profile_email": "scientist@college.edu", "relevance_score": 0.87, "reason": "Strong expertise in machine learning"}},
                    {{"profile_email": "unrelated@college.edu", "relevance_score": 0.12, "reason": "No clear connection to query"}}
                ]
            }}
            
            Score ALL profiles provided. Use scores between 0.0 and 1.0.
            """
            
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Parse the JSON response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                result_data = json.loads(json_text)
                
                # Create mapping of profile_email to score
                score_map = {}
                for ranking in result_data.get('rankings', []):
                    profile_email = ranking.get('profile_email')
                    score = ranking.get('relevance_score', 0.0)
                    score_map[profile_email] = score
                
                # Create scored profiles list
                scored_profiles = []
                for profile in profiles:
                    score = score_map.get(profile.email, 0.0)
                    scored_profiles.append((profile, score))
                
                # Sort by relevance score
                scored_profiles.sort(key=lambda x: x[1], reverse=True)
                return scored_profiles
                
        except Exception as e:
            logger.error(f"Failed to rank profiles with AI: {str(e)}")
            # Return profiles with default score
            return [(profile, 0.5) for profile in profiles]
    
    @staticmethod
    def _fallback_search_grants(query, limit):
        """Fallback to basic keyword search when AI is not available"""
        grants_query = Grant.objects.filter(
            Q(title__icontains=query) | 
            Q(description__icontains=query) |
            Q(category_of_funding_activity__icontains=query)
        )[:limit]
        
        # Return with default score of 0.5
        return [(grant, 0.5) for grant in grants_query]
    
    @staticmethod
    def _fallback_search_profiles(query, limit):
        """Fallback to basic keyword search when AI is not available"""
        # Split query into individual words for better matching
        query_words = query.lower().split()
        
        # Build comprehensive search query
        search_q = Q()
        for word in query_words:
            search_q |= (
                Q(name__icontains=word) | 
                Q(bio__icontains=word) |
                Q(department__icontains=word) |
                Q(position__icontains=word) |
                Q(school__icontains=word) |
                Q(education__icontains=word)
            )
        
        profiles_query = ResearcherProfile.objects.filter(search_q)[:limit]
        
        # Return with default score of 0.5
        return [(profile, 0.5) for profile in profiles_query]
