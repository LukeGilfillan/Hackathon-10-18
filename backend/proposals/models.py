from django.db import models
from django.core.validators import MinValueValidator
import uuid


class GrantDraft(models.Model):
    """Model for storing grant application drafts generated for professors"""
    
    # Core relationships
    professor = models.ForeignKey('api.Professor', on_delete=models.CASCADE, related_name='grant_drafts')
    grant = models.ForeignKey('api.Grant', on_delete=models.CASCADE, related_name='drafts')
    
    # Draft metadata
    title = models.CharField(max_length=500, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('in_progress', 'In Progress'),
            ('review', 'Under Review'),
            ('submitted', 'Submitted'),
            ('rejected', 'Rejected'),
            ('awarded', 'Awarded')
        ],
        default='draft'
    )
    
    # Draft content sections
    project_summary = models.TextField(blank=True, null=True)
    research_objectives = models.TextField(blank=True, null=True)
    methodology = models.TextField(blank=True, null=True)
    expected_outcomes = models.TextField(blank=True, null=True)
    budget_justification = models.TextField(blank=True, null=True)
    timeline = models.TextField(blank=True, null=True)
    team_description = models.TextField(blank=True, null=True)
    institutional_support = models.TextField(blank=True, null=True)
    broader_impacts = models.TextField(blank=True, null=True)
    
    # AI generation metadata
    ai_generated = models.BooleanField(default=True)
    generation_prompt = models.TextField(blank=True, null=True)
    generation_model = models.CharField(max_length=100, blank=True, null=True)
    generation_confidence = models.FloatField(default=0.0)
    
    # User customization
    user_notes = models.TextField(blank=True, null=True)
    custom_sections = models.JSONField(default=dict, blank=True)  # For additional sections
    
    # Version control
    version = models.IntegerField(default=1)
    parent_draft = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='child_drafts')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_edited_by = models.CharField(max_length=200, blank=True, null=True)  # Track who made last edit
    
    class Meta:
        ordering = ['-updated_at', '-created_at']
        indexes = [
            models.Index(fields=['professor', 'status']),
            models.Index(fields=['professor', 'grant']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.professor.name} - {self.grant.title} (v{self.version})"
    
    def get_full_content(self):
        """Return all draft content as a structured dictionary"""
        return {
            'title': self.title,
            'project_summary': self.project_summary,
            'research_objectives': self.research_objectives,
            'methodology': self.methodology,
            'expected_outcomes': self.expected_outcomes,
            'budget_justification': self.budget_justification,
            'timeline': self.timeline,
            'team_description': self.team_description,
            'institutional_support': self.institutional_support,
            'broader_impacts': self.broader_impacts,
            'user_notes': self.user_notes,
            'custom_sections': self.custom_sections
        }
    
    def create_new_version(self):
        """Create a new version of this draft"""
        new_draft = GrantDraft.objects.create(
            professor=self.professor,
            grant=self.grant,
            title=self.title,
            status='draft',
            project_summary=self.project_summary,
            research_objectives=self.research_objectives,
            methodology=self.methodology,
            expected_outcomes=self.expected_outcomes,
            budget_justification=self.budget_justification,
            timeline=self.timeline,
            team_description=self.team_description,
            institutional_support=self.institutional_support,
            broader_impacts=self.broader_impacts,
            user_notes=self.user_notes,
            custom_sections=self.custom_sections,
            ai_generated=False,  # New version is user-edited
            parent_draft=self,
            version=self.version + 1
        )
        return new_draft