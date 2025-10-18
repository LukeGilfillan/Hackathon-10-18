"""
Professor-Grant Matching Service

This service provides intelligent matching between professors and grant opportunities
using content similarity analysis, preference matching, and LLM-based relevance scoring.
"""

from django.db.models import Q
from django.utils import timezone
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import logging
from datetime import datetime, timedelta
from .models import Professor, Grant, GrantRecommendation

logger = logging.getLogger(__name__)


class ProfessorGrantMatchingService:
    """Service for matching professors with grant opportunities"""
    
    @staticmethod
    def get_recommended_grants(professor, limit=25, include_dismissed=False):
        """
        Get recommended grants for a professor based on their profile and preferences.
        
        Args:
            professor: Professor instance
            limit: Maximum number of recommendations to return
            include_dismissed: Whether to include previously dismissed grants
            
        Returns:
            List of (grant, score) tuples sorted by recommendation score
        """
        try:
            logger.info(f"Getting grant recommendations for professor: {professor.email}")
            
            # Get professor preferences
            preferred_agencies = professor.preferred_agencies or []
            preferred_funding_types = professor.preferred_funding_types or []
            preferred_award_ranges = professor.preferred_award_ranges or {}
            preferred_duration = professor.preferred_duration or {}
            preferred_locations = professor.preferred_locations or []
            
            # Get dismissed grants if not including them
            dismissed_grant_ids = []
            if not include_dismissed:
                dismissed_grant_ids = list(
                    GrantRecommendation.objects.filter(
                        professor=professor,
                        is_dismissed=True
                    ).values_list('grant_id', flat=True)
                )
            
            # Get saved grants to exclude from recommendations
            saved_grant_ids = list(
                GrantRecommendation.objects.filter(
                    professor=professor,
                    is_saved=True
                ).values_list('grant_id', flat=True)
            )
            
            # Base query for grants
            grants_query = Grant.objects.filter(
                close_date__gte=timezone.now().date()  # Only active grants
            ).exclude(
                id__in=dismissed_grant_ids
            ).exclude(
                id__in=saved_grant_ids
            )
            
            # Apply agency filter if specified
            if preferred_agencies:
                grants_query = grants_query.filter(agency_code__in=preferred_agencies)
            
            # Apply award range filter if specified
            if preferred_award_ranges:
                min_amount = preferred_award_ranges.get('min')
                max_amount = preferred_award_ranges.get('max')
                
                if min_amount:
                    grants_query = grants_query.filter(
                        Q(award_floor__gte=min_amount) | Q(award_ceiling__gte=min_amount)
                    )
                if max_amount:
                    grants_query = grants_query.filter(
                        Q(award_floor__lte=max_amount) | Q(award_ceiling__lte=max_amount)
                    )
            
            # Get all matching grants
            grants = list(grants_query)
            
            if not grants:
                logger.info(f"No grants found for professor {professor.email}")
                return []
            
            logger.info(f"Found {len(grants)} grants to score for professor {professor.email}")
            
            # Calculate content similarity scores
            similarity_scores = ProfessorGrantMatchingService._calculate_content_similarity(
                grants, professor
            )
            
            # Score all grants
            scored_grants = []
            for grant in grants:
                score = ProfessorGrantMatchingService._score_grant(
                    grant, professor, similarity_scores
                )
                scored_grants.append((grant, score))
            
            # Sort by score (highest first)
            scored_grants.sort(key=lambda x: x[1], reverse=True)
            
            # Return top results
            return scored_grants[:limit]
            
        except Exception as e:
            logger.error(f"Error getting grant recommendations for professor {professor.email}: {str(e)}")
            return []
    
    @staticmethod
    def _calculate_content_similarity(grants, professor):
        """
        Calculate content similarity scores between professor profile and grant descriptions.
        
        Args:
            grants: List of Grant instances
            professor: Professor instance
            
        Returns:
            Dictionary mapping grant ID to similarity score
        """
        try:
            # Combine professor profile text
            professor_text_parts = []
            
            # Add research areas
            if professor.research_areas:
                professor_text_parts.extend(professor.research_areas)
            
            # Add expertise keywords
            if professor.expertise_keywords:
                professor_text_parts.extend(professor.expertise_keywords)
            
            # Add research interests
            if professor.research_interests:
                professor_text_parts.append(professor.research_interests)
            
            # Add current projects
            if professor.current_projects:
                professor_text_parts.append(professor.current_projects)
            
            # Add publications (titles only)
            if professor.publications:
                for pub in professor.publications:
                    if isinstance(pub, dict) and 'title' in pub:
                        professor_text_parts.append(pub['title'])
                    elif isinstance(pub, str):
                        professor_text_parts.append(pub)
            
            if not professor_text_parts:
                return {}
            
            professor_text = ' '.join(professor_text_parts)
            
            # Prepare grant texts
            grant_texts = []
            for grant in grants:
                grant_text_parts = []
                
                # Add title
                if grant.title:
                    grant_text_parts.append(grant.title)
                
                # Add description
                if grant.description:
                    grant_text_parts.append(grant.description)
                
                # Add category
                if grant.category_of_funding_activity:
                    grant_text_parts.append(grant.category_of_funding_activity)
                
                grant_text = ' '.join(grant_text_parts)
                grant_texts.append(grant_text)
            
            if not any(grant_texts):  # If all texts are empty
                return {}
            
            # Calculate TF-IDF similarity
            try:
                tfidf_vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
                all_texts = [professor_text] + grant_texts
                tfidf_matrix = tfidf_vectorizer.fit_transform(all_texts)
                
                # Calculate similarities with first text (professor profile)
                similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])
                
                # Create mapping of grant ID to similarity score
                return {
                    grant.id: float(sim) * 30  # Weight content similarity heavily
                    for grant, sim in zip(grants, similarities[0])
                }
            except Exception as e:
                logger.error(f"Error in TF-IDF calculation: {str(e)}")
                return {}
                
        except Exception as e:
            logger.error(f"Error calculating content similarity: {str(e)}")
            return {}
    
    @staticmethod
    def _score_grant(grant, professor, similarity_scores):
        """
        Calculate a comprehensive score for a grant based on professor preferences.
        
        Args:
            grant: Grant instance
            professor: Professor instance
            similarity_scores: Dictionary of content similarity scores
            
        Returns:
            Float score for the grant
        """
        score = 0
        
        # Content similarity score (pre-calculated)
        score += similarity_scores.get(grant.id, 0)
        
        # Agency preference scoring
        if professor.preferred_agencies and grant.agency_code in professor.preferred_agencies:
            score += 25
        
        # Award amount scoring
        if professor.preferred_award_ranges:
            min_pref = professor.preferred_award_ranges.get('min', 0)
            max_pref = professor.preferred_award_ranges.get('max', float('inf'))
            
            # Check if grant amount falls within preferred range
            grant_amount = None
            if grant.award_floor:
                grant_amount = float(grant.award_floor)
            elif grant.award_ceiling:
                grant_amount = float(grant.award_ceiling)
            elif grant.estimated_total_program_funding:
                grant_amount = float(grant.estimated_total_program_funding)
            
            if grant_amount:
                if min_pref <= grant_amount <= max_pref:
                    score += 20
                elif grant_amount > max_pref:
                    # Slightly penalize grants that are too large
                    score += 10
                else:
                    # Slightly penalize grants that are too small
                    score += 5
        
        # Deadline scoring (urgency bonus)
        if grant.close_date:
            try:
                days_until_close = (grant.close_date - timezone.now().date()).days
                
                # Bonus for grants closing soon (but not too soon)
                if 7 <= days_until_close <= 30:
                    score += 15
                elif 30 < days_until_close <= 60:
                    score += 10
                elif 60 < days_until_close <= 90:
                    score += 5
                elif days_until_close < 7:
                    # Penalty for grants closing very soon
                    score += 2
            except Exception:
                pass
        
        # Research area matching (keyword-based)
        if professor.research_areas and grant.description:
            grant_desc_lower = grant.description.lower()
            grant_title_lower = grant.title.lower() if grant.title else ""
            
            for research_area in professor.research_areas:
                if research_area.lower() in grant_desc_lower or research_area.lower() in grant_title_lower:
                    score += 15
                    break  # Only count the first match
        
        # Expertise keyword matching
        if professor.expertise_keywords and grant.description:
            grant_desc_lower = grant.description.lower()
            grant_title_lower = grant.title.lower() if grant.title else ""
            
            for keyword in professor.expertise_keywords:
                if keyword.lower() in grant_desc_lower or keyword.lower() in grant_title_lower:
                    score += 10
                    break  # Only count the first match
        
        # Department/field alignment
        if professor.department and grant.category_of_funding_activity:
            dept_lower = professor.department.lower()
            category_lower = grant.category_of_funding_activity.lower()
            
            # Simple keyword matching for department alignment
            if any(word in category_lower for word in dept_lower.split() if len(word) > 3):
                score += 12
        
        # Eligibility scoring
        if grant.eligible_applicants:
            # Check if professor's institution type is eligible
            eligible_lower = grant.eligible_applicants.lower()
            if 'university' in eligible_lower or 'college' in eligible_lower or 'institution' in eligible_lower:
                score += 8
        
        # Cost sharing preference
        if grant.cost_sharing_or_matching_requirement:
            cost_sharing_lower = grant.cost_sharing_or_matching_requirement.lower()
            if 'no' in cost_sharing_lower or 'not required' in cost_sharing_lower:
                score += 5  # Bonus for no cost sharing requirement
        
        return score
    
    @staticmethod
    def create_recommendations(professor, scored_grants):
        """
        Create GrantRecommendation records for the scored grants.
        
        Args:
            professor: Professor instance
            scored_grants: List of (grant, score) tuples
            
        Returns:
            List of created GrantRecommendation instances
        """
        try:
            # Get existing recommendations to avoid duplicates
            existing_rec_ids = set(
                GrantRecommendation.objects.filter(
                    professor=professor,
                    grant__in=[grant for grant, _ in scored_grants]
                ).values_list('grant_id', flat=True)
            )
            
            # Create new recommendations
            new_recommendations = []
            for grant, score in scored_grants:
                if grant.id not in existing_rec_ids:
                    recommendation = GrantRecommendation(
                        professor=professor,
                        grant=grant,
                        recommendation_score=score,
                        content_similarity_score=0,  # Will be updated if needed
                        llm_relevance_score=1.0
                    )
                    new_recommendations.append(recommendation)
            
            if new_recommendations:
                GrantRecommendation.objects.bulk_create(new_recommendations)
                logger.info(f"Created {len(new_recommendations)} new recommendations for professor {professor.email}")
            
            return new_recommendations
            
        except Exception as e:
            logger.error(f"Error creating recommendations for professor {professor.email}: {str(e)}")
            return []
    
    @staticmethod
    def update_recommendation_interaction(professor, grant, interaction_type):
        """
        Update a recommendation's interaction status.
        
        Args:
            professor: Professor instance
            grant: Grant instance
            interaction_type: 'viewed', 'saved', 'dismissed', or 'applied'
        """
        try:
            recommendation = GrantRecommendation.objects.get(
                professor=professor,
                grant=grant
            )
            
            now = timezone.now()
            
            if interaction_type == 'viewed':
                recommendation.is_viewed = True
                recommendation.viewed_at = now
            elif interaction_type == 'saved':
                recommendation.is_saved = True
                recommendation.saved_at = now
            elif interaction_type == 'dismissed':
                recommendation.is_dismissed = True
                recommendation.dismissed_at = now
            elif interaction_type == 'applied':
                recommendation.is_applied = True
                recommendation.applied_at = now
            
            recommendation.save()
            logger.info(f"Updated recommendation interaction: {professor.email} - {grant.title} - {interaction_type}")
            
        except GrantRecommendation.DoesNotExist:
            logger.warning(f"Recommendation not found for professor {professor.email} and grant {grant.id}")
        except Exception as e:
            logger.error(f"Error updating recommendation interaction: {str(e)}")


