from django.contrib import admin
from .models import GrantDraft


@admin.register(GrantDraft)
class GrantDraftAdmin(admin.ModelAdmin):
    """Admin interface for GrantDraft model"""
    
    list_display = [
        'id', 'title', 'professor', 'grant', 'status', 'version', 
        'ai_generated', 'generation_confidence', 'created_at', 'updated_at'
    ]
    list_filter = [
        'status', 'ai_generated', 'created_at', 'updated_at', 
        'professor__department', 'grant__agency_name'
    ]
    search_fields = [
        'title', 'professor__name', 'professor__email', 
        'grant__title', 'project_summary'
    ]
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'generation_prompt', 
        'generation_model', 'generation_confidence'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'professor', 'grant', 'title', 'status', 'version')
        }),
        ('Content Sections', {
            'fields': (
                'project_summary', 'research_objectives', 'methodology', 
                'expected_outcomes', 'budget_justification', 'timeline',
                'team_description', 'institutional_support', 'broader_impacts'
            ),
            'classes': ('collapse',)
        }),
        ('AI Generation', {
            'fields': (
                'ai_generated', 'generation_prompt', 'generation_model', 
                'generation_confidence'
            ),
            'classes': ('collapse',)
        }),
        ('User Customization', {
            'fields': ('user_notes', 'custom_sections', 'last_edited_by'),
            'classes': ('collapse',)
        }),
        ('Version Control', {
            'fields': ('parent_draft',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('professor', 'grant', 'parent_draft')
