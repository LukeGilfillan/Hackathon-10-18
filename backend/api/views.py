from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.http import JsonResponse
from django.db.models import Q
from django.utils.dateparse import parse_date
from django.utils import timezone
from .services import IgniteHubService
from .models import Grant, ResearcherProfile, Professor, GrantRecommendation, GrantDraft
from .serializers import GrantSerializer, ResearcherProfileSerializer, ProfessorSerializer, GrantRecommendationSerializer, GrantDraftSerializer, GrantDraftCreateSerializer, GrantDraftUpdateSerializer
from .professor_matching_service import ProfessorGrantMatchingService
from .professor_llm_service import ProfessorLLMService
from .grant_draft_service import GrantDraftService
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

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
        
        # Serialize the results
        serializer = GrantSerializer(grants, many=True)
        
        return Response({
            'grants': serializer.data,
            'count': len(serializer.data),
            'total_count': total_count,
            'offset': offset,
            'limit': limit
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
        
        # Serialize the results
        serializer = ResearcherProfileSerializer(profiles, many=True)
        
        return Response({
            'profiles': serializer.data,
            'count': len(serializer.data),
            'total_count': total_count,
            'offset': offset,
            'limit': limit
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
                'results': []
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
                    'results': []
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'count': 0,
                    'next': None,
                    'previous': None,
                    'results': []
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
@permission_classes([IsAuthenticated])
def update_professor_profile(request, email):
    """Update an existing professor profile"""
    try:
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


# Grant Draft Views

@api_view(['GET'])
def list_grant_drafts(request):
    """List grant drafts for a professor"""
    try:
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
        
        # Get filter parameters
        status_filter = request.GET.get('status')
        grant_id = request.GET.get('grant_id')
        
        # Build query
        drafts_query = GrantDraft.objects.filter(professor=professor)
        
        if status_filter:
            drafts_query = drafts_query.filter(status=status_filter)
        
        if grant_id:
            drafts_query = drafts_query.filter(grant_id=grant_id)
        
        # Order by most recent first
        drafts = drafts_query.order_by('-updated_at', '-created_at')
        
        # Paginate results
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(drafts, request)
        
        if page is not None:
            serializer = GrantDraftSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = GrantDraftSerializer(drafts, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error listing grant drafts: {str(e)}")
        return Response({
            'error': 'Failed to list grant drafts',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_grant_draft(request, draft_id):
    """Get a specific grant draft"""
    try:
        draft = GrantDraft.objects.get(id=draft_id)
        serializer = GrantDraftSerializer(draft)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except GrantDraft.DoesNotExist:
        return Response({
            'error': 'Grant draft not found',
            'detail': f'No draft found with ID {draft_id}'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error getting grant draft {draft_id}: {str(e)}")
        return Response({
            'error': 'Failed to get grant draft',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def create_grant_draft(request):
    """Create a new grant draft (AI-generated or manual)"""
    try:
        serializer = GrantDraftCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get professor and grant
        professor = Professor.objects.get(id=serializer.validated_data['professor_id'])
        grant = Grant.objects.get(id=serializer.validated_data['grant_id'])
        custom_instructions = serializer.validated_data.get('custom_instructions', '')
        
        # Check if a draft already exists for this professor-grant combination
        existing_draft = GrantDraft.objects.filter(
            professor=professor,
            grant=grant
        ).first()
        
        if existing_draft:
            return Response({
                'error': 'Draft already exists',
                'detail': f'A draft already exists for this professor-grant combination (ID: {existing_draft.id})',
                'existing_draft_id': existing_draft.id
            }, status=status.HTTP_409_CONFLICT)
        
        # Generate the draft using AI
        draft = GrantDraftService.generate_grant_draft(
            professor=professor,
            grant=grant,
            custom_instructions=custom_instructions
        )
        
        # Update with any manual content provided
        manual_data = {k: v for k, v in serializer.validated_data.items() 
                      if k not in ['professor_id', 'grant_id', 'custom_instructions'] and v}
        
        if manual_data:
            for field, value in manual_data.items():
                setattr(draft, field, value)
            draft.save()
        
        response_serializer = GrantDraftSerializer(draft)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
    except Professor.DoesNotExist:
        return Response({
            'error': 'Professor not found',
            'detail': 'The specified professor does not exist or is inactive'
        }, status=status.HTTP_404_NOT_FOUND)
    except Grant.DoesNotExist:
        return Response({
            'error': 'Grant not found',
            'detail': 'The specified grant does not exist'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error creating grant draft: {str(e)}")
        return Response({
            'error': 'Failed to create grant draft',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
def update_grant_draft(request, draft_id):
    """Update an existing grant draft"""
    try:
        draft = GrantDraft.objects.get(id=draft_id)
        
        # Use PATCH for partial updates, PUT for full updates
        partial = request.method == 'PATCH'
        serializer = GrantDraftUpdateSerializer(draft, data=request.data, partial=partial)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update the draft
        updated_draft = serializer.save()
        
        response_serializer = GrantDraftSerializer(updated_draft)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
        
    except GrantDraft.DoesNotExist:
        return Response({
            'error': 'Grant draft not found',
            'detail': f'No draft found with ID {draft_id}'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error updating grant draft {draft_id}: {str(e)}")
        return Response({
            'error': 'Failed to update grant draft',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
def delete_grant_draft(request, draft_id):
    """Delete a grant draft"""
    try:
        draft = GrantDraft.objects.get(id=draft_id)
        draft.delete()
        
        return Response({
            'message': 'Grant draft deleted successfully'
        }, status=status.HTTP_200_OK)
        
    except GrantDraft.DoesNotExist:
        return Response({
            'error': 'Grant draft not found',
            'detail': f'No draft found with ID {draft_id}'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error deleting grant draft {draft_id}: {str(e)}")
        return Response({
            'error': 'Failed to delete grant draft',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def improve_draft_section(request, draft_id):
    """Improve a specific section of a grant draft using AI"""
    try:
        draft = GrantDraft.objects.get(id=draft_id)
        
        section_name = request.data.get('section_name')
        improvement_instructions = request.data.get('improvement_instructions', '')
        
        if not section_name:
            return Response({
                'error': 'Section name is required',
                'detail': 'Please specify which section to improve'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate section name
        valid_sections = [
            'project_summary', 'research_objectives', 'methodology', 'expected_outcomes',
            'budget_justification', 'timeline', 'team_description', 'institutional_support',
            'broader_impacts'
        ]
        
        if section_name not in valid_sections:
            return Response({
                'error': 'Invalid section name',
                'detail': f'Valid sections are: {", ".join(valid_sections)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Improve the section using AI
        improved_content = GrantDraftService.improve_draft_section(
            draft=draft,
            section_name=section_name,
            improvement_instructions=improvement_instructions
        )
        
        if improved_content:
            # Update the draft with improved content
            setattr(draft, section_name, improved_content)
            draft.ai_generated = False  # Mark as user-edited after AI improvement
            draft.save()
            
            response_serializer = GrantDraftSerializer(draft)
            return Response({
                'message': f'Successfully improved {section_name} section',
                'draft': response_serializer.data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to improve section',
                'detail': 'AI improvement service is not available or failed'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
    except GrantDraft.DoesNotExist:
        return Response({
            'error': 'Grant draft not found',
            'detail': f'No draft found with ID {draft_id}'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error improving draft section {draft_id}: {str(e)}")
        return Response({
            'error': 'Failed to improve draft section',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_draft_suggestions(request, draft_id):
    """Get AI-powered suggestions for improving a grant draft"""
    try:
        draft = GrantDraft.objects.get(id=draft_id)
        
        # Get suggestions using AI
        suggestions = GrantDraftService.get_draft_suggestions(draft)
        
        if suggestions:
            return Response({
                'draft_id': draft_id,
                'suggestions': suggestions
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to generate suggestions',
                'detail': 'AI suggestion service is not available or failed'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
    except GrantDraft.DoesNotExist:
        return Response({
            'error': 'Grant draft not found',
            'detail': f'No draft found with ID {draft_id}'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error getting draft suggestions {draft_id}: {str(e)}")
        return Response({
            'error': 'Failed to get draft suggestions',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def create_draft_version(request, draft_id):
    """Create a new version of an existing draft"""
    try:
        draft = GrantDraft.objects.get(id=draft_id)
        
        # Create new version
        new_draft = draft.create_new_version()
        
        response_serializer = GrantDraftSerializer(new_draft)
        return Response({
            'message': 'New draft version created successfully',
            'draft': response_serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except GrantDraft.DoesNotExist:
        return Response({
            'error': 'Grant draft not found',
            'detail': f'No draft found with ID {draft_id}'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error creating draft version {draft_id}: {str(e)}")
        return Response({
            'error': 'Failed to create draft version',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)