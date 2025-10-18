from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.http import JsonResponse
from django.db.models import Q
from django.utils.dateparse import parse_date
from django.utils import timezone
from api.models import Grant, Professor
from .models import GrantDraft
from .serializers import GrantDraftSerializer, GrantDraftCreateSerializer, GrantDraftUpdateSerializer
from .services import GrantDraftService
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


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