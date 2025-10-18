"""
Natural Language Search Service

This service provides intelligent natural language search capabilities for grants and profiles
using a two-stage AI approach:
1. Stage 1: Generate database filters from natural language query
2. Stage 2: AI ranking of top 25 results for relevance scoring
"""

import json
import logging
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
    def search_grants_with_nlp(query, limit=20):
        """
        Search grants using two-stage natural language processing.
        
        Stage 1: Generate database filters from natural language query
        Stage 2: AI ranking of top 25 results for relevance scoring
        
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
            print(f"🔍 Starting natural language search for grants with query: '{query}'")
            
            # Stage 1: Generate database filters
            print("📝 Stage 1: Generating database filters using AI...")
            filters = NaturalLanguageSearchService._generate_grant_filters(query)
            logger.info(f"Generated filters for query '{query}': {filters}")
            print(f"✅ Generated filters: {filters}")
            
            # Apply filters to get candidate grants
            print("🔎 Stage 1: Applying filters to database...")
            candidate_grants = NaturalLanguageSearchService._apply_grant_filters(filters)
            logger.info(f"Found {len(candidate_grants)} candidate grants")
            print(f"✅ Found {len(candidate_grants)} candidate grants")
            
            if not candidate_grants:
                return []
            
            # Stage 2: AI ranking of top 25 results
            print("🤖 Stage 2: AI ranking and relevance scoring...")
            if len(candidate_grants) > 25:
                # Take top 25 for AI ranking
                top_candidates = candidate_grants[:25]
                print(f"📊 Taking top 25 candidates for AI ranking (from {len(candidate_grants)} total)")
            else:
                top_candidates = candidate_grants
                print(f"📊 Using all {len(candidate_grants)} candidates for AI ranking")
            
            scored_grants = NaturalLanguageSearchService._rank_grants_with_ai(query, top_candidates)
            print(f"✅ AI ranking completed. Returning top {min(limit, len(scored_grants))} results")
            
            # Return top results up to limit
            return scored_grants[:limit]
                
        except Exception as e:
            print(f"❌ Natural language search failed: {str(e)}")
            logger.error(f"Natural language search failed: {str(e)}")
            print("🔄 Falling back to basic keyword search...")
            return NaturalLanguageSearchService._fallback_search_grants(query, limit)
    
    @staticmethod
    def _generate_grant_filters(query):
        """
        Stage 1: Generate database filters from natural language query using AI.
        
        Args:
            query: Natural language search query
            
        Returns:
            Dictionary of database filters
        """
        try:
            print(f"🤖 Generating grant filters for query: '{query}'")
            # Configure Gemini
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash')
            print("✅ Gemini model configured successfully")
            
            prompt = f"""
            You are an expert database query generator for research grant databases.
            
            USER SEARCH QUERY: "{query}"
            
            Based on this natural language query, generate appropriate database filters to find relevant grants.
            
            Available grant fields for filtering:
            - title: Grant title (text search)
            - description: Grant description (text search)
            - agency_code: Agency code (exact match: NSF, NIH, ED, DOE, etc.)
            - agency_name: Agency name (text search)
            - category_of_funding_activity: Funding category (text search)
            - award_floor: Minimum award amount (number)
            - award_ceiling: Maximum award amount (number)
            - close_date: Application deadline (date)
            - eligible_applicants: Eligible applicant types (text search)
            
            Generate filters that will help find the most relevant grants. Consider:
            1. Keywords and phrases from the query
            2. Research areas and disciplines mentioned
            3. Funding agencies that might be relevant
            4. Award amounts if mentioned
            5. Deadlines or time constraints
            6. Applicant eligibility requirements
            
            Return ONLY a JSON object with the filters:
            {{
                "text_filters": {{
                    "title_keywords": ["keyword1", "keyword2"],
                    "description_keywords": ["keyword1", "keyword2"],
                    "category_keywords": ["category1", "category2"],
                    "agency_name_keywords": ["agency1", "agency2"]
                }},
                "exact_filters": {{
                    "agency_code": "NSF",
                    "eligible_applicants": "universities"
                }},
                "numeric_filters": {{
                    "min_award_floor": 100000,
                    "max_award_ceiling": 1000000
                }},
                "date_filters": {{
                    "close_date_after": "2024-01-01",
                    "close_date_before": "2024-12-31"
                }}
            }}
            
            Only include filters that are relevant to the query. Use null for unused filters.
            """
            
            print("📤 Sending prompt to Gemini for filter generation...")
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            print(f"📥 Received response from Gemini: {response_text[:200]}...")
            
            # Parse the JSON response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                filters = json.loads(json_text)
                print(f"✅ Successfully parsed filters: {filters}")
                return filters
            
            print("⚠️ Could not parse JSON from Gemini response")
            return {}
            
        except Exception as e:
            print(f"❌ Failed to generate filters: {str(e)}")
            logger.error(f"Failed to generate filters: {str(e)}")
            return {}
    
    @staticmethod
    def _apply_grant_filters(filters):
        """
        Apply generated filters to the Grant database.
        
        Args:
            filters: Dictionary of database filters
            
        Returns:
            List of Grant objects matching the filters
        """
        try:
            print(f"🔎 Applying filters to grant database...")
            query = Grant.objects.all()
            
            # Apply text filters - use OR logic between different field types
            text_filters = filters.get('text_filters', {})
            
            # Combine all text searches with OR logic
            text_q = Q()
            
            # Title keywords
            title_keywords = text_filters.get('title_keywords', [])
            if title_keywords:
                for keyword in title_keywords:
                    text_q |= Q(title__icontains=keyword)
            
            # Description keywords
            desc_keywords = text_filters.get('description_keywords', [])
            if desc_keywords:
                for keyword in desc_keywords:
                    text_q |= Q(description__icontains=keyword)
            
            # Category keywords
            category_keywords = text_filters.get('category_keywords', [])
            if category_keywords:
                for keyword in category_keywords:
                    text_q |= Q(category_of_funding_activity__icontains=keyword)
            
            # Agency name keywords
            agency_keywords = text_filters.get('agency_name_keywords', [])
            if agency_keywords:
                for keyword in agency_keywords:
                    text_q |= Q(agency_name__icontains=keyword)
            
            # Apply the combined text query if we have any text filters
            if text_q:
                query = query.filter(text_q)
            
            # Apply exact filters
            exact_filters = filters.get('exact_filters', {})
            if exact_filters.get('agency_code'):
                query = query.filter(agency_code=exact_filters['agency_code'])
            if exact_filters.get('eligible_applicants'):
                query = query.filter(eligible_applicants__icontains=exact_filters['eligible_applicants'])
            
            # Apply numeric filters
            numeric_filters = filters.get('numeric_filters', {})
            if numeric_filters.get('min_award_floor'):
                query = query.filter(award_floor__gte=numeric_filters['min_award_floor'])
            if numeric_filters.get('max_award_ceiling'):
                query = query.filter(award_ceiling__lte=numeric_filters['max_award_ceiling'])
            
            # Apply date filters
            date_filters = filters.get('date_filters', {})
            if date_filters.get('close_date_after'):
                close_after = parse_date(date_filters['close_date_after'])
                if close_after:
                    query = query.filter(close_date__gte=close_after)
            if date_filters.get('close_date_before'):
                close_before = parse_date(date_filters['close_date_before'])
                if close_before:
                    query = query.filter(close_date__lte=close_before)
            
            # Order by close date (upcoming first) and return up to 100 results
            grants = list(query.order_by('close_date')[:100])
            print(f"📊 Retrieved {len(grants)} grants from database")
            
            # Remove duplicates based on grant ID while preserving order
            seen_grant_ids = set()
            unique_grants = []
            for grant in grants:
                if grant.id not in seen_grant_ids:
                    seen_grant_ids.add(grant.id)
                    unique_grants.append(grant)
            
            print(f"✅ After deduplication: {len(unique_grants)} unique grants")
            return unique_grants
            
        except Exception as e:
            print(f"❌ Failed to apply filters: {str(e)}")
            logger.error(f"Failed to apply filters: {str(e)}")
            return []
    
    @staticmethod
    def _rank_grants_with_ai(query, grants):
        """
        Stage 2: Rank grants using AI for relevance scoring.
        
        Args:
            query: Original natural language query
            grants: List of Grant objects to rank
            
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
            
            GRANTS TO RANK:
            {json.dumps(grants_data, indent=2, cls=DecimalEncoder)}
            
            Rank these grants based on how well they match the user's query. Consider:
            
            1. DIRECT RELEVANCE: How directly does the grant match the user's research interests?
            2. KEYWORD ALIGNMENT: How well do the grant title/description align with query keywords?
            3. RESEARCH DOMAIN FIT: Does the grant fall within the user's research domain?
            4. FUNDING SCOPE: Is the funding amount and scope appropriate for the user's needs?
            5. TIMELINE RELEVANCE: Is the deadline reasonable for the user's timeline?
            6. ELIGIBILITY MATCH: Does the user likely qualify for this grant?
            
            Return ONLY a JSON object with grant IDs and relevance scores (0.0 to 1.0):
            {{
                "rankings": [
                    {{"grant_id": 1, "relevance_score": 0.95, "reason": "Perfect match for AI research with appropriate funding"}},
                    {{"grant_id": 2, "relevance_score": 0.87, "reason": "Strong alignment with machine learning focus"}}
                ]
            }}
            
            Rank all grants provided. Use scores between 0.0 and 1.0.
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
        Search researcher profiles using two-stage natural language processing.
        
        Stage 1: Generate database filters from natural language query
        Stage 2: AI ranking of top 25 results for relevance scoring
        
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
            # Stage 1: Generate database filters
            print(f"🔍 Starting natural language search for profiles with query: '{query}'")
            print("📝 Stage 1: Generating database filters using AI...")
            filters = NaturalLanguageSearchService._generate_profile_filters(query)
            logger.info(f"Generated filters for query '{query}': {filters}")
            print(f"✅ Generated filters: {filters}")
            
            # Apply filters to get candidate profiles
            print("🔎 Stage 1: Applying filters to database...")
            candidate_profiles = NaturalLanguageSearchService._apply_profile_filters(filters)
            logger.info(f"Found {len(candidate_profiles)} candidate profiles")
            print(f"✅ Found {len(candidate_profiles)} candidate profiles")
            
            if not candidate_profiles:
                return []
            
            # Stage 2: AI ranking of top 25 results
            print("🤖 Stage 2: AI ranking and relevance scoring...")
            if len(candidate_profiles) > 25:
                # Take top 25 for AI ranking
                top_candidates = candidate_profiles[:25]
                print(f"📊 Taking top 25 candidates for AI ranking (from {len(candidate_profiles)} total)")
            else:
                top_candidates = candidate_profiles
                print(f"📊 Using all {len(candidate_profiles)} candidates for AI ranking")
            
            scored_profiles = NaturalLanguageSearchService._rank_profiles_with_ai(query, top_candidates)
            print(f"✅ AI ranking completed. Returning top {limit} results")
            
            # Return top results up to limit
            return scored_profiles[:limit]
                
        except Exception as e:
            logger.error(f"Natural language search failed: {str(e)}")
            return NaturalLanguageSearchService._fallback_search_profiles(query, limit)
    
    @staticmethod
    def _generate_profile_filters(query):
        """
        Stage 1: Generate database filters from natural language query using AI.
        
        Args:
            query: Natural language search query
            
        Returns:
            Dictionary of database filters
        """
        try:
            # Configure Gemini
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            prompt = f"""
            You are an expert database query generator for researcher profile databases.
            
            USER SEARCH QUERY: "{query}"
            
            Based on this natural language query, generate appropriate database filters to find relevant researchers.
            
            Available profile fields for filtering:
            - name: Researcher name (text search)
            - position: Job title/position (text search)
            - department: Department (text search)
            - school: University/institution (text search)
            - expertise: Research areas/expertise (text search)
            - education: Educational background (text search)
            - bio: Biography/research description (text search)
            
            Generate filters that will help find the most relevant researchers. Consider:
            1. Research areas and expertise mentioned
            2. Academic disciplines and fields
            3. Institution types or specific universities
            4. Job titles or career levels
            5. Educational background requirements
            6. Research methodologies or approaches
            
            Return ONLY a JSON object with the filters:
            {{
                "text_filters": {{
                    "name_keywords": ["keyword1", "keyword2"],
                    "position_keywords": ["keyword1", "keyword2"],
                    "department_keywords": ["keyword1", "keyword2"],
                    "school_keywords": ["keyword1", "keyword2"],
                    "expertise_keywords": ["keyword1", "keyword2"],
                    "education_keywords": ["keyword1", "keyword2"],
                    "bio_keywords": ["keyword1", "keyword2"]
                }},
                "exact_filters": {{
                    "department": "Computer Science",
                    "school": "Stanford University"
                }}
            }}
            
            Only include filters that are relevant to the query. Use null for unused filters.
            """
            
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Parse the JSON response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                return json.loads(json_text)
            
            return {}
            
        except Exception as e:
            logger.error(f"Failed to generate profile filters: {str(e)}")
            return {}
    
    @staticmethod
    def _apply_profile_filters(filters):
        """
        Apply generated filters to the ResearcherProfile database.
        
        Args:
            filters: Dictionary of database filters
            
        Returns:
            List of ResearcherProfile objects matching the filters
        """
        try:
            # Handle case where filters is None or empty
            if not filters:
                logger.warning("No filters provided, returning empty results")
                return []
                
            query = ResearcherProfile.objects.all()
            
            # Apply text filters
            text_filters = filters.get('text_filters', {})
            
            # Name keywords
            name_keywords = text_filters.get('name_keywords', [])
            if name_keywords:
                name_q = Q()
                for keyword in name_keywords:
                    name_q |= Q(name__icontains=keyword)
                query = query.filter(name_q)
            
            # Position keywords
            position_keywords = text_filters.get('position_keywords', [])
            if position_keywords:
                pos_q = Q()
                for keyword in position_keywords:
                    pos_q |= Q(position__icontains=keyword)
                query = query.filter(pos_q)
            
            # Department keywords
            dept_keywords = text_filters.get('department_keywords', [])
            if dept_keywords:
                dept_q = Q()
                for keyword in dept_keywords:
                    dept_q |= Q(department__icontains=keyword)
                query = query.filter(dept_q)
            
            # School keywords
            school_keywords = text_filters.get('school_keywords', [])
            if school_keywords:
                school_q = Q()
                for keyword in school_keywords:
                    school_q |= Q(school__icontains=keyword)
                query = query.filter(school_q)
            
            # Expertise keywords
            expertise_keywords = text_filters.get('expertise_keywords', [])
            if expertise_keywords:
                exp_q = Q()
                for keyword in expertise_keywords:
                    exp_q |= Q(expertise__icontains=keyword)
                query = query.filter(exp_q)
            
            # Education keywords
            education_keywords = text_filters.get('education_keywords', [])
            if education_keywords:
                edu_q = Q()
                for keyword in education_keywords:
                    edu_q |= Q(education__icontains=keyword)
                query = query.filter(edu_q)
            
            # Bio keywords
            bio_keywords = text_filters.get('bio_keywords', [])
            if bio_keywords:
                bio_q = Q()
                for keyword in bio_keywords:
                    bio_q |= Q(bio__icontains=keyword)
                query = query.filter(bio_q)
            
            # Apply exact filters
            exact_filters = filters.get('exact_filters', {})
            if exact_filters.get('department'):
                query = query.filter(department__icontains=exact_filters['department'])
            if exact_filters.get('school'):
                query = query.filter(school__icontains=exact_filters['school'])
            
            # Return up to 100 results
            profiles = list(query[:100])
            
            # Remove duplicates based on profile email while preserving order
            seen_profile_emails = set()
            unique_profiles = []
            for profile in profiles:
                if profile.email not in seen_profile_emails:
                    seen_profile_emails.add(profile.email)
                    unique_profiles.append(profile)
            
            return unique_profiles
            
        except Exception as e:
            logger.error(f"Failed to apply profile filters: {str(e)}")
            return []
    
    @staticmethod
    def _rank_profiles_with_ai(query, profiles):
        """
        Stage 2: Rank profiles using AI for relevance scoring.
        
        Args:
            query: Original natural language query
            profiles: List of ResearcherProfile objects to rank
            
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
            
            RESEARCHER PROFILES TO RANK:
            {json.dumps(profiles_data, indent=2, cls=DecimalEncoder)}
            
            Rank these researchers based on how well they match the user's query. Consider:
            
            1. EXPERTISE ALIGNMENT: How well does the researcher's expertise match the query?
            2. RESEARCH DOMAIN FIT: Does the researcher work in the relevant research domain?
            3. COLLABORATION POTENTIAL: Would this researcher be a good collaborator for the user's needs?
            4. ACADEMIC CREDIBILITY: Does the researcher have appropriate credentials and experience?
            5. INSTITUTIONAL FIT: Is the researcher at an appropriate institution level?
            6. RESEARCH METHODOLOGY: Does the researcher use relevant methodologies or approaches?
            
            Return ONLY a JSON object with profile emails and relevance scores (0.0 to 1.0):
            {{
                "rankings": [
                    {{"profile_email": "researcher@university.edu", "relevance_score": 0.95, "reason": "Perfect match for AI research with strong credentials"}},
                    {{"profile_email": "scientist@college.edu", "relevance_score": 0.87, "reason": "Strong expertise in machine learning"}}
                ]
            }}
            
            Rank all profiles provided. Use scores between 0.0 and 1.0.
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
