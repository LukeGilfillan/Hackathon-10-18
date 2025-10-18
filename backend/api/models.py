from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import AbstractUser
import json
import uuid

class Grant(models.Model):
    """Model for storing grant opportunities from IgniteHub"""
    
    # Basic information
    title = models.CharField(max_length=500)
    opportunity_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    opportunity_number = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    # Agency information
    agency_code = models.CharField(max_length=20, blank=True, null=True)
    agency_name = models.CharField(max_length=200, blank=True, null=True)
    
    # Financial information
    award_floor = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)]
    )
    award_ceiling = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)]
    )
    estimated_total_program_funding = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)]
    )
    expected_number_of_awards = models.CharField(max_length=50, blank=True, null=True)
    
    # Dates and deadlines
    post_date = models.DateField(null=True, blank=True)
    close_date = models.DateField(null=True, blank=True)
    close_date_explanation = models.TextField(blank=True, null=True)
    last_updated_date = models.DateField(null=True, blank=True)
    archive_date = models.DateField(null=True, blank=True)
    
    # Categorization
    opportunity_category = models.CharField(max_length=10, blank=True, null=True)
    opportunity_category_explanation = models.TextField(blank=True, null=True)
    funding_instrument_type = models.CharField(max_length=10, blank=True, null=True)
    category_of_funding_activity = models.CharField(max_length=200, blank=True, null=True)
    category_explanation = models.TextField(blank=True, null=True)
    cfda_numbers = models.CharField(max_length=50, blank=True, null=True)
    
    # Eligibility and requirements
    eligible_applicants = models.TextField(blank=True, null=True)
    additional_information_on_eligibility = models.TextField(blank=True, null=True)
    cost_sharing_or_matching_requirement = models.TextField(blank=True, null=True)
    
    # Additional information
    additional_information_text = models.TextField(blank=True, null=True)
    additional_information_url = models.URLField(blank=True, null=True)
    grantor_contact_text = models.TextField(blank=True, null=True)
    grantor_contact_email = models.EmailField(blank=True, null=True)
    grantor_contact_email_description = models.TextField(blank=True, null=True)
    grantor_contact_name = models.CharField(max_length=200, blank=True, null=True)
    grantor_contact_phone_number = models.CharField(max_length=50, blank=True, null=True)
    version = models.CharField(max_length=50, blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-close_date', 'title']
        indexes = [
            models.Index(fields=['agency_code']),
            models.Index(fields=['close_date']),
            models.Index(fields=['title']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.agency_name}"
    
    @property
    def is_closed(self):
        """Check if the grant application deadline has passed"""
        if not self.close_date:
            return False
        from django.utils import timezone
        return self.close_date < timezone.now().date()
    
    @property
    def days_until_close(self):
        """Calculate days until application deadline"""
        if not self.close_date:
            return None
        from django.utils import timezone
        delta = self.close_date - timezone.now().date()
        return delta.days

class ResearcherProfile(models.Model):
    """Model for storing researcher profiles from IgniteHub"""
    
    # Basic information
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=200)
    position = models.CharField(max_length=200, blank=True, null=True)
    
    # Institutional information
    department = models.CharField(max_length=200, blank=True, null=True)
    school = models.CharField(max_length=200, blank=True, null=True)
    
    # Professional information
    expertise = models.JSONField(default=list, blank=True)  # List of expertise areas
    education = models.JSONField(default=list, blank=True)  # List of education entries
    bio = models.TextField(blank=True, null=True)
    publications = models.JSONField(default=list, blank=True)  # List of publications
    
    # Contact information
    contact = models.JSONField(default=dict, blank=True)  # Additional contact info
    
    # Source information
    source_url = models.URLField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['department']),
            models.Index(fields=['school']),
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.email})"
    
    def get_expertise_display(self):
        """Return expertise as a comma-separated string"""
        if isinstance(self.expertise, list):
            return ', '.join(self.expertise)
        return str(self.expertise) if self.expertise else ''
    
    def has_expertise(self, keyword):
        """Check if researcher has specific expertise"""
        if not self.expertise:
            return False
        if isinstance(self.expertise, list):
            return any(keyword.lower() in exp.lower() for exp in self.expertise)
        return keyword.lower() in str(self.expertise).lower()


class Professor(models.Model):
    """Model for storing professor profiles and preferences"""
    
    # Basic information
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=200)
    title = models.CharField(max_length=200, blank=True, null=True)  # e.g., "Professor", "Associate Professor"
    
    # Institutional information
    department = models.CharField(max_length=200, blank=True, null=True)
    school = models.CharField(max_length=200, blank=True, null=True)
    university = models.CharField(max_length=200, blank=True, null=True)
    
    # Research and expertise
    research_areas = models.JSONField(default=list, blank=True)  # List of research areas
    expertise_keywords = models.JSONField(default=list, blank=True)  # List of expertise keywords
    research_interests = models.TextField(blank=True, null=True)
    current_projects = models.TextField(blank=True, null=True)
    
    # Professional information
    education = models.JSONField(default=list, blank=True)  # List of education entries
    publications = models.JSONField(default=list, blank=True)  # List of publications
    awards = models.JSONField(default=list, blank=True)  # List of awards/honors
    grants_received = models.JSONField(default=list, blank=True)  # List of grants received
    
    # Grant preferences
    preferred_agencies = models.JSONField(default=list, blank=True)  # e.g., ["NSF", "NIH", "DOE"]
    preferred_funding_types = models.JSONField(default=list, blank=True)  # e.g., ["Research", "Equipment"]
    preferred_award_ranges = models.JSONField(default=dict, blank=True)  # {"min": 50000, "max": 500000}
    preferred_duration = models.JSONField(default=dict, blank=True)  # {"min": 12, "max": 36} months
    
    # Geographic preferences
    preferred_locations = models.JSONField(default=list, blank=True)  # List of preferred locations
    travel_willingness = models.CharField(
        max_length=20, 
        choices=[
            ('none', 'No travel required'),
            ('minimal', 'Minimal travel'),
            ('moderate', 'Moderate travel'),
            ('extensive', 'Extensive travel')
        ],
        default='moderate'
    )
    
    # Collaboration preferences
    collaboration_style = models.CharField(
        max_length=20,
        choices=[
            ('solo', 'Solo research'),
            ('small_team', 'Small team (2-5 people)'),
            ('large_team', 'Large team (5+ people)'),
            ('any', 'Any team size')
        ],
        default='any'
    )
    
    # Application preferences
    max_applications_per_year = models.IntegerField(default=10)
    preferred_application_deadline_lead_time = models.IntegerField(default=30)  # days
    
    # Contact information
    contact_info = models.JSONField(default=dict, blank=True)  # Additional contact info
    website_url = models.URLField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['department']),
            models.Index(fields=['school']),
            models.Index(fields=['university']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.email})"
    
    def get_research_areas_display(self):
        """Return research areas as a comma-separated string"""
        if isinstance(self.research_areas, list):
            return ', '.join(self.research_areas)
        return str(self.research_areas) if self.research_areas else ''
    
    def get_expertise_display(self):
        """Return expertise keywords as a comma-separated string"""
        if isinstance(self.expertise_keywords, list):
            return ', '.join(self.expertise_keywords)
        return str(self.expertise_keywords) if self.expertise_keywords else ''
    
    def has_research_area(self, keyword):
        """Check if professor has specific research area"""
        if not self.research_areas:
            return False
        if isinstance(self.research_areas, list):
            return any(keyword.lower() in area.lower() for area in self.research_areas)
        return keyword.lower() in str(self.research_areas).lower()
    
    def has_expertise(self, keyword):
        """Check if professor has specific expertise"""
        if not self.expertise_keywords:
            return False
        if isinstance(self.expertise_keywords, list):
            return any(keyword.lower() in exp.lower() for exp in self.expertise_keywords)
        return keyword.lower() in str(self.expertise_keywords).lower()


class GrantRecommendation(models.Model):
    """Model for tracking grant recommendations for professors"""
    
    professor = models.ForeignKey(Professor, on_delete=models.CASCADE, related_name='grant_recommendations')
    grant = models.ForeignKey(Grant, on_delete=models.CASCADE, related_name='professor_recommendations')
    
    # Recommendation metadata
    recommendation_score = models.FloatField(default=0.0)
    content_similarity_score = models.FloatField(default=0.0)
    llm_relevance_score = models.FloatField(default=1.0)
    
    # User interaction tracking
    is_viewed = models.BooleanField(default=False)
    is_saved = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    is_applied = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    viewed_at = models.DateTimeField(null=True, blank=True)
    saved_at = models.DateTimeField(null=True, blank=True)
    dismissed_at = models.DateTimeField(null=True, blank=True)
    applied_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['professor', 'grant']
        ordering = ['-recommendation_score', '-created_at']
        indexes = [
            models.Index(fields=['professor', 'recommendation_score']),
            models.Index(fields=['professor', 'is_dismissed']),
            models.Index(fields=['professor', 'is_saved']),
        ]
    
    def __str__(self):
        return f"{self.professor.name} - {self.grant.title} (Score: {self.recommendation_score:.2f})"


class ProfessorUser(models.Model):
    """Simple authentication model for professors - no password required"""
    
    email = models.EmailField(unique=True)
    is_authenticated = models.BooleanField(default=False)
    session_token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)
    
    # Link to Professor profile
    professor_profile = models.OneToOneField(
        Professor, 
        on_delete=models.CASCADE, 
        related_name='user_account',
        null=True, 
        blank=True
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['session_token']),
        ]
    
    def __str__(self):
        return f"ProfessorUser: {self.email}"
    
    def get_or_create_professor_profile(self):
        """Get or create a Professor profile for this user"""
        if not self.professor_profile:
            # Try to find existing professor by email
            try:
                professor = Professor.objects.get(email=self.email)
                self.professor_profile = professor
                self.save()
            except Professor.DoesNotExist:
                # Create a basic professor profile
                professor = Professor.objects.create(
                    email=self.email,
                    name=f"Professor {self.email.split('@')[0]}",  # Basic name from email
                    is_active=True
                )
                self.professor_profile = professor
                self.save()
        return self.professor_profile
