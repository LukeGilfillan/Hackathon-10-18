"""
Custom authentication backend for session token authentication
"""
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import AnonymousUser
from .models import ProfessorUser


class SessionTokenAuthentication(BaseAuthentication):
    """
    Custom authentication class that uses session tokens from ProfessorUser model
    """
    
    def authenticate(self, request):
        """
        Authenticate the request using session token from Authorization header or query parameter
        """
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
            return (user, None)  # Return (user, auth) tuple
        except ProfessorUser.DoesNotExist:
            raise AuthenticationFailed('Invalid or expired session token')
    
    def authenticate_header(self, request):
        """
        Return a string to be used as the value of the `WWW-Authenticate`
        header in a `401 Unauthenticated` response.
        """
        return 'Token'
