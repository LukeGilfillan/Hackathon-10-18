from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.http import JsonResponse, HttpResponse
from django.db.models import Q
from django.utils.dateparse import parse_date
from django.utils import timezone
from django.shortcuts import get_object_or_404
from api.models import Grant, Professor
from .models import GrantDraft
from .serializers import GrantDraftSerializer, GrantDraftCreateSerializer, GrantDraftUpdateSerializer
from .services import GrantDraftService
import logging
from datetime import datetime
from io import BytesIO
import re
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE

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


@api_view(['GET'])
def download_proposal(request, draft_id, format_type='docx'):
    """Download a grant proposal as a Word document or PDF"""
    try:
        # Get the draft
        draft = get_object_or_404(GrantDraft, id=draft_id)
        
        # Check if user has permission (for now, allow any authenticated user)
        # In production, you might want to check if the user is the professor who created the draft
        
        if format_type == 'docx':
            return generate_docx(draft)
        else:
            return Response({
                'error': 'PDF format not yet implemented'
            }, status=status.HTTP_501_NOT_IMPLEMENTED)
            
    except Exception as e:
        logger.error(f"Error downloading proposal {draft_id}: {str(e)}")
        return Response({
            'error': 'Failed to download proposal',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def generate_docx(draft):
    """Generate a Word document from a grant draft"""
    try:
        # Create document
        document = Document()
        
        # Set margins
        for section in document.sections:
            section.top_margin = Inches(1)
            section.bottom_margin = Inches(1)
            section.left_margin = Inches(1)
            section.right_margin = Inches(1)
        
        # Add cover page
        add_cover_page(document, draft)
        
        # Add table of contents
        add_table_of_contents(document, draft)
        
        # Add sections
        add_draft_sections(document, draft)
        
        # Save document
        docx_file = BytesIO()
        document.save(docx_file)
        docx_file.seek(0)
        
        # Create response
        response = HttpResponse(
            docx_file.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        filename = f"{draft.title or 'Grant_Proposal'}.docx"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        return response
        
    except Exception as e:
        logger.error(f"Error generating DOCX for draft {draft.id}: {str(e)}")
        raise


def add_cover_page(document, draft):
    """Add a cover page to the document"""
    # Title
    title_paragraph = document.add_paragraph()
    title_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_paragraph.add_run(draft.title or f"Grant Application: {draft.grant.title}")
    title_run.font.name = 'Calibri'
    title_run.font.size = Pt(24)
    title_run.font.bold = True
    
    # Subtitle
    subtitle_paragraph = document.add_paragraph()
    subtitle_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle_run = subtitle_paragraph.add_run("Grant Application Proposal")
    subtitle_run.font.name = 'Calibri'
    subtitle_run.font.size = Pt(16)
    subtitle_run.font.italic = True
    
    # Professor info
    prof_paragraph = document.add_paragraph()
    prof_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    prof_run = prof_paragraph.add_run(f"Principal Investigator: {draft.professor.name}")
    prof_run.font.name = 'Calibri'
    prof_run.font.size = Pt(14)
    
    # Department info
    if draft.professor.department:
        dept_paragraph = document.add_paragraph()
        dept_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        dept_run = dept_paragraph.add_run(f"Department: {draft.professor.department}")
        dept_run.font.name = 'Calibri'
        dept_run.font.size = Pt(12)
    
    # University info
    if draft.professor.university:
        univ_paragraph = document.add_paragraph()
        univ_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        univ_run = univ_paragraph.add_run(f"Institution: {draft.professor.university}")
        univ_run.font.name = 'Calibri'
        univ_run.font.size = Pt(12)
    
    # Grant info
    grant_paragraph = document.add_paragraph()
    grant_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    grant_run = grant_paragraph.add_run(f"Grant Opportunity: {draft.grant.title}")
    grant_run.font.name = 'Calibri'
    grant_run.font.size = Pt(12)
    
    # Agency info
    if draft.grant.agency_name:
        agency_paragraph = document.add_paragraph()
        agency_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        agency_run = agency_paragraph.add_run(f"Funding Agency: {draft.grant.agency_name}")
        agency_run.font.name = 'Calibri'
        agency_run.font.size = Pt(12)
    
    # Date
    date_paragraph = document.add_paragraph()
    date_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    date_run = date_paragraph.add_run(f"Date: {draft.created_at.strftime('%B %d, %Y')}")
    date_run.font.name = 'Calibri'
    date_run.font.size = Pt(12)
    
    # Add page break
    document.add_page_break()


def add_table_of_contents(document, draft):
    """Add a table of contents to the document"""
    # TOC heading
    toc_heading = document.add_heading('Table of Contents', level=1)
    
    # Get all sections with content
    sections = []
    if draft.project_summary:
        sections.append('Project Summary')
    if draft.research_objectives:
        sections.append('Research Objectives')
    if draft.methodology:
        sections.append('Methodology')
    if draft.expected_outcomes:
        sections.append('Expected Outcomes')
    if draft.budget_justification:
        sections.append('Budget Justification')
    if draft.timeline:
        sections.append('Timeline')
    if draft.team_description:
        sections.append('Team Description')
    if draft.institutional_support:
        sections.append('Institutional Support')
    if draft.broader_impacts:
        sections.append('Broader Impacts')
    
    # Add TOC entries
    for i, section in enumerate(sections, 1):
        toc_paragraph = document.add_paragraph()
        toc_paragraph.add_run(f"{i}. {section}")
        toc_paragraph.paragraph_format.left_indent = Inches(0.5)
    
    # Add page break
    document.add_page_break()


def add_draft_sections(document, draft):
    """Add all draft sections to the document"""
    sections = [
        ('Project Summary', draft.project_summary),
        ('Research Objectives', draft.research_objectives),
        ('Methodology', draft.methodology),
        ('Expected Outcomes', draft.expected_outcomes),
        ('Budget Justification', draft.budget_justification),
        ('Timeline', draft.timeline),
        ('Team Description', draft.team_description),
        ('Institutional Support', draft.institutional_support),
        ('Broader Impacts', draft.broader_impacts),
    ]
    
    for title, content in sections:
        if content and content.strip():
            # Add section heading
            heading = document.add_heading(title, level=1)
            
            # Add content
            add_formatted_content(document, content)
            
            # Add spacing
            document.add_paragraph()


def add_formatted_content(document, content):
    """Add formatted content to the document"""
    if not content:
        return
    
    # Split content into paragraphs
    paragraphs = content.split('\n\n')
    
    for para_text in paragraphs:
        if not para_text.strip():
            continue
        
        # Check for bullet points
        if para_text.strip().startswith('*') or para_text.strip().startswith('-'):
            lines = para_text.split('\n')
            for line in lines:
                if line.strip().startswith('*') or line.strip().startswith('-'):
                    p = document.add_paragraph(style='List Bullet')
                    text = line.strip()[1:].strip()
                    p.add_run(text)
            continue
        
        # Check for numbered lists
        if re.match(r'^\d+\.', para_text.strip()):
            lines = para_text.split('\n')
            for line in lines:
                if re.match(r'^\d+\.', line.strip()):
                    p = document.add_paragraph(style='List Number')
                    text = re.sub(r'^\d+\.', '', line).strip()
                    p.add_run(text)
            continue
        
        # Regular paragraph
        p = document.add_paragraph()
        
        # Handle bold text with **
        if '**' in para_text:
            parts = para_text.split('**')
            for i, part in enumerate(parts):
                if i % 2 == 1:  # Odd parts are bold
                    run = p.add_run(part)
                    run.bold = True
                else:
                    if part:
                        p.add_run(part)
        else:
            p.add_run(para_text)