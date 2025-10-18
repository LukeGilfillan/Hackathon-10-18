from rest_framework import serializers
from .models import Grant, ResearcherProfile, Professor, GrantRecommendation

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


class ProfessorSerializer(serializers.ModelSerializer):
    """Serializer for Professor model"""
    
    research_areas_display = serializers.CharField(source='get_research_areas_display', read_only=True)
    expertise_display = serializers.CharField(source='get_expertise_display', read_only=True)
    
    class Meta:
        model = Professor
        fields = [
            'id', 'email', 'name', 'title', 'department', 'school', 'university',
            'research_areas', 'research_areas_display', 'expertise_keywords', 'expertise_display',
            'research_interests', 'current_projects', 'education', 'publications', 'awards',
            'grants_received', 'preferred_agencies', 'preferred_funding_types',
            'preferred_award_ranges', 'preferred_duration', 'preferred_locations',
            'travel_willingness', 'collaboration_style', 'max_applications_per_year',
            'preferred_application_deadline_lead_time', 'contact_info', 'website_url',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'research_areas_display', 'expertise_display']


class GrantRecommendationSerializer(serializers.ModelSerializer):
    """Serializer for GrantRecommendation model"""
    
    grant = GrantSerializer(read_only=True)
    professor = ProfessorSerializer(read_only=True)
    
    class Meta:
        model = GrantRecommendation
        fields = [
            'id', 'professor', 'grant', 'recommendation_score', 'content_similarity_score',
            'llm_relevance_score', 'is_viewed', 'is_saved', 'is_dismissed', 'is_applied',
            'created_at', 'viewed_at', 'saved_at', 'dismissed_at', 'applied_at'
        ]
        read_only_fields = ['id', 'created_at', 'viewed_at', 'saved_at', 'dismissed_at', 'applied_at']


