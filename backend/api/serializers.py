from rest_framework import serializers
from .models import Grant, ResearcherProfile

class GrantSerializer(serializers.ModelSerializer):
    """Serializer for Grant model"""
    
    class Meta:
        model = Grant
        fields = [
            'id', 'title', 'opportunity_id', 'description',
            'agency_code', 'agency_name', 'award_floor', 'award_ceiling',
            'close_date', 'category_of_funding_activity',
            'eligible_applicants', 'cost_sharing_or_matching_requirement',
            'created_at', 'updated_at', 'is_closed', 'days_until_close'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_closed', 'days_until_close']

class ResearcherProfileSerializer(serializers.ModelSerializer):
    """Serializer for ResearcherProfile model"""
    
    expertise_display = serializers.CharField(source='get_expertise_display', read_only=True)
    
    class Meta:
        model = ResearcherProfile
        fields = [
            'id', 'email', 'name', 'position', 'department', 'school',
            'expertise', 'expertise_display', 'education', 'bio',
            'contact', 'source_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'expertise_display']
