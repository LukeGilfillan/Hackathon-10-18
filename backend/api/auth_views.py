"""
Simple Authentication Views for Professor System

No password required - just email-based authentication with session tokens.
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.utils import timezone
from .models import ProfessorUser, Professor
import logging
import uuid

logger = logging.getLogger(__name__)


@api_view(['POST'])
def sign_up(request):
    """Sign up a new professor user with just email"""
    try:
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response({
                'error': 'Email is required',
                'detail': 'Please provide a valid email address'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Basic email validation
        if '@' not in email or '.' not in email.split('@')[1]:
            return Response({
                'error': 'Invalid email format',
                'detail': 'Please provide a valid email address'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if ProfessorUser.objects.filter(email=email).exists():
            return Response({
                'error': 'User already exists',
                'detail': 'A user with this email already exists. Try signing in instead.'
            }, status=status.HTTP_409_CONFLICT)
        
        # Create new user
        user = ProfessorUser.objects.create(
            email=email,
            is_authenticated=True
        )
        
        # Get or create professor profile
        professor_profile = user.get_or_create_professor_profile()
        
        logger.info(f"New user signed up: {email}")
        
        return Response({
            'message': 'Sign up successful',
            'user': {
                'email': user.email,
                'session_token': str(user.session_token),
                'is_authenticated': user.is_authenticated,
                'created_at': user.created_at.isoformat(),
                'professor_profile': {
                    'id': professor_profile.id,
                    'name': professor_profile.name,
                    'email': professor_profile.email,
                    'title': professor_profile.title,
                    'department': professor_profile.department,
                    'school': professor_profile.school,
                    'university': professor_profile.university,
                    'research_areas': professor_profile.research_areas,
                    'expertise_keywords': professor_profile.expertise_keywords,
                    'research_interests': professor_profile.research_interests,
                    'current_projects': professor_profile.current_projects,
                    'preferred_agencies': professor_profile.preferred_agencies,
                    'preferred_funding_types': professor_profile.preferred_funding_types,
                    'preferred_award_ranges': professor_profile.preferred_award_ranges,
                    'travel_willingness': professor_profile.travel_willingness,
                    'collaboration_style': professor_profile.collaboration_style,
                    'max_applications_per_year': professor_profile.max_applications_per_year,
                    'website_url': professor_profile.website_url,
                    'contact_info': professor_profile.contact_info
                }
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error in sign up: {str(e)}", exc_info=True)
        return Response({
            'error': 'Sign up failed',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def sign_in(request):
    """Sign in an existing professor user with just email"""
    try:
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response({
                'error': 'Email is required',
                'detail': 'Please provide a valid email address'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user exists
        try:
            user = ProfessorUser.objects.get(email=email)
        except ProfessorUser.DoesNotExist:
            return Response({
                'error': 'User not found',
                'detail': 'No user found with this email. Please sign up first.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update authentication status and last login
        user.is_authenticated = True
        user.last_login = timezone.now()
        user.save()
        
        # Get or create professor profile
        professor_profile = user.get_or_create_professor_profile()
        
        logger.info(f"User signed in: {email}")
        
        return Response({
            'message': 'Sign in successful',
            'user': {
                'email': user.email,
                'session_token': str(user.session_token),
                'is_authenticated': user.is_authenticated,
                'last_login': user.last_login.isoformat(),
                'professor_profile': {
                    'id': professor_profile.id,
                    'name': professor_profile.name,
                    'email': professor_profile.email,
                    'title': professor_profile.title,
                    'department': professor_profile.department,
                    'school': professor_profile.school,
                    'university': professor_profile.university,
                    'research_areas': professor_profile.research_areas,
                    'expertise_keywords': professor_profile.expertise_keywords,
                    'research_interests': professor_profile.research_interests,
                    'current_projects': professor_profile.current_projects,
                    'preferred_agencies': professor_profile.preferred_agencies,
                    'preferred_funding_types': professor_profile.preferred_funding_types,
                    'preferred_award_ranges': professor_profile.preferred_award_ranges,
                    'travel_willingness': professor_profile.travel_willingness,
                    'collaboration_style': professor_profile.collaboration_style,
                    'max_applications_per_year': professor_profile.max_applications_per_year,
                    'website_url': professor_profile.website_url,
                    'contact_info': professor_profile.contact_info
                }
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in sign in: {str(e)}", exc_info=True)
        return Response({
            'error': 'Sign in failed',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def sign_out(request):
    """Sign out a professor user"""
    try:
        session_token = request.data.get('session_token')
        
        if not session_token:
            return Response({
                'error': 'Session token required',
                'detail': 'Please provide a valid session token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = ProfessorUser.objects.get(session_token=session_token)
        except ProfessorUser.DoesNotExist:
            return Response({
                'error': 'Invalid session',
                'detail': 'Session token not found or expired'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update authentication status
        user.is_authenticated = False
        user.save()
        
        logger.info(f"User signed out: {user.email}")
        
        return Response({
            'message': 'Sign out successful'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in sign out: {str(e)}", exc_info=True)
        return Response({
            'error': 'Sign out failed',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_current_user(request):
    """Get current user information based on session token"""
    try:
        session_token = request.GET.get('session_token')
        
        if not session_token:
            return Response({
                'error': 'Session token required',
                'detail': 'Please provide a valid session token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
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
        
        # Get professor profile
        professor_profile = user.get_or_create_professor_profile()
        
        return Response({
            'user': {
                'email': user.email,
                'session_token': str(user.session_token),
                'is_authenticated': user.is_authenticated,
                'last_login': user.last_login.isoformat(),
                'professor_profile': {
                    'id': professor_profile.id,
                    'name': professor_profile.name,
                    'email': professor_profile.email,
                    'title': professor_profile.title,
                    'department': professor_profile.department,
                    'school': professor_profile.school,
                    'university': professor_profile.university,
                    'research_areas': professor_profile.research_areas,
                    'expertise_keywords': professor_profile.expertise_keywords,
                    'research_interests': professor_profile.research_interests,
                    'current_projects': professor_profile.current_projects,
                    'preferred_agencies': professor_profile.preferred_agencies,
                    'preferred_funding_types': professor_profile.preferred_funding_types,
                    'preferred_award_ranges': professor_profile.preferred_award_ranges,
                    'travel_willingness': professor_profile.travel_willingness,
                    'collaboration_style': professor_profile.collaboration_style,
                    'max_applications_per_year': professor_profile.max_applications_per_year,
                    'website_url': professor_profile.website_url,
                    'contact_info': professor_profile.contact_info
                }
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting current user: {str(e)}", exc_info=True)
        return Response({
            'error': 'Failed to get user information',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def check_email_exists(request):
    """Check if an email already exists in the system"""
    try:
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response({
                'error': 'Email is required',
                'detail': 'Please provide a valid email address'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user_exists = ProfessorUser.objects.filter(email=email).exists()
        professor_exists = Professor.objects.filter(email=email).exists()
        
        return Response({
            'email': email,
            'user_exists': user_exists,
            'professor_exists': professor_exists,
            'exists': user_exists or professor_exists
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error checking email: {str(e)}", exc_info=True)
        return Response({
            'error': 'Failed to check email',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


