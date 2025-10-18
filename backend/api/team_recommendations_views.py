"""
Team Recommendations Views

This module provides views for generating team-based grant recommendations that combine
grant opportunities with collections of professors and generate collaboration pitches.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.http import JsonResponse, StreamingHttpResponse
from django.db.models import Q
from django.utils.dateparse import parse_date
from django.utils import timezone
from .models import Grant, Professor, ProfessorUser, GrantRecommendation
from .serializers import GrantSerializer, ProfessorSerializer
from .professor_matching_service import ProfessorGrantMatchingService
from .professor_llm_service import ProfessorLLMService
import logging
import json
import os
from datetime import datetime
from decimal import Decimal
import google.generativeai as genai
from django.conf import settings
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Tuple, Dict, Any

logger = logging.getLogger(__name__)


class TeamRecommendationService:
    """Service for generating team-based grant recommendations"""
    
    @staticmethod
    def find_team_recommendations(
        query: str = None,
        grant_id: int = None,
        team_size: int = 3,
        limit: int = 10,
        include_diversity: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Find team recommendations combining grants with professor teams.
        
        Args:
            query: Optional search query for grants
            grant_id: Optional specific grant ID to focus on
            team_size: Number of professors per team (default 3)
            limit: Maximum number of team recommendations to return
            include_diversity: Whether to ensure team diversity
            
        Returns:
            List of team recommendation dictionaries
        """
        try:
            logger.info(f"Finding team recommendations: query='{query}', grant_id={grant_id}, team_size={team_size}")
            
            # Get grants to work with
            if grant_id:
                grants = [Grant.objects.get(id=grant_id)]
            elif query:
                grants = TeamRecommendationService._search_grants_by_query(query, limit=20)
            else:
                # Get recent active grants
                grants = list(Grant.objects.filter(
                    close_date__gte=timezone.now().date()
                ).order_by('-created_at')[:20])
            
            if not grants:
                logger.warning("No grants found for team recommendations")
                return []
            
            # Get all active professors
            professors = list(Professor.objects.filter(is_active=True))
            if len(professors) < team_size:
                logger.warning(f"Not enough professors ({len(professors)}) for team size {team_size}")
                return []
            
            # Generate team recommendations for each grant
            team_recommendations = []
            for grant in grants:
                teams = TeamRecommendationService._generate_teams_for_grant(
                    grant, professors, team_size, include_diversity
                )
                
                for team in teams:
                    # Generate collaboration pitch
                    pitch = TeamRecommendationService._generate_team_pitch(grant, team)
                    
                    team_recommendation = {
                        'grant': GrantSerializer(grant).data,
                        'team': [ProfessorSerializer(prof).data for prof in team],
                        'team_size': len(team),
                        'collaboration_pitch': pitch,
                        'team_synergy_score': TeamRecommendationService._calculate_team_synergy(team),
                        'grant_team_fit_score': TeamRecommendationService._calculate_grant_team_fit(grant, team),
                        'overall_score': 0.0,  # Will be calculated
                        'created_at': timezone.now().isoformat()
                    }
                    
                    # Calculate overall score
                    team_recommendation['overall_score'] = (
                        team_recommendation['team_synergy_score'] * 0.4 +
                        team_recommendation['grant_team_fit_score'] * 0.6
                    )
                    
                    team_recommendations.append(team_recommendation)
            
            # Sort by overall score and return top results
            team_recommendations.sort(key=lambda x: x['overall_score'], reverse=True)
            return team_recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Error finding team recommendations: {str(e)}")
            return []
    
    @staticmethod
    def _search_grants_by_query(query: str, limit: int = 20) -> List[Grant]:
        """Search grants by query using text matching"""
        try:
            grants_query = Grant.objects.filter(
                Q(title__icontains=query) | 
                Q(description__icontains=query) |
                Q(category_of_funding_activity__icontains=query),
                close_date__gte=timezone.now().date()
            ).order_by('-created_at')
            
            return list(grants_query[:limit])
        except Exception as e:
            logger.error(f"Error searching grants by query: {str(e)}")
            return []
    
    @staticmethod
    def _generate_teams_for_grant(
        grant: Grant, 
        professors: List[Professor], 
        team_size: int,
        include_diversity: bool
    ) -> List[List[Professor]]:
        """Generate diverse teams of professors suitable for a grant"""
        try:
            # Score all professors for this grant
            scored_professors = []
            for professor in professors:
                score = TeamRecommendationService._score_professor_for_grant(professor, grant)
                # Include all professors, but give a minimum score to ensure we get results
                if score == 0:
                    score = 1.0  # Minimum score to ensure inclusion
                scored_professors.append((professor, score))
            
            # Sort by score
            scored_professors.sort(key=lambda x: x[1], reverse=True)
            
            if len(scored_professors) < team_size:
                return []
            
            # Generate diverse teams
            teams = []
            used_professors = set()
            
            # Try to create multiple teams
            max_teams = min(5, len(scored_professors) // team_size)
            
            for team_idx in range(max_teams):
                team = []
                available_professors = [
                    (prof, score) for prof, score in scored_professors 
                    if prof.id not in used_professors
                ]
                
                if len(available_professors) < team_size:
                    break
                
                # Select team members with diversity considerations
                for i in range(team_size):
                    if i == 0:
                        # First member: highest scoring
                        professor, score = available_professors[0]
                    else:
                        # Subsequent members: consider diversity
                        if include_diversity:
                            professor, score = TeamRecommendationService._select_diverse_team_member(
                                team, available_professors, grant
                            )
                        else:
                            professor, score = available_professors[i]
                    
                    team.append(professor)
                    used_professors.add(professor.id)
                    
                    # Remove from available
                    available_professors = [
                        (prof, score) for prof, score in available_professors 
                        if prof.id != professor.id
                    ]
                
                if len(team) == team_size:
                    teams.append(team)
            
            return teams
            
        except Exception as e:
            logger.error(f"Error generating teams for grant: {str(e)}")
            return []
    
    @staticmethod
    def _score_professor_for_grant(professor: Professor, grant: Grant) -> float:
        """Score how well a professor fits a grant"""
        try:
            score = 5.0  # Base score to ensure all professors get some points
            
            # Research area matching
            if professor.research_areas and grant.description:
                grant_text = (grant.title or '') + ' ' + (grant.description or '')
                grant_text_lower = grant_text.lower()
                
                for research_area in professor.research_areas:
                    if research_area.lower() in grant_text_lower:
                        score += 20
                        break
            
            # Expertise keyword matching
            if professor.expertise_keywords and grant.description:
                grant_text = (grant.title or '') + ' ' + (grant.description or '')
                grant_text_lower = grant_text.lower()
                
                for keyword in professor.expertise_keywords:
                    if keyword.lower() in grant_text_lower:
                        score += 15
                        break
            
            # Department/field alignment
            if professor.department and grant.category_of_funding_activity:
                dept_lower = professor.department.lower()
                category_lower = grant.category_of_funding_activity.lower()
                
                if any(word in category_lower for word in dept_lower.split() if len(word) > 3):
                    score += 10
            
            # Agency preference
            if professor.preferred_agencies and grant.agency_code in professor.preferred_agencies:
                score += 15
            
            # Award amount preference
            if professor.preferred_award_ranges and grant.award_ceiling:
                min_pref = professor.preferred_award_ranges.get('min', 0)
                max_pref = professor.preferred_award_ranges.get('max', float('inf'))
                grant_amount = float(grant.award_ceiling)
                
                if min_pref <= grant_amount <= max_pref:
                    score += 10
            
            # Bonus for having research areas (even if not matching)
            if professor.research_areas and len(professor.research_areas) > 0:
                score += 5
            
            # Bonus for having expertise keywords
            if professor.expertise_keywords and len(professor.expertise_keywords) > 0:
                score += 3
            
            return score
            
        except Exception as e:
            logger.error(f"Error scoring professor for grant: {str(e)}")
            return 5.0  # Return base score on error
    
    @staticmethod
    def _select_diverse_team_member(
        current_team: List[Professor], 
        available_professors: List[Tuple[Professor, float]], 
        grant: Grant
    ) -> Tuple[Professor, float]:
        """Select a diverse team member considering existing team composition"""
        try:
            if not current_team or not available_professors:
                return available_professors[0] if available_professors else (None, 0.0)
            
            # Get current team characteristics
            current_departments = {prof.department for prof in current_team if prof.department}
            current_schools = {prof.school for prof in current_team if prof.school}
            current_universities = {prof.university for prof in current_team if prof.university}
            
            # Score available professors for diversity
            diversity_scores = []
            for professor, grant_score in available_professors:
                diversity_score = 0.0
                
                # Department diversity bonus
                if professor.department and professor.department not in current_departments:
                    diversity_score += 10
                
                # School diversity bonus
                if professor.school and professor.school not in current_schools:
                    diversity_score += 8
                
                # University diversity bonus
                if professor.university and professor.university not in current_universities:
                    diversity_score += 5
                
                # Research area diversity
                current_research_areas = set()
                for team_member in current_team:
                    if team_member.research_areas:
                        current_research_areas.update(team_member.research_areas)
                
                if professor.research_areas:
                    new_areas = set(professor.research_areas) - current_research_areas
                    diversity_score += len(new_areas) * 3
                
                # Combined score: grant fit + diversity
                combined_score = grant_score + diversity_score
                diversity_scores.append((professor, combined_score))
            
            # Sort by combined score and return best
            diversity_scores.sort(key=lambda x: x[1], reverse=True)
            return diversity_scores[0] if diversity_scores else available_professors[0]
            
        except Exception as e:
            logger.error(f"Error selecting diverse team member: {str(e)}")
            return available_professors[0] if available_professors else (None, 0.0)
    
    @staticmethod
    def _calculate_team_synergy(team: List[Professor]) -> float:
        """Calculate how well the team members work together"""
        try:
            if len(team) < 2:
                return 0.0
            
            synergy_score = 0.0
            
            # Research area complementarity
            all_research_areas = set()
            for professor in team:
                if professor.research_areas:
                    all_research_areas.update(professor.research_areas)
            
            # Bonus for diverse but related research areas
            if len(all_research_areas) > len(team):
                synergy_score += 20
            
            # Department diversity
            departments = {prof.department for prof in team if prof.department}
            if len(departments) > 1:
                synergy_score += 15
            
            # School diversity
            schools = {prof.school for prof in team if prof.school}
            if len(schools) > 1:
                synergy_score += 10
            
            # University diversity
            universities = {prof.university for prof in team if prof.university}
            if len(universities) > 1:
                synergy_score += 5
            
            # Normalize to 0-100 scale
            return min(synergy_score, 100.0)
            
        except Exception as e:
            logger.error(f"Error calculating team synergy: {str(e)}")
            return 0.0
    
    @staticmethod
    def _calculate_grant_team_fit(grant: Grant, team: List[Professor]) -> float:
        """Calculate how well the team fits the grant requirements"""
        try:
            if not team:
                return 0.0
            
            total_score = 0.0
            for professor in team:
                total_score += TeamRecommendationService._score_professor_for_grant(professor, grant)
            
            # Average score per team member
            avg_score = total_score / len(team)
            
            # Bonus for team size matching grant complexity
            grant_text = (grant.title or '') + ' ' + (grant.description or '')
            grant_text_lower = grant_text.lower()
            
            # Simple heuristics for grant complexity
            complexity_indicators = ['collaborative', 'multi-disciplinary', 'interdisciplinary', 'team', 'partnership']
            complexity_score = sum(1 for indicator in complexity_indicators if indicator in grant_text_lower)
            
            # Adjust score based on team size vs complexity
            if complexity_score > 2 and len(team) >= 3:
                avg_score += 10  # Bonus for larger teams on complex grants
            elif complexity_score == 0 and len(team) <= 2:
                avg_score += 5   # Bonus for smaller teams on simple grants
            
            return min(avg_score, 100.0)
            
        except Exception as e:
            logger.error(f"Error calculating grant-team fit: {str(e)}")
            return 0.0
    
    @staticmethod
    def _generate_team_pitch(grant: Grant, team: List[Professor]) -> str:
        """Generate a collaboration pitch for the team and grant"""
        try:
            # Build team summary
            team_summary = []
            for i, professor in enumerate(team):
                role = "Principal Investigator" if i == 0 else f"Co-Investigator {i}"
                expertise = professor.get_expertise_display() or "Research expertise"
                dept = professor.department or "Department"
                team_summary.append(f"{role}: {professor.name} ({dept}) - {expertise}")
            
            team_text = "\n".join(team_summary)
            
            # Build grant summary
            grant_summary = f"""
Grant: {grant.title}
Agency: {grant.agency_name or 'Unknown Agency'}
Amount: ${grant.award_ceiling or grant.award_floor or 'TBD'}
Deadline: {grant.close_date or 'TBD'}
Description: {(grant.description or '')[:500]}...
"""
            
            # Generate pitch using AI if available
            if hasattr(settings, 'GEMINI_API_KEY') and settings.GEMINI_API_KEY:
                try:
                    genai.configure(api_key=settings.GEMINI_API_KEY)
                    model = genai.GenerativeModel('gemini-2.0-flash')
                    
                    prompt = f"""
Generate a compelling collaboration pitch for this research team applying for a grant.

Grant Details:
{grant_summary}

Team Composition:
{team_text}

Please create a 2-3 paragraph pitch that:
1. Explains how the team's combined expertise addresses the grant requirements
2. Highlights the unique value each team member brings
3. Demonstrates synergy and collaboration potential
4. Shows alignment with the grant's goals and objectives

Make it professional, compelling, and specific to this grant opportunity.
"""
                    
                    response = model.generate_content(prompt)
                    return response.text
                    
                except Exception as e:
                    logger.warning(f"AI pitch generation failed: {str(e)}")
            
            # Fallback to template-based pitch
            return TeamRecommendationService._generate_template_pitch(grant, team)
            
        except Exception as e:
            logger.error(f"Error generating team pitch: {str(e)}")
            return "Unable to generate collaboration pitch at this time."
    
    @staticmethod
    def _generate_template_pitch(grant: Grant, team: List[Professor]) -> str:
        """Generate a template-based collaboration pitch"""
        try:
            # Get team expertise areas
            all_expertise = set()
            departments = set()
            for professor in team:
                if professor.research_areas:
                    all_expertise.update(professor.research_areas)
                if professor.department:
                    departments.add(professor.department)
            
            expertise_text = ", ".join(list(all_expertise)[:5])  # Top 5 areas
            dept_text = ", ".join(departments)
            
            pitch = f"""
**Collaborative Research Proposal**

Our interdisciplinary team brings together expertise in {expertise_text} from {dept_text}. This diverse combination of skills and perspectives positions us uniquely to address the complex challenges outlined in the {grant.title} grant opportunity.

**Team Synergy & Expertise:**
"""
            
            for i, professor in enumerate(team):
                role = "Principal Investigator" if i == 0 else f"Co-Investigator {i}"
                expertise = professor.get_expertise_display() or "Research expertise"
                dept = professor.department or "Department"
                pitch += f"\n• {role}: {professor.name} ({dept}) brings {expertise}"
            
            pitch += f"""

**Grant Alignment:**
Our team's combined expertise directly addresses the research objectives outlined in this {grant.agency_name or 'funding agency'} opportunity. The interdisciplinary nature of our collaboration ensures comprehensive coverage of the grant requirements while bringing innovative approaches to the research challenges.

**Collaboration Benefits:**
This partnership leverages complementary skills across multiple departments, ensuring robust methodology, diverse perspectives, and enhanced potential for breakthrough discoveries. Our collaborative approach maximizes the impact of the proposed research while building lasting partnerships for future endeavors.
"""
            
            return pitch
            
        except Exception as e:
            logger.error(f"Error generating template pitch: {str(e)}")
            return "This team brings together diverse expertise to address the grant requirements through collaborative research."


# API Views

@api_view(['GET'])
def get_team_recommendations(request):
    """Get team-based grant recommendations"""
    try:
        # Extract query parameters
        query = request.GET.get('q', '').strip()
        grant_id = request.GET.get('grant_id')
        team_size = request.GET.get('team_size', 3)
        limit = request.GET.get('limit', 10)
        include_diversity = request.GET.get('include_diversity', 'true').lower() == 'true'
        
        # Convert parameters
        try:
            team_size = int(team_size)
            limit = int(limit)
            if grant_id:
                grant_id = int(grant_id)
        except ValueError:
            return Response({
                'error': 'Invalid parameter values'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate parameters
        if team_size < 2 or team_size > 6:
            return Response({
                'error': 'Team size must be between 2 and 6'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if limit > 20:
            limit = 20  # Cap for performance
        
        logger.info(f"Getting team recommendations: query='{query}', grant_id={grant_id}, team_size={team_size}")
        
        # Get team recommendations
        team_recommendations = TeamRecommendationService.find_team_recommendations(
            query=query if query else None,
            grant_id=grant_id,
            team_size=team_size,
            limit=limit,
            include_diversity=include_diversity
        )
        
        return Response({
            'team_recommendations': team_recommendations,
            'count': len(team_recommendations),
            'parameters': {
                'query': query,
                'grant_id': grant_id,
                'team_size': team_size,
                'include_diversity': include_diversity
            },
            'message': f'Found {len(team_recommendations)} team recommendations' if team_recommendations else 'No team recommendations found'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in get_team_recommendations: {str(e)}")
        return Response({
            'error': 'Failed to get team recommendations',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_grant_team_suggestions(request, grant_id):
    """Get team suggestions for a specific grant"""
    try:
        # Get the grant
        try:
            grant = Grant.objects.get(id=grant_id)
        except Grant.DoesNotExist:
            return Response({
                'error': f'Grant with ID {grant_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Extract parameters
        team_size = request.GET.get('team_size', 3)
        limit = request.GET.get('limit', 5)
        include_diversity = request.GET.get('include_diversity', 'true').lower() == 'true'
        
        # Convert parameters
        try:
            team_size = int(team_size)
            limit = int(limit)
        except ValueError:
            return Response({
                'error': 'Invalid parameter values'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Getting team suggestions for grant {grant_id}")
        
        # Get team recommendations for this specific grant
        team_recommendations = TeamRecommendationService.find_team_recommendations(
            grant_id=grant_id,
            team_size=team_size,
            limit=limit,
            include_diversity=include_diversity
        )
        
        return Response({
            'grant': GrantSerializer(grant).data,
            'team_suggestions': team_recommendations,
            'count': len(team_recommendations),
            'parameters': {
                'team_size': team_size,
                'include_diversity': include_diversity
            },
            'message': f'Found {len(team_recommendations)} team suggestions for this grant' if team_recommendations else 'No team suggestions found for this grant'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in get_grant_team_suggestions: {str(e)}")
        return Response({
            'error': 'Failed to get team suggestions',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def generate_custom_team_pitch(request):
    """Generate a custom collaboration pitch for a specific grant and team"""
    try:
        grant_id = request.data.get('grant_id')
        professor_emails = request.data.get('professor_emails', [])
        custom_message = request.data.get('custom_message', '')
        
        if not grant_id or not professor_emails:
            return Response({
                'error': 'grant_id and professor_emails are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the grant
        try:
            grant = Grant.objects.get(id=grant_id)
        except Grant.DoesNotExist:
            return Response({
                'error': f'Grant with ID {grant_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get the professors
        professors = []
        for email in professor_emails:
            try:
                professor = Professor.objects.get(email=email, is_active=True)
                professors.append(professor)
            except Professor.DoesNotExist:
                return Response({
                    'error': f'Professor with email {email} not found'
                }, status=status.HTTP_404_NOT_FOUND)
        
        if len(professors) < 2:
            return Response({
                'error': 'At least 2 professors are required for a team'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate custom pitch
        pitch = TeamRecommendationService._generate_team_pitch(grant, professors)
        
        # Add custom message if provided
        if custom_message:
            pitch = f"{custom_message}\n\n{pitch}"
        
        return Response({
            'grant': GrantSerializer(grant).data,
            'team': [ProfessorSerializer(prof).data for prof in professors],
            'collaboration_pitch': pitch,
            'team_synergy_score': TeamRecommendationService._calculate_team_synergy(professors),
            'grant_team_fit_score': TeamRecommendationService._calculate_grant_team_fit(grant, professors),
            'message': 'Custom team pitch generated successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in generate_custom_team_pitch: {str(e)}")
        return Response({
            'error': 'Failed to generate custom team pitch',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
