from django.db import models
from django.core.validators import MinValueValidator
import json

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
