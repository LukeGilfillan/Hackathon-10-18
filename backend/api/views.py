from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.db.models import Q
from django.utils.dateparse import parse_date
from .services import IgniteHubService
from .models import Grant, ResearcherProfile
from .serializers import GrantSerializer, ResearcherProfileSerializer
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