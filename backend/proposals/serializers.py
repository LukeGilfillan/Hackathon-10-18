from rest_framework import serializers
from .models import GrantDraft
from api.serializers import GrantSerializer, ProfessorSerializer


class GrantDraftSerializer(serializers.ModelSerializer):
    """Serializer for GrantDraft model"""
    
    grant = GrantSerializer(read_only=True)
    professor = ProfessorSerializer(read_only=True)
    full_content = serializers.SerializerMethodField()
    
    class Meta:
        model = GrantDraft
        fields = [
            'id', 'professor', 'grant', 'title', 'status', 'project_summary',
            'research_objectives', 'methodology', 'expected_outcomes', 'budget_justification',
            'timeline', 'team_description', 'institutional_support', 'broader_impacts',
            'ai_generated', 'generation_prompt', 'generation_model', 'generation_confidence',
            'user_notes', 'custom_sections', 'version', 'parent_draft', 'created_at',
            'updated_at', 'last_edited_by', 'full_content'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'generation_prompt', 'generation_model', 'generation_confidence']
    
    def get_full_content(self, obj):
        """Return the full content as a structured dictionary"""
        return obj.get_full_content()


class GrantDraftCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating GrantDraft instances"""
    
    professor_id = serializers.IntegerField(write_only=True)
    grant_id = serializers.IntegerField(write_only=True)
    custom_instructions = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = GrantDraft
        fields = [
            'professor_id', 'grant_id', 'title', 'custom_instructions',
            'project_summary', 'research_objectives', 'methodology', 'expected_outcomes',
            'budget_justification', 'timeline', 'team_description', 'institutional_support',
            'broader_impacts', 'user_notes', 'custom_sections'
        ]
    
    def validate_professor_id(self, value):
        """Validate that the professor exists"""
        from api.models import Professor
        try:
            Professor.objects.get(id=value, is_active=True)
        except Professor.DoesNotExist:
            raise serializers.ValidationError("Professor not found or inactive")
        return value
    
    def validate_grant_id(self, value):
        """Validate that the grant exists"""
        from api.models import Grant
        try:
            Grant.objects.get(id=value)
        except Grant.DoesNotExist:
            raise serializers.ValidationError("Grant not found")
        return value


class GrantDraftUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating GrantDraft instances"""
    
    class Meta:
        model = GrantDraft
        fields = [
            'title', 'status', 'project_summary', 'research_objectives', 'methodology',
            'expected_outcomes', 'budget_justification', 'timeline', 'team_description',
            'institutional_support', 'broader_impacts', 'user_notes', 'custom_sections',
            'last_edited_by'
        ]
    
    def update(self, instance, validated_data):
        """Update the draft and mark as user-edited"""
        validated_data['ai_generated'] = False  # Mark as user-edited
        return super().update(instance, validated_data)
