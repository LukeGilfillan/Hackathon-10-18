import requests
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class IgniteHubService:
    """Service class for interacting with IgniteHub API"""
    
    BASE_URL = "https://api-ignitehub.catholic-u.ai"
    
    @classmethod
    def _make_request(cls, endpoint: str, params: Optional[Dict] = None) -> Dict:
        """Make a request to the IgniteHub API"""
        try:
            url = f"{cls.BASE_URL}{endpoint}"
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error making request to {url}: {str(e)}")
            raise Exception(f"Failed to fetch data from IgniteHub API: {str(e)}")
    
    @classmethod
    def get_health(cls) -> Dict:
        """Get service health and dataset counts"""
        return cls._make_request("/health")
    
    @classmethod
    def search_grants(
        cls, 
        query: Optional[str] = None,
        agency_code: Optional[str] = None,
        close_before: Optional[str] = None,
        close_after: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[Dict]:
        """Search for grants with optional filters"""
        params = {}
        if query:
            params['q'] = query
        if agency_code:
            params['agency_code'] = agency_code
        if close_before:
            params['close_before'] = close_before
        if close_after:
            params['close_after'] = close_after
        if limit:
            params['limit'] = limit
        if offset:
            params['offset'] = offset
            
        return cls._make_request("/grants", params)
    
    @classmethod
    def get_grant(cls, grant_id: int) -> Dict:
        """Get a specific grant by ID"""
        return cls._make_request(f"/grants/{grant_id}")
    
    @classmethod
    def search_profiles(
        cls,
        query: Optional[str] = None,
        department: Optional[str] = None,
        school: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[Dict]:
        """Search for researcher profiles with optional filters"""
        params = {}
        if query:
            params['q'] = query
        if department:
            params['department'] = department
        if school:
            params['school'] = school
        if limit:
            params['limit'] = limit
        if offset:
            params['offset'] = offset
            
        return cls._make_request("/profiles", params)
    
    @classmethod
    def get_profile(cls, email: str) -> Dict:
        """Get a specific researcher profile by email"""
        return cls._make_request(f"/profiles/{email}")
