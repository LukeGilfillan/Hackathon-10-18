from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.http import JsonResponse, StreamingHttpResponse
from django.db.models import Q
from django.utils.dateparse import parse_date
from django.utils import timezone
from .services import IgniteHubService
from .models import Grant, ResearcherProfile, Professor, GrantRecommendation, Forum, Topic, Post, PostLike, TopicSubscription, ProfessorUser, SavedGrant, CollaborationInvite, Collaboration, GrantPipelineStage, GrantPipelineEntry
from .serializers import GrantSerializer, ResearcherProfileSerializer, ProfessorSerializer, GrantRecommendationSerializer, ForumSerializer, TopicSerializer, TopicListSerializer, PostSerializer, PostLikeSerializer, TopicSubscriptionSerializer, SavedGrantSerializer, CollaborationInviteSerializer, CollaborationSerializer, GrantPipelineStageSerializer, GrantPipelineEntrySerializer
from .professor_matching_service import ProfessorGrantMatchingService
from .professor_llm_service import ProfessorLLMService
from .natural_language_search_service import NaturalLanguageSearchService, DecimalEncoder
import logging
import json
import os
from datetime import datetime
from decimal import Decimal
import google.generativeai as genai
from django.conf import settings

logger = logging.getLogger(__name__)

def get_current_user_from_request(request):
    """Get current user from request using session token"""
    try:
        # Try to get session token from Authorization header first
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        session_token = None
        
        if auth_header and auth_header.startswith('Token '):
            session_token = auth_header.split(' ')[1]
        else:
            # Fallback to query parameter
            session_token = request.GET.get('session_token')
        
        if not session_token:
            return None
        
        try:
            user = ProfessorUser.objects.get(
                session_token=session_token,
                is_authenticated=True
            )
            return user
        except ProfessorUser.DoesNotExist:
            return None
    except Exception as e:
        logger.error(f"Error getting current user from request: {str(e)}")
        return None

@api_view(['GET'])
def hello_world(request):
    return Response({
        'message': 'Hello from Cardinal Concordia API!',
        'status': 'success'
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
def health(request):
    """Get IgniteHub service health status"""
    try:
        health_data = IgniteHubService.get_health()
        return Response(health_data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return Response({
            'error': 'Failed to get health status',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def search_grants(request):
    """Search for grants with optional filters"""
    try:
        # Extract query parameters
        query = request.GET.get('q')
        agency_code = request.GET.get('agency_code')
        close_before = request.GET.get('close_before')
        close_after = request.GET.get('close_after')
        limit = request.GET.get('limit', 20)
        offset = request.GET.get('offset', 0)
        sync = request.GET.get('sync', 'false').lower() == 'true'
        
        # Convert limit and offset to integers
        try:
            limit = int(limit)
            offset = int(offset)
        except ValueError:
            return Response({
                'error': 'Invalid limit or offset parameter'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # If sync is requested, fetch from IgniteHub and save to local database
        if sync:
            try:
                ignite_grants = IgniteHubService.search_grants(
                    query=query,
                    agency_code=agency_code,
                    close_before=close_before,
                    close_after=close_after,
                    limit=100  # Fetch more for syncing
                )
                
                # Save grants to local database
                for grant_data in ignite_grants:
                    grant, created = Grant.objects.update_or_create(
                        opportunity_id=grant_data.get('opportunity_id'),
                        defaults={
                            'title': grant_data.get('title', ''),
                            'description': grant_data.get('description', ''),
                            'agency_code': grant_data.get('agency_code', ''),
                            'agency_name': grant_data.get('agency_name', ''),
                            'award_floor': grant_data.get('award_floor'),
                            'award_ceiling': grant_data.get('award_ceiling'),
                            'close_date': parse_date(grant_data.get('close_date')) if grant_data.get('close_date') else None,
                            'category_of_funding_activity': grant_data.get('category_of_funding_activity', ''),
                            'eligible_applicants': grant_data.get('eligible_applicants', ''),
                            'cost_sharing_or_matching_requirement': grant_data.get('cost_sharing_or_matching_requirement', ''),
                        }
                    )
                
                logger.info(f"Synced {len(ignite_grants)} grants from IgniteHub")
                
            except Exception as e:
                logger.warning(f"Failed to sync from IgniteHub: {str(e)}")
        
        # Build query for local database
        grants_query = Grant.objects.all()
        
        # Apply filters
        if query:
            grants_query = grants_query.filter(
                Q(title__icontains=query) | 
                Q(description__icontains=query) |
                Q(category_of_funding_activity__icontains=query)
            )
        
        if agency_code:
            grants_query = grants_query.filter(agency_code=agency_code)
        
        if close_before:
            close_before_date = parse_date(close_before)
            if close_before_date:
                grants_query = grants_query.filter(close_date__lte=close_before_date)
        
        if close_after:
            close_after_date = parse_date(close_after)
            if close_after_date:
                grants_query = grants_query.filter(close_date__gte=close_after_date)
        
        # Apply pagination
        total_count = grants_query.count()
        grants = grants_query[offset:offset + limit]
        
        # Remove duplicates based on grant ID while preserving order
        seen_grant_ids = set()
        unique_grants = []
        for grant in grants:
            if grant.id not in seen_grant_ids:
                seen_grant_ids.add(grant.id)
                unique_grants.append(grant)
        
        grants = unique_grants
        
        # Serialize the results
        serializer = GrantSerializer(grants, many=True)
        
        # Always return consistent structure, even with empty results
        return Response({
            'grants': serializer.data,
            'count': len(serializer.data),
            'total_count': total_count,
            'offset': offset,
            'limit': limit,
            'message': f'Found {len(serializer.data)} grants' if len(serializer.data) > 0 else 'No grants found matching your criteria'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Grant search failed: {str(e)}")
        return Response({
            'error': 'Failed to search grants',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_grant(request, grant_id):
    """Get a specific grant by ID"""
    try:
        grant = Grant.objects.get(id=grant_id)
        serializer = GrantSerializer(grant)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Grant.DoesNotExist:
        return Response({
            'error': f'Grant with ID {grant_id} not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Failed to get grant {grant_id}: {str(e)}")
        return Response({
            'error': f'Failed to get grant {grant_id}',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def search_profiles(request):
    """Search for researcher profiles with optional filters"""
    try:
        # Extract query parameters
        query = request.GET.get('q')
        department = request.GET.get('department')
        school = request.GET.get('school')
        limit = request.GET.get('limit', 20)
        offset = request.GET.get('offset', 0)
        sync = request.GET.get('sync', 'false').lower() == 'true'
        
        # Convert limit and offset to integers
        try:
            limit = int(limit)
            offset = int(offset)
        except ValueError:
            return Response({
                'error': 'Invalid limit or offset parameter'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # If sync is requested, fetch from IgniteHub and save to local database
        if sync:
            try:
                ignite_profiles = IgniteHubService.search_profiles(
                    query=query,
                    department=department,
                    school=school,
                    limit=100  # Fetch more for syncing
                )
                
                # Save profiles to local database
                for profile_data in ignite_profiles:
                    profile, created = ResearcherProfile.objects.update_or_create(
                        email=profile_data.get('email'),
                        defaults={
                            'name': profile_data.get('name', ''),
                            'position': profile_data.get('position', ''),
                            'department': profile_data.get('department', ''),
                            'school': profile_data.get('school', ''),
                            'expertise': profile_data.get('expertise', []),
                            'education': profile_data.get('education', ''),
                            'bio': profile_data.get('bio', ''),
                            'contact': profile_data.get('contact', {}),
                            'source_url': profile_data.get('source_url', ''),
                        }
                    )
                
                logger.info(f"Synced {len(ignite_profiles)} profiles from IgniteHub")
                
            except Exception as e:
                logger.warning(f"Failed to sync from IgniteHub: {str(e)}")
        
        # Build query for local database
        profiles_query = ResearcherProfile.objects.all()
        
        # Apply filters
        if query:
            profiles_query = profiles_query.filter(
                Q(name__icontains=query) | 
                Q(bio__icontains=query) |
                Q(expertise__icontains=query) |
                Q(education__icontains=query)
            )
        
        if department:
            profiles_query = profiles_query.filter(department__icontains=department)
        
        if school:
            profiles_query = profiles_query.filter(school__icontains=school)
        
        # Apply pagination
        total_count = profiles_query.count()
        profiles = profiles_query[offset:offset + limit]
        
        # Remove duplicates based on profile email while preserving order
        seen_profile_emails = set()
        unique_profiles = []
        for profile in profiles:
            if profile.email not in seen_profile_emails:
                seen_profile_emails.add(profile.email)
                unique_profiles.append(profile)
        
        profiles = unique_profiles
        
        # Serialize the results
        serializer = ResearcherProfileSerializer(profiles, many=True)
        
        # Always return consistent structure, even with empty results
        return Response({
            'profiles': serializer.data,
            'count': len(serializer.data),
            'total_count': total_count,
            'offset': offset,
            'limit': limit,
            'message': f'Found {len(serializer.data)} profiles' if len(serializer.data) > 0 else 'No profiles found matching your criteria'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Profile search failed: {str(e)}")
        return Response({
            'error': 'Failed to search profiles',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_profile(request, email):
    """Get a specific researcher profile by email"""
    try:
        profile = ResearcherProfile.objects.get(email=email)
        serializer = ResearcherProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except ResearcherProfile.DoesNotExist:
        return Response({
            'error': f'Profile with email {email} not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Failed to get profile {email}: {str(e)}")
        return Response({
            'error': f'Failed to get profile {email}',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Professor-related views

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_professor_recommendations(request):
    """Get grant recommendations for a professor based on their profile and preferences"""
    try:
        # Get the professor from the request (assuming email is passed as parameter)
        professor_email = request.GET.get('email')
        if not professor_email:
            return Response({
                'error': 'Professor email is required',
                'detail': 'Please provide professor email as a query parameter'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the professor
        try:
            professor = Professor.objects.get(email=professor_email, is_active=True)
        except Professor.DoesNotExist:
            return Response({
                'error': 'Professor not found',
                'detail': f'No active professor found with email {professor_email}'
            }, status=status.HTTP_404_NOT_FOUND)
        
        logger.info(f"Getting grant recommendations for professor: {professor.email}")
        
        # Get limit parameter
        limit = int(request.GET.get('limit', 25))
        include_dismissed = request.GET.get('include_dismissed', 'false').lower() == 'true'
        
        # Get recommended grants using the matching service
        scored_grants = ProfessorGrantMatchingService.get_recommended_grants(
            professor=professor,
            limit=limit * 2,  # Get more for LLM analysis
            include_dismissed=include_dismissed
        )
        
        if not scored_grants:
            return Response({
                'count': 0,
                'next': None,
                'previous': None,
                'results': [],
                'message': f'No grant recommendations found for professor {professor_email}. Try updating your profile or preferences.'
            }, status=status.HTTP_200_OK)
        
        # Apply LLM relevance analysis to top grants
        try:
            # Process in batches for LLM analysis
            if len(scored_grants) > 0:
                # Process first batch (top 50)
                top_50_analyzed = ProfessorLLMService.apply_llm_relevance_analysis(
                    scored_grants[:50], 
                    professor
                )
                
                # Process second batch (next 50) if we have enough grants
                if len(scored_grants) > 50:
                    next_50_analyzed = ProfessorLLMService.apply_llm_relevance_analysis(
                        scored_grants[50:100], 
                        professor
                    )
                    # Combine both batches and re-sort
                    all_analyzed = top_50_analyzed + next_50_analyzed
                    all_analyzed.sort(key=lambda x: x[1], reverse=True)
                    scored_grants = all_analyzed[:limit]
                else:
                    # Only one batch, take top results
                    scored_grants = top_50_analyzed[:limit]
                
                logger.info(f"Successfully applied LLM analysis to grants for professor {professor.email}")
        except Exception as e:
            logger.error(f"Error in LLM relevance analysis for professor {professor.email}: {str(e)}")
            # Continue with original scores if LLM analysis fails
            scored_grants = scored_grants[:limit]
        
        # Remove duplicates based on grant ID and title while preserving order
        seen_grant_ids = set()
        seen_grant_titles = set()
        unique_scored_grants = []
        for grant, score in scored_grants:
            # Check for both ID and title duplicates
            grant_title_normalized = grant.title.lower().strip() if grant.title else ""
            
            if grant.id not in seen_grant_ids and grant_title_normalized not in seen_grant_titles:
                seen_grant_ids.add(grant.id)
                seen_grant_titles.add(grant_title_normalized)
                unique_scored_grants.append((grant, score))
            else:
                logger.info(f"Removed duplicate grant: ID={grant.id}, Title='{grant.title}'")
        
        scored_grants = unique_scored_grants
        
        # Create recommendations in the database
        ProfessorGrantMatchingService.create_recommendations(professor, scored_grants)
        
        # Paginate results
        paginator = PageNumberPagination()
        paginator.page_size = 25
        
        try:
            paginated_grants = paginator.paginate_queryset(
                [grant for grant, _ in scored_grants], 
                request
            )
        except Exception as pagination_error:
            logger.warning(f"Pagination error: {str(pagination_error)}")
            if "no_results" in str(pagination_error) or "Invalid page" in str(pagination_error):
                return Response({
                    'count': len(scored_grants),
                    'next': None,
                    'previous': request.query_params.get('page', '1'),
                    'results': [],
                    'message': f'No results found for page {request.query_params.get("page", "1")}'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'count': 0,
                    'next': None,
                    'previous': None,
                    'results': [],
                    'message': 'No grant recommendations available at this time'
                }, status=status.HTTP_200_OK)
        
        # Get recommendations in the correct order
        recommendations_dict = {
            rec.grant_id: rec 
            for rec in GrantRecommendation.objects.filter(
                professor=professor, 
                grant__in=paginated_grants
            )
        }
        
        # Preserve the order from paginated_grants
        ordered_recommendations = [
            recommendations_dict[grant.id] 
            for grant in paginated_grants 
            if grant.id in recommendations_dict
        ]
        
        # Serialize and return
        serializer = GrantRecommendationSerializer(ordered_recommendations, many=True)
        return paginator.get_paginated_response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error in get_professor_recommendations: {str(e)}", exc_info=True)
        return Response({
            'error': 'An error occurred while fetching recommendations',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_recommendation_interaction(request):
    """Update a recommendation's interaction status (viewed, saved, dismissed, applied)"""
    try:
        professor_email = request.data.get('professor_email')
        grant_id = request.data.get('grant_id')
        interaction_type = request.data.get('interaction_type')
        
        if not all([professor_email, grant_id, interaction_type]):
            return Response({
                'error': 'Missing required fields',
                'detail': 'professor_email, grant_id, and interaction_type are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if interaction_type not in ['viewed', 'saved', 'dismissed', 'applied']:
            return Response({
                'error': 'Invalid interaction type',
                'detail': 'interaction_type must be one of: viewed, saved, dismissed, applied'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the professor and grant
        try:
            professor = Professor.objects.get(email=professor_email, is_active=True)
            grant = Grant.objects.get(id=grant_id)
        except Professor.DoesNotExist:
            return Response({
                'error': 'Professor not found',
                'detail': f'No active professor found with email {professor_email}'
            }, status=status.HTTP_404_NOT_FOUND)
        except Grant.DoesNotExist:
            return Response({
                'error': 'Grant not found',
                'detail': f'No grant found with ID {grant_id}'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update the recommendation
        ProfessorGrantMatchingService.update_recommendation_interaction(
            professor, grant, interaction_type
        )
        
        return Response({
            'message': f'Successfully updated recommendation interaction: {interaction_type}',
            'professor_email': professor_email,
            'grant_id': grant_id,
            'interaction_type': interaction_type
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error updating recommendation interaction: {str(e)}", exc_info=True)
        return Response({
            'error': 'An error occurred while updating the recommendation',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_professor_profile(request, email):
    """Get a specific professor profile by email"""
    try:
        professor = Professor.objects.get(email=email, is_active=True)
        serializer = ProfessorSerializer(professor)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Professor.DoesNotExist:
        return Response({
            'error': f'Professor with email {email} not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Failed to get professor {email}: {str(e)}")
        return Response({
            'error': f'Failed to get professor {email}',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_professor_profile(request):
    """Create a new professor profile"""
    try:
        serializer = ProfessorSerializer(data=request.data)
        if serializer.is_valid():
            professor = serializer.save()
            logger.info(f"Created new professor profile: {professor.email}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'error': 'Invalid professor data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Failed to create professor profile: {str(e)}")
        return Response({
            'error': 'Failed to create professor profile',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def update_professor_profile(request, email):
    """Update an existing professor profile"""
    try:
        # TEMPORARILY DISABLED AUTH FOR DEMO - TODO: Re-enable after demo
        # Check session token authentication
        # session_token = request.GET.get('session_token')
        # if not session_token:
        #     return Response({
        #         'error': 'Session token required',
        #         'detail': 'Please provide a valid session token'
        #     }, status=status.HTTP_401_UNAUTHORIZED)
        
        # # Verify session token
        # try:
        #     from .models import ProfessorUser
        #     user = ProfessorUser.objects.get(
        #         session_token=session_token,
        #         is_authenticated=True
        #     )
        # except ProfessorUser.DoesNotExist:
        #     return Response({
        #         'error': 'Invalid or expired session',
        #         'detail': 'Please sign in again'
        #     }, status=status.HTTP_401_UNAUTHORIZED)
        
        # # Verify the email matches the authenticated user
        # if user.email.lower() != email.lower():
        #     return Response({
        #         'error': 'Unauthorized',
        #         'detail': 'You can only update your own profile'
        #     }, status=status.HTTP_403_FORBIDDEN)
        
        professor = Professor.objects.get(email=email, is_active=True)
        serializer = ProfessorSerializer(professor, data=request.data, partial=True)
        if serializer.is_valid():
            professor = serializer.save()
            logger.info(f"Updated professor profile: {professor.email}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Invalid professor data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except Professor.DoesNotExist:
        return Response({
            'error': f'Professor with email {email} not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Failed to update professor {email}: {str(e)}")
        return Response({
            'error': f'Failed to update professor {email}',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Forum Views

@api_view(['GET'])
def get_forums(request):
    """Get all active forums"""
    try:
        forums = Forum.objects.filter(is_active=True, is_public=True).order_by('order', 'name')
        serializer = ForumSerializer(forums, many=True)
        return Response({
            'forums': serializer.data,
            'count': len(serializer.data)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Failed to get forums: {str(e)}")
        return Response({
            'error': 'Failed to get forums',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_forum_topics(request, forum_slug):
    """Get topics for a specific forum"""
    try:
        # Get forum
        try:
            forum = Forum.objects.get(slug=forum_slug, is_active=True, is_public=True)
        except Forum.DoesNotExist:
            return Response({
                'error': f'Forum with slug {forum_slug} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get query parameters
        page = request.GET.get('page', 1)
        limit = request.GET.get('limit', 20)
        
        try:
            page = int(page)
            limit = int(limit)
        except ValueError:
            return Response({
                'error': 'Invalid page or limit parameter'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get topics
        topics = forum.topics.all()
        total_count = topics.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        topics = topics[offset:offset + limit]
        
        serializer = TopicListSerializer(topics, many=True, context={'request': request})
        
        return Response({
            'topics': serializer.data,
            'count': len(serializer.data),
            'total_count': total_count,
            'page': page,
            'limit': limit,
            'forum': ForumSerializer(forum).data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Failed to get forum topics: {str(e)}")
        return Response({
            'error': 'Failed to get forum topics',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_topic(request, topic_id):
    """Get a specific topic with its posts"""
    try:
        # Check session token authentication
        session_token = request.GET.get('session_token')
        if not session_token:
            return Response({
                'error': 'Session token required',
                'detail': 'Please provide a valid session token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Verify session token
        try:
            user = ProfessorUser.objects.get(
                session_token=session_token,
                is_authenticated=True
            )
        except ProfessorUser.DoesNotExist:
            return Response({
                'error': 'Invalid or expired session',
                'detail': 'Please sign in again'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get topic
        try:
            topic = Topic.objects.get(id=topic_id)
        except Topic.DoesNotExist:
            return Response({
                'error': f'Topic with ID {topic_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Increment view count
        topic.view_count += 1
        topic.save(update_fields=['view_count'])
        
        serializer = TopicSerializer(topic, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Failed to get topic {topic_id}: {str(e)}")
        return Response({
            'error': f'Failed to get topic {topic_id}',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def create_topic(request):
    """Create a new topic"""
    try:
        # Check session token authentication
        session_token = request.data.get('session_token')
        if not session_token:
            return Response({
                'error': 'Session token required',
                'detail': 'Please provide a valid session token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Verify session token
        try:
            user = ProfessorUser.objects.get(
                session_token=session_token,
                is_authenticated=True
            )
        except ProfessorUser.DoesNotExist:
            return Response({
                'error': 'Invalid or expired session',
                'detail': 'Please sign in again'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get forum
        forum_slug = request.data.get('forum_slug')
        if not forum_slug:
            return Response({
                'error': 'Forum slug is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            forum = Forum.objects.get(slug=forum_slug, is_active=True, is_public=True)
        except Forum.DoesNotExist:
            return Response({
                'error': f'Forum with slug {forum_slug} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Create topic
        topic_data = {
            'forum': forum.id,
            'author': user.id,
            'title': request.data.get('title'),
            'content': request.data.get('content'),
            'is_anonymous': request.data.get('is_anonymous', False)
        }
        
        serializer = TopicSerializer(data=topic_data)
        if serializer.is_valid():
            topic = serializer.save()
            logger.info(f"Created new topic: {topic.title} by {user.email}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'error': 'Invalid topic data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Failed to create topic: {str(e)}")
        return Response({
            'error': 'Failed to create topic',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def create_post(request):
    """Create a new post/reply"""
    try:
        # Check session token authentication
        session_token = request.data.get('session_token')
        if not session_token:
            return Response({
                'error': 'Session token required',
                'detail': 'Please provide a valid session token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Verify session token
        try:
            user = ProfessorUser.objects.get(
                session_token=session_token,
                is_authenticated=True
            )
        except ProfessorUser.DoesNotExist:
            return Response({
                'error': 'Invalid or expired session',
                'detail': 'Please sign in again'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get topic
        topic_id = request.data.get('topic_id')
        if not topic_id:
            return Response({
                'error': 'Topic ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            topic = Topic.objects.get(id=topic_id)
        except Topic.DoesNotExist:
            return Response({
                'error': f'Topic with ID {topic_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if topic is locked
        if topic.is_locked:
            return Response({
                'error': 'This topic is locked and cannot receive new posts'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Create post
        post_data = {
            'topic': topic.id,
            'author': user.id,
            'content': request.data.get('content'),
            'is_anonymous': request.data.get('is_anonymous', False),
            'parent_post': request.data.get('parent_post_id')
        }
        
        serializer = PostSerializer(data=post_data)
        if serializer.is_valid():
            post = serializer.save()
            logger.info(f"Created new post in topic {topic.title} by {user.email}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'error': 'Invalid post data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Failed to create post: {str(e)}")
        return Response({
            'error': 'Failed to create post',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def toggle_post_like(request):
    """Toggle like on a post"""
    try:
        # Check session token authentication
        session_token = request.data.get('session_token')
        if not session_token:
            return Response({
                'error': 'Session token required',
                'detail': 'Please provide a valid session token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Verify session token
        try:
            user = ProfessorUser.objects.get(
                session_token=session_token,
                is_authenticated=True
            )
        except ProfessorUser.DoesNotExist:
            return Response({
                'error': 'Invalid or expired session',
                'detail': 'Please sign in again'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get post
        post_id = request.data.get('post_id')
        if not post_id:
            return Response({
                'error': 'Post ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({
                'error': f'Post with ID {post_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Toggle like
        like_type = request.data.get('like_type', 'like')
        like, created = PostLike.objects.get_or_create(
            post=post,
            user=user,
            defaults={'like_type': like_type}
        )
        
        if not created:
            # Like already exists, remove it
            like.delete()
            action = 'removed'
        else:
            # Like was created
            action = 'added'
        
        # Get updated like count
        like_count = post.likes.count()
        
        return Response({
            'action': action,
            'like_count': like_count,
            'post_id': post_id
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Failed to toggle post like: {str(e)}")
        return Response({
            'error': 'Failed to toggle post like',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def toggle_topic_subscription(request):
    """Toggle subscription to a topic"""
    try:
        # Check session token authentication
        session_token = request.data.get('session_token')
        if not session_token:
            return Response({
                'error': 'Session token required',
                'detail': 'Please provide a valid session token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Verify session token
        try:
            user = ProfessorUser.objects.get(
                session_token=session_token,
                is_authenticated=True
            )
        except ProfessorUser.DoesNotExist:
            return Response({
                'error': 'Invalid or expired session',
                'detail': 'Please sign in again'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get topic
        topic_id = request.data.get('topic_id')
        if not topic_id:
            return Response({
                'error': 'Topic ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            topic = Topic.objects.get(id=topic_id)
        except Topic.DoesNotExist:
            return Response({
                'error': f'Topic with ID {topic_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Toggle subscription
        subscription, created = TopicSubscription.objects.get_or_create(
            topic=topic,
            user=user
        )
        
        if not created:
            # Subscription already exists, remove it
            subscription.delete()
            action = 'unsubscribed'
        else:
            # Subscription was created
            action = 'subscribed'
        
        return Response({
            'action': action,
            'topic_id': topic_id,
            'is_subscribed': created
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Failed to toggle topic subscription: {str(e)}")
        return Response({
            'error': 'Failed to toggle topic subscription',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Saved Grants and Collaboration Views

@api_view(['GET', 'POST'])
def saved_grants(request):
    """Get saved grants for a user or save a new grant"""
    try:
        user = get_current_user_from_request(request)
        if not user:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if request.method == 'GET':
            # Get saved grants for the user
            saved_grants = SavedGrant.objects.filter(user=user).select_related('grant')
            
            # Filter by status if provided
            status_filter = request.GET.get('status')
            if status_filter:
                saved_grants = saved_grants.filter(status=status_filter)
            
            serializer = SavedGrantSerializer(saved_grants, many=True)
            # Use DecimalEncoder to handle Decimal fields in the response
            response_data = {
                'saved_grants': serializer.data,
                'total_count': saved_grants.count()
            }
            # Convert to JSON string and back to handle Decimal fields
            json_str = json.dumps(response_data, cls=DecimalEncoder)
            response_data = json.loads(json_str)
            return Response(response_data, status=status.HTTP_200_OK)
        
        elif request.method == 'POST':
            # Save a new grant
            grant_id = request.data.get('grant_id')
            if not grant_id:
                return Response({'error': 'grant_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                grant = Grant.objects.get(id=grant_id)
            except Grant.DoesNotExist:
                return Response({'error': 'Grant not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if already saved
            if SavedGrant.objects.filter(user=user, grant=grant).exists():
                return Response({'error': 'Grant already saved'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create saved grant
            saved_grant = SavedGrant.objects.create(
                user=user,
                grant=grant,
                notes=request.data.get('notes', ''),
                status=request.data.get('status', 'saved'),
                is_public=request.data.get('is_public', False),
                allow_collaboration=request.data.get('allow_collaboration', True)
            )
            
            serializer = SavedGrantSerializer(saved_grant)
            # Use DecimalEncoder to handle Decimal fields in the response
            response_data = {
                'message': 'Grant saved successfully',
                'saved_grant': serializer.data
            }
            # Convert to JSON string and back to handle Decimal fields
            json_str = json.dumps(response_data, cls=DecimalEncoder)
            response_data = json.loads(json_str)
            return Response(response_data, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Error in saved_grants: {str(e)}")
        return Response({
            'error': 'Failed to process saved grants request',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'DELETE'])
def saved_grant_detail(request, saved_grant_id):
    """Update or delete a saved grant"""
    try:
        user = get_current_user_from_request(request)
        if not user:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            saved_grant = SavedGrant.objects.get(id=saved_grant_id, user=user)
        except SavedGrant.DoesNotExist:
            return Response({'error': 'Saved grant not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if request.method == 'PUT':
            # Update saved grant
            serializer = SavedGrantSerializer(saved_grant, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                # Use DecimalEncoder to handle Decimal fields in the response
                response_data = {
                    'message': 'Saved grant updated successfully',
                    'saved_grant': serializer.data
                }
                # Convert to JSON string and back to handle Decimal fields
                json_str = json.dumps(response_data, cls=DecimalEncoder)
                response_data = json.loads(json_str)
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            # Delete saved grant
            saved_grant.delete()
            return Response({'message': 'Saved grant deleted successfully'}, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error in saved_grant_detail: {str(e)}")
        return Response({
            'error': 'Failed to process saved grant request',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
def collaboration_invites(request):
    """Get collaboration invites for a user or send a new invite"""
    try:
        user = get_current_user_from_request(request)
        if not user:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if request.method == 'GET':
            # Get invites sent by user or received by user
            invite_type = request.GET.get('type', 'received')  # 'sent' or 'received'
            
            if invite_type == 'sent':
                invites = CollaborationInvite.objects.filter(inviter=user)
            else:
                invites = CollaborationInvite.objects.filter(invitee_email=user.email)
            
            # Filter by status if provided
            status_filter = request.GET.get('status')
            if status_filter:
                invites = invites.filter(status=status_filter)
            
            serializer = CollaborationInviteSerializer(invites, many=True)
            return Response({
                'invites': serializer.data,
                'total_count': invites.count()
            }, status=status.HTTP_200_OK)
        
        elif request.method == 'POST':
            # Send a new collaboration invite
            saved_grant_id = request.data.get('saved_grant_id')
            if not saved_grant_id:
                return Response({'error': 'saved_grant_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                saved_grant = SavedGrant.objects.get(id=saved_grant_id, user=user)
            except SavedGrant.DoesNotExist:
                return Response({'error': 'Saved grant not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user can invite collaborators
            if not saved_grant.allow_collaboration:
                return Response({'error': 'Collaboration not allowed for this grant'}, status=status.HTTP_400_BAD_REQUEST)
            
            invitee_email = request.data.get('invitee_email')
            if not invitee_email:
                return Response({'error': 'invitee_email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if already invited
            if CollaborationInvite.objects.filter(
                grant=saved_grant, 
                invitee_email=invitee_email,
                status='pending'
            ).exists():
                return Response({'error': 'Invitation already sent to this email'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create collaboration invite
            invite = CollaborationInvite.objects.create(
                grant=saved_grant,
                inviter=user,
                invitee_email=invitee_email,
                invitee_name=request.data.get('invitee_name', ''),
                message=request.data.get('message', ''),
                role=request.data.get('role', 'collaborator')
            )
            
            serializer = CollaborationInviteSerializer(invite)
            return Response({
                'message': 'Collaboration invite sent successfully',
                'invite': serializer.data
            }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Error in collaboration_invites: {str(e)}")
        return Response({
            'error': 'Failed to process collaboration invites request',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def collaboration_invite_response(request, invite_id):
    """Respond to a collaboration invite (accept/decline)"""
    try:
        user = get_current_user_from_request(request)
        if not user:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            invite = CollaborationInvite.objects.get(id=invite_id, invitee_email=user.email)
        except CollaborationInvite.DoesNotExist:
            return Response({'error': 'Invitation not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if invite.status != 'pending':
            return Response({'error': 'Invitation has already been responded to'}, status=status.HTTP_400_BAD_REQUEST)
        
        response = request.data.get('response')  # 'accept' or 'decline'
        if response not in ['accept', 'decline']:
            return Response({'error': 'Response must be "accept" or "decline"'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.utils import timezone
        
        if response == 'accept':
            # Accept the invitation
            invite.status = 'accepted'
            invite.responded_at = timezone.now()
            invite.save()
            
            # Create collaboration
            collaboration = Collaboration.objects.create(
                grant=invite.grant,
                collaborator=user,
                invite=invite,
                role=invite.role,
                contribution_notes=request.data.get('contribution_notes', '')
            )
            
            collaboration_serializer = CollaborationSerializer(collaboration)
            return Response({
                'message': 'Collaboration invite accepted',
                'collaboration': collaboration_serializer.data
            }, status=status.HTTP_200_OK)
        
        else:
            # Decline the invitation
            invite.status = 'declined'
            invite.responded_at = timezone.now()
            invite.save()
            
            return Response({'message': 'Collaboration invite declined'}, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error in collaboration_invite_response: {str(e)}")
        return Response({
            'error': 'Failed to process collaboration invite response',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def collaborations(request):
    """Get active collaborations for a user"""
    try:
        user = get_current_user_from_request(request)
        if not user:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get collaborations where user is a collaborator
        collaborations = Collaboration.objects.filter(
            collaborator=user, 
            is_active=True
        ).select_related('grant__grant')
        
        serializer = CollaborationSerializer(collaborations, many=True)
        return Response({
            'collaborations': serializer.data,
            'total_count': collaborations.count()
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error in collaborations: {str(e)}")
        return Response({
            'error': 'Failed to get collaborations',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def grant_collaborators(request, saved_grant_id):
    """Get collaborators for a specific saved grant"""
    try:
        user = get_current_user_from_request(request)
        if not user:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            saved_grant = SavedGrant.objects.get(id=saved_grant_id, user=user)
        except SavedGrant.DoesNotExist:
            return Response({'error': 'Saved grant not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get active collaborations for this grant
        collaborations = Collaboration.objects.filter(
            grant=saved_grant, 
            is_active=True
        ).select_related('collaborator')
        
        serializer = CollaborationSerializer(collaborations, many=True)
        return Response({
            'collaborators': serializer.data,
            'total_count': collaborations.count()
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error in grant_collaborators: {str(e)}")
        return Response({
            'error': 'Failed to get grant collaborators',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Natural Language Search endpoints

@api_view(['GET'])
def natural_language_search_grants(request):
    """Search grants using two-stage natural language processing"""
    try:
        query = request.GET.get('q', '').strip()
        limit = request.GET.get('limit', 20)
        
        if not query:
            return Response({
                'error': 'Query parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert limit to integer
        try:
            limit = int(limit)
            if limit > 50:  # Cap at 50 for performance
                limit = 50
        except ValueError:
            return Response({
                'error': 'Invalid limit parameter'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Starting three-stage natural language grant search for query: '{query}'")
        
        # Perform three-stage natural language search
        scored_grants = NaturalLanguageSearchService.search_grants_with_nlp(query, limit)
        
        # Handle case where search service returns None or empty results
        if not scored_grants:
            scored_grants = []
        
        logger.info(f"Found {len(scored_grants)} grants with relevance scores")
        
        # Remove duplicates based on grant ID and title while preserving order
        seen_grant_ids = set()
        seen_grant_titles = set()
        unique_scored_grants = []
        for grant, score in scored_grants:
            # Check for both ID and title duplicates
            grant_title_normalized = grant.title.lower().strip() if grant.title else ""
            
            if grant.id not in seen_grant_ids and grant_title_normalized not in seen_grant_titles:
                seen_grant_ids.add(grant.id)
                seen_grant_titles.add(grant_title_normalized)
                unique_scored_grants.append((grant, score))
            else:
                logger.info(f"Removed duplicate grant from NLP search: ID={grant.id}, Title='{grant.title}'")
        
        scored_grants = unique_scored_grants
        
        # Separate grants and scores
        grants = [grant for grant, score in scored_grants]
        scores = [score for grant, score in scored_grants]
        
        # Serialize the results
        serializer = GrantSerializer(grants, many=True)
        
        # Add relevance scores to the response
        results_with_scores = []
        for i, grant_data in enumerate(serializer.data):
            grant_data['relevance_score'] = scores[i] if i < len(scores) else 0.0
            results_with_scores.append(grant_data)
        
        # Always return consistent structure, even with empty results
        return Response({
            'grants': results_with_scores,
            'count': len(results_with_scores),
            'query': query,
            'search_type': 'three_stage_natural_language',
            'stages': {
                'stage1': 'AI-generated database filters',
                'stage2': 'Rule-based scoring with enhanced fuzzy matching',
                'stage3': 'AI relevance analysis of top results against search query'
            },
            'message': f'Found {len(results_with_scores)} grants for query: {query}' if len(results_with_scores) > 0 else f'No grants found for query: {query}'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Three-stage natural language grant search failed: {str(e)}")
        return Response({
            'error': 'Failed to perform three-stage natural language search',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def natural_language_search_profiles(request):
    """Search researcher profiles using two-stage natural language processing"""
    try:
        query = request.GET.get('q', '').strip()
        limit = request.GET.get('limit', 20)
        
        if not query:
            return Response({
                'error': 'Query parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert limit to integer
        try:
            limit = int(limit)
            if limit > 50:  # Cap at 50 for performance
                limit = 50
        except ValueError:
            return Response({
                'error': 'Invalid limit parameter'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Starting three-stage natural language profile search for query: '{query}'")
        
        # Perform three-stage natural language search
        scored_profiles = NaturalLanguageSearchService.search_profiles_with_nlp(query, limit)
        
        # Handle case where search service returns None or empty results
        if not scored_profiles:
            scored_profiles = []
        
        logger.info(f"Found {len(scored_profiles)} profiles with relevance scores")
        
        # Remove duplicates based on profile email and name while preserving order
        seen_profile_emails = set()
        seen_profile_names = set()
        unique_scored_profiles = []
        for profile, score in scored_profiles:
            # Check for both email and name duplicates
            profile_name_normalized = profile.name.lower().strip() if profile.name else ""
            
            if profile.email not in seen_profile_emails and profile_name_normalized not in seen_profile_names:
                seen_profile_emails.add(profile.email)
                seen_profile_names.add(profile_name_normalized)
                unique_scored_profiles.append((profile, score))
            else:
                logger.info(f"Removed duplicate profile from NLP search: Email={profile.email}, Name='{profile.name}'")
        
        scored_profiles = unique_scored_profiles
        
        # Separate profiles and scores
        profiles = [profile for profile, score in scored_profiles]
        scores = [score for profile, score in scored_profiles]
        
        # Serialize the results
        serializer = ResearcherProfileSerializer(profiles, many=True)
        
        # Add relevance scores to the response
        results_with_scores = []
        for i, profile_data in enumerate(serializer.data):
            profile_data['relevance_score'] = scores[i] if i < len(scores) else 0.0
            results_with_scores.append(profile_data)
        
        # Always return consistent structure, even with empty results
        return Response({
            'profiles': results_with_scores,
            'count': len(results_with_scores),
            'query': query,
            'search_type': 'three_stage_natural_language',
            'stages': {
                'stage1': 'AI-generated database filters',
                'stage2': 'Rule-based scoring with enhanced fuzzy matching',
                'stage3': 'AI relevance analysis of top results against search query'
            },
            'message': f'Found {len(results_with_scores)} profiles for query: {query}' if len(results_with_scores) > 0 else f'No profiles found for query: {query}'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Two-stage natural language profile search failed: {str(e)}")
        return Response({
            'error': 'Failed to perform three-stage natural language search',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Grant Pipeline Views

@api_view(['GET', 'POST'])
def grant_pipeline(request):
    """Get or add grants to professor's pipeline"""
    try:
        user = get_current_user_from_request(request)
        if not user:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get professor profile
        professor = user.get_or_create_professor_profile()
        
        if request.method == 'GET':
            # Get pipeline stages and grants
            stages = professor.get_or_create_pipeline_stages()
            stage_serializer = GrantPipelineStageSerializer(stages, many=True)
            
            # Get all pipeline entries
            pipeline_entries = professor.get_pipeline_grants()
            entry_serializer = GrantPipelineEntrySerializer(pipeline_entries, many=True)
            
            return Response({
                'stages': stage_serializer.data,
                'pipeline_entries': entry_serializer.data,
                'total_grants': pipeline_entries.count()
            }, status=status.HTTP_200_OK)
        
        elif request.method == 'POST':
            # Add grant to pipeline
            grant_id = request.data.get('grant_id')
            stage_name = request.data.get('stage_name', 'Saved Opportunities')
            notes = request.data.get('notes', '')
            priority = request.data.get('priority', 'medium')
            
            if not grant_id:
                return Response({'error': 'grant_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                grant = Grant.objects.get(id=grant_id)
            except Grant.DoesNotExist:
                return Response({'error': 'Grant not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Add grant to pipeline
            pipeline_entry = professor.add_grant_to_pipeline(
                grant=grant,
                stage_name=stage_name,
                notes=notes,
                priority=priority
            )
            
            serializer = GrantPipelineEntrySerializer(pipeline_entry)
            return Response({
                'message': 'Grant added to pipeline successfully',
                'pipeline_entry': serializer.data
            }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Error in grant_pipeline: {str(e)}")
        return Response({
            'error': 'Failed to process pipeline request',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'DELETE'])
def grant_pipeline_entry(request, entry_id):
    """Update or remove a grant from pipeline"""
    try:
        user = get_current_user_from_request(request)
        if not user:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get professor profile
        professor = user.get_or_create_professor_profile()
        
        try:
            pipeline_entry = GrantPipelineEntry.objects.get(id=entry_id, professor=professor)
        except GrantPipelineEntry.DoesNotExist:
            return Response({'error': 'Pipeline entry not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if request.method == 'PUT':
            # Update pipeline entry
            serializer = GrantPipelineEntrySerializer(pipeline_entry, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'message': 'Pipeline entry updated successfully',
                    'pipeline_entry': serializer.data
                }, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            # Remove grant from pipeline
            pipeline_entry.delete()
            return Response({'message': 'Grant removed from pipeline successfully'}, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error in grant_pipeline_entry: {str(e)}")
        return Response({
            'error': 'Failed to process pipeline entry request',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def move_grant_to_stage(request, entry_id):
    """Move a grant to a different pipeline stage"""
    try:
        user = get_current_user_from_request(request)
        if not user:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get professor profile
        professor = user.get_or_create_professor_profile()
        
        try:
            pipeline_entry = GrantPipelineEntry.objects.get(id=entry_id, professor=professor)
        except GrantPipelineEntry.DoesNotExist:
            return Response({'error': 'Pipeline entry not found'}, status=status.HTTP_404_NOT_FOUND)
        
        stage_name = request.data.get('stage_name')
        if not stage_name:
            return Response({'error': 'stage_name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_stage = GrantPipelineStage.objects.get(professor=professor, name=stage_name)
        except GrantPipelineStage.DoesNotExist:
            return Response({'error': f'Stage "{stage_name}" not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Move grant to new stage
        pipeline_entry.move_to_stage(new_stage)
        
        serializer = GrantPipelineEntrySerializer(pipeline_entry)
        return Response({
            'message': f'Grant moved to {stage_name} successfully',
            'pipeline_entry': serializer.data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error in move_grant_to_stage: {str(e)}")
        return Response({
            'error': 'Failed to move grant to stage',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def pipeline_stages(request):
    """Get pipeline stages for a professor"""
    try:
        user = get_current_user_from_request(request)
        if not user:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get professor profile
        professor = user.get_or_create_professor_profile()
        
        # Get or create pipeline stages
        stages = professor.get_or_create_pipeline_stages()
        serializer = GrantPipelineStageSerializer(stages, many=True)
        
        return Response({
            'stages': serializer.data,
            'total_stages': stages.count()
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error in pipeline_stages: {str(e)}")
        return Response({
            'error': 'Failed to get pipeline stages',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def cardinal_concordia_chatbot(request):
    """Cardinal Concordia AI chatbot endpoint with streaming responses"""
    try:
        logger.info(f"Chatbot request received: {request.data}")
        
        question = request.data.get('question')
        if not question:
            logger.warning("No question provided in chatbot request")
            return Response({'error': 'Question is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        conversation_history = request.data.get('conversation_history', [])
        logger.info(f"Question: {question}, History length: {len(conversation_history)}")
        
        # Get some sample grants and profiles for context
        try:
            recent_grants = list(Grant.objects.all()[:5])
            recent_profiles = list(ResearcherProfile.objects.all()[:5])
            logger.info(f"Found {len(recent_grants)} grants and {len(recent_profiles)} profiles")
        except Exception as e:
            logger.error(f"Error fetching grants/profiles: {str(e)}")
            recent_grants = []
            recent_profiles = []
        
        # Build context from grants and profiles with null checks
        grants_context = "\n".join([
            f"Grant: {grant.title or 'Untitled'} - {(grant.description or 'No description')[:200]}..." 
            for grant in recent_grants
        ]) if recent_grants else "No grants available"
        
        profiles_context = "\n".join([
            f"Researcher: {profile.name or 'Unknown'} - {(profile.bio or 'No bio available')[:200]}..." 
            for profile in recent_profiles
        ]) if recent_profiles else "No researchers available"
        
        # Build conversation history context
        conversation_context = ""
        if conversation_history and isinstance(conversation_history, list):
            try:
                conversation_context = "\n".join([
                    f"{'User' if msg.get('type') == 'user' else 'Assistant'}: {msg.get('content', '')}"
                    for msg in conversation_history[-3:]  # Last 3 messages for context
                    if isinstance(msg, dict)  # Ensure msg is a dictionary
                ])
            except Exception as e:
                logger.warning(f"Error processing conversation history: {str(e)}")
                conversation_context = ""
        
        # System prompt for Cardinal Concordia
        system_prompt = """
        You are Cardinal Concordia, an AI research assistant specializing in helping researchers find grants, connect with collaborators, and navigate the research funding landscape. 
        
        Your responses must be focused on research grants, funding opportunities, researcher collaboration, and academic research topics. 
        If a user asks about anything unrelated to research, grants, or academic collaboration, politely redirect the conversation back to these topics.
        
        IMPORTANT: Use proper markdown formatting to enhance readability:
        - Use **bold** for emphasis on key points
        - Use *italic* for important terms or definitions
        - Use ### for section headers
        - Use bullet points (- or *) for lists
        - Use numbered lists (1. 2. 3.) for steps or sequences
        - Use `code` for technical terms, grant numbers, or specific values
        - Use > for important callouts or tips
        - Structure your responses with clear sections and proper formatting
        
        Always be helpful, encouraging, and provide actionable advice for researchers.
        """
        
        # Build messages for AI
        messages = [
            {"role": "user", "content": f"""
            Context about Cardinal Concordia Platform:
            
            **Available Grants:**
            {grants_context[:1000]}
            
            **Available Researchers:**
            {profiles_context[:1000]}
            
            **Previous Conversation:**
            {conversation_context}
            
            **Current Question:** {question}
            
            Please provide a helpful response about research grants, finding collaborators, or platform features. Use markdown formatting for better readability.
            """}
        ]
        
        def generate():
            try:
                logger.info("Starting chatbot response generation")
                
                # Check if Gemini API key is available
                if not hasattr(settings, 'GEMINI_API_KEY') or not settings.GEMINI_API_KEY:
                    logger.warning("No Gemini API key available, using fallback response")
                    # Fallback to simple response if no API key
                    fallback_response = get_fallback_response(question)
                    yield f"data: {json.dumps({'content': fallback_response})}\n\n"
                    yield f"data: {json.dumps({'done': True, 'query_id': 'fallback'})}\n\n"
                    return
                
                logger.info("Configuring Gemini API")
                # Configure Gemini
                genai.configure(api_key=settings.GEMINI_API_KEY)
                
                # Create the model
                model = genai.GenerativeModel('gemini-2.0-flash')
                
                # Build the full prompt with system prompt and user message
                full_prompt = f"{system_prompt}\n\nUser: {messages[0]['content']}"
                logger.info(f"Generated prompt length: {len(full_prompt)}")
                
                # Generate content with streaming
                logger.info("Starting Gemini content generation")
                response = model.generate_content(
                    full_prompt,
                    stream=True
                )
                
                full_response = ""
                chunk_count = 0
                for chunk in response:
                    if chunk.text:
                        content = chunk.text
                        full_response += content
                        chunk_count += 1
                        yield f"data: {json.dumps({'content': content})}\n\n"
                
                logger.info(f"Completed streaming response with {chunk_count} chunks")
                # Send final message
                yield f"data: {json.dumps({'done': True, 'query_id': f'chat_{int(timezone.now().timestamp())}'})}\n\n"
                
            except Exception as e:
                logger.error(f"Error in streaming response: {str(e)}", exc_info=True)
                # Fallback to simple response on error
                fallback_response = get_fallback_response(question)
                yield f"data: {json.dumps({'content': fallback_response})}\n\n"
                yield f"data: {json.dumps({'done': True, 'query_id': 'error_fallback'})}\n\n"

        return StreamingHttpResponse(
            generate(),
            content_type='text/event-stream'
        )
    
    except Exception as e:
        logger.error(f"Error in cardinal_concordia_chatbot: {str(e)}", exc_info=True)
        return Response({
            'error': 'Failed to process chatbot request',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_fallback_response(question):
    """Fallback response when AI service is not available"""
    question_lower = question.lower()
    
    if any(word in question_lower for word in ['grant', 'funding', 'research']):
        return """I can help you find research grants! Based on your question about grants, here are some ways I can assist:

**Available Grant Search Features:**
- Use the "Search Grants" tab to find funding opportunities
- Try natural language searches like "NSF grants for AI research"
- Browse by agency, amount, or deadline
- Save interesting grants to your personal collection

**Current Available Grants:**
The platform contains thousands of grant opportunities from various agencies including NSF, NIH, DOE, and more.

Would you like me to help you search for specific types of grants or funding opportunities?"""
    
    elif any(word in question_lower for word in ['researcher', 'professor', 'collaboration', 'expert']):
        return """I can help you connect with researchers! Here's how to find collaborators:

**Researcher Discovery Features:**
- Use the "Find Researchers" tab to search for experts
- Search by research area, university, or expertise
- View detailed profiles with research interests
- Connect with potential collaborators

**Available Researchers:**
The platform includes profiles of researchers from universities across the country with diverse expertise areas.

What specific research area or expertise are you looking for in a collaborator?"""
    
    elif any(word in question_lower for word in ['help', 'how', 'what', 'platform']):
        return """Welcome to Cardinal Concordia! I'm your AI research assistant. Here's what I can help you with:

**🔍 Grant Discovery**
- Find funding opportunities from various agencies
- Search using natural language queries
- Filter by amount, deadline, and research area

**👥 Researcher Network**
- Discover researchers and potential collaborators
- Search by expertise and institution
- Connect with like-minded academics

**📁 Personal Organization**
- Save grants to your personal collection
- Track your grant pipeline and applications
- Manage collaboration invitations

**💬 Community Forum**
- Join discussions with other researchers
- Share insights and ask questions
- Stay updated on research trends

**🎯 AI-Powered Matching**
- Get personalized grant recommendations
- Find researchers with complementary expertise
- Receive insights based on your profile

How can I assist you today?"""
    
    elif any(word in question_lower for word in ['saved', 'collection', 'bookmark']):
        return """I can help you manage your saved grants! Here's what you can do:

**Saved Grants Features:**
- View all grants you've saved in the "My Saved Grants" tab
- Organize grants by priority or deadline
- Add notes and reminders to each grant
- Track your application progress

**Grant Pipeline Management:**
- Move grants through different stages (Interested, Applied, Awarded, etc.)
- Set custom pipeline stages that match your workflow
- Get reminders about upcoming deadlines

To access your saved grants, click on the "My Saved Grants" tab in the main navigation. You can also save grants directly from the search results by clicking the save button.

Would you like help with organizing your saved grants or setting up your grant pipeline?"""
    
    else:
        return f"""I understand you're asking about: "{question}"

As Cardinal Concordia, I'm here to help you with research grants, finding collaborators, and navigating our platform. I can assist with:

- **Grant Discovery**: Finding funding opportunities
- **Researcher Matching**: Connecting with potential collaborators  
- **Platform Navigation**: Understanding features and tools
- **Research Strategy**: Tips for successful grant applications

Could you rephrase your question to focus on grants, researchers, or platform features? I'm designed to help with research-related topics and platform functionality.

For example, you could ask:
- "How do I find NSF grants for AI research?"
- "Who are researchers working on climate change?"
- "How do I save grants to my collection?"""

