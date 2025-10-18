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
    
    # Catholic Social Teaching Compliance
    catholic_social_teaching_compliance = models.CharField(
        max_length=20,
        choices=[
            ('compliant', 'Compliant'),
            ('flagged', 'Flagged for Review'),
            ('non_compliant', 'Non-Compliant'),
            ('not_reviewed', 'Not Reviewed'),
        ],
        default='not_reviewed',
        help_text='Flag indicating alignment with Catholic social teaching principles'
    )
    catholic_social_teaching_notes = models.TextField(
        blank=True, 
        null=True,
        help_text='Notes about Catholic social teaching compliance review'
    )
    catholic_social_teaching_reviewed_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text='When this grant was last reviewed for Catholic social teaching compliance'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-close_date', 'title']
        indexes = [
            models.Index(fields=['agency_code']),
            models.Index(fields=['close_date']),
            models.Index(fields=['title']),
            models.Index(fields=['catholic_social_teaching_compliance']),
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
    
    # Research strategy and capabilities
    capability_and_strategy = models.TextField(
        blank=True, 
        null=True,
        help_text='Description of research capabilities, expertise, and strategy for using the grant matching platform'
    )
    
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
                # Try to find matching ResearcherProfile for autofill
                researcher_profile = None
                try:
                    researcher_profile = ResearcherProfile.objects.get(email=self.email)
                except ResearcherProfile.DoesNotExist:
                    pass
                
                # Create professor profile with autofilled data if available
                professor_data = {
                    'email': self.email,
                    'name': f"Professor {self.email.split('@')[0]}",  # Basic name from email
                    'is_active': True
                }
                
                # Autofill from ResearcherProfile if found
                if researcher_profile:
                    professor_data.update({
                        'name': researcher_profile.name,
                        'title': researcher_profile.position,
                        'department': researcher_profile.department,
                        'school': researcher_profile.school,
                        'university': 'The Catholic University of America',  # Default for CUA profiles
                        'research_areas': researcher_profile.expertise or [],
                        'expertise_keywords': researcher_profile.expertise or [],
                        'research_interests': researcher_profile.bio or '',
                        'education': researcher_profile.education or [],
                        'publications': researcher_profile.publications or [],
                        'contact_info': researcher_profile.contact or {}
                    })
                
                professor = Professor.objects.create(**professor_data)
                self.professor_profile = professor
                self.save()
        else:
            # If profile exists but is incomplete, try to autofill missing data
            professor = self.professor_profile
            try:
                researcher_profile = ResearcherProfile.objects.get(email=self.email)
                
                # Only update fields that are empty or have default values
                updates = {}
                if not professor.name or professor.name.startswith("Professor "):
                    updates['name'] = researcher_profile.name
                if not professor.title:
                    updates['title'] = researcher_profile.position
                if not professor.department:
                    updates['department'] = researcher_profile.department
                if not professor.school:
                    updates['school'] = researcher_profile.school
                if not professor.university:
                    updates['university'] = 'The Catholic University of America'
                if not professor.research_areas:
                    updates['research_areas'] = researcher_profile.expertise or []
                if not professor.expertise_keywords:
                    updates['expertise_keywords'] = researcher_profile.expertise or []
                if not professor.research_interests:
                    updates['research_interests'] = researcher_profile.bio or ''
                if not professor.education:
                    updates['education'] = researcher_profile.education or []
                if not professor.publications:
                    updates['publications'] = researcher_profile.publications or []
                if not professor.contact_info:
                    updates['contact_info'] = researcher_profile.contact or {}
                
                # Update the professor profile if there are updates
                if updates:
                    for field, value in updates.items():
                        setattr(professor, field, value)
                    professor.save()
                    
            except ResearcherProfile.DoesNotExist:
                pass  # No researcher profile found, keep existing data
                
        return self.professor_profile


class SavedGrant(models.Model):
    """Model for tracking grants saved by users"""
    
    user = models.ForeignKey(ProfessorUser, on_delete=models.CASCADE, related_name='saved_grants')
    grant = models.ForeignKey(Grant, on_delete=models.CASCADE, related_name='saved_by_users')
    
    # User notes and status
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('saved', 'Saved'),
            ('applying', 'Applying'),
            ('submitted', 'Submitted'),
            ('awarded', 'Awarded'),
            ('rejected', 'Rejected'),
        ],
        default='saved'
    )
    
    # Collaboration settings
    is_public = models.BooleanField(default=False)
    allow_collaboration = models.BooleanField(default=True)
    
    # Timestamps
    saved_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'grant']
        ordering = ['-saved_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'saved_at']),
            models.Index(fields=['is_public']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.grant.title} ({self.status})"


class CollaborationInvite(models.Model):
    """Model for collaboration invitations on grants"""
    
    grant = models.ForeignKey(SavedGrant, on_delete=models.CASCADE, related_name='collaboration_invites')
    inviter = models.ForeignKey(ProfessorUser, on_delete=models.CASCADE, related_name='sent_invites')
    invitee_email = models.EmailField()
    invitee_name = models.CharField(max_length=200, blank=True, null=True)
    
    # Invitation details
    message = models.TextField(blank=True, null=True)
    role = models.CharField(
        max_length=20,
        choices=[
            ('collaborator', 'Collaborator'),
            ('co_pi', 'Co-Principal Investigator'),
            ('advisor', 'Advisor'),
            ('consultant', 'Consultant'),
        ],
        default='collaborator'
    )
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('accepted', 'Accepted'),
            ('declined', 'Declined'),
            ('expired', 'Expired'),
        ],
        default='pending'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['invitee_email', 'status']),
            models.Index(fields=['inviter', 'status']),
            models.Index(fields=['grant', 'status']),
        ]
    
    def __str__(self):
        return f"Invite: {self.inviter.email} -> {self.invitee_email} for {self.grant.grant.title}"


class Collaboration(models.Model):
    """Model for active collaborations on grants"""
    
    grant = models.ForeignKey(SavedGrant, on_delete=models.CASCADE, related_name='collaborations')
    collaborator = models.ForeignKey(ProfessorUser, on_delete=models.CASCADE, related_name='collaborations')
    invite = models.OneToOneField(CollaborationInvite, on_delete=models.CASCADE, related_name='collaboration')
    
    # Collaboration details
    role = models.CharField(
        max_length=20,
        choices=[
            ('collaborator', 'Collaborator'),
            ('co_pi', 'Co-Principal Investigator'),
            ('advisor', 'Advisor'),
            ('consultant', 'Consultant'),
        ]
    )
    contribution_notes = models.TextField(blank=True, null=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['grant', 'collaborator']
        ordering = ['-joined_at']
        indexes = [
            models.Index(fields=['grant', 'is_active']),
            models.Index(fields=['collaborator', 'is_active']),
        ]
    
    def __str__(self):
        return f"Collaboration: {self.collaborator.email} on {self.grant.grant.title}"


# Forum Models

class Forum(models.Model):
    """Model for forum categories/sections"""
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    slug = models.SlugField(unique=True, max_length=100)
    
    # Forum settings
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True)
    allow_anonymous = models.BooleanField(default=False)
    
    # Ordering
    order = models.IntegerField(default=0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'name']
        indexes = [
            models.Index(fields=['is_active', 'order']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return self.name


class Topic(models.Model):
    """Model for forum topics/threads"""
    
    forum = models.ForeignKey(Forum, on_delete=models.CASCADE, related_name='topics')
    author = models.ForeignKey(ProfessorUser, on_delete=models.CASCADE, related_name='authored_topics')
    
    # Topic content
    title = models.CharField(max_length=300)
    content = models.TextField()
    
    # Topic settings
    is_pinned = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    is_anonymous = models.BooleanField(default=False)
    
    # Statistics
    view_count = models.PositiveIntegerField(default=0)
    reply_count = models.PositiveIntegerField(default=0)
    
    # Last activity tracking
    last_post = models.ForeignKey('Post', on_delete=models.SET_NULL, null=True, blank=True, related_name='last_post_in_topic')
    last_activity = models.DateTimeField(auto_now=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_pinned', '-last_activity', '-created_at']
        indexes = [
            models.Index(fields=['forum', '-last_activity']),
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.forum.name}"
    
    def get_author_display_name(self):
        """Get display name for the author"""
        if self.is_anonymous:
            return "Anonymous"
        if self.author.professor_profile:
            return self.author.professor_profile.name
        return self.author.email.split('@')[0]


class Post(models.Model):
    """Model for forum posts/replies"""
    
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(ProfessorUser, on_delete=models.CASCADE, related_name='authored_posts')
    parent_post = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    
    # Post content
    content = models.TextField()
    
    # Post settings
    is_anonymous = models.BooleanField(default=False)
    is_edited = models.BooleanField(default=False)
    
    # Edit tracking
    edited_at = models.DateTimeField(null=True, blank=True)
    edit_reason = models.CharField(max_length=200, blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['topic', 'created_at']),
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['parent_post']),
        ]
    
    def __str__(self):
        return f"Post by {self.get_author_display_name()} in {self.topic.title}"
    
    def get_author_display_name(self):
        """Get display name for the author"""
        if self.is_anonymous:
            return "Anonymous"
        if self.author.professor_profile:
            return self.author.professor_profile.name
        return self.author.email.split('@')[0]
    
    def save(self, *args, **kwargs):
        # Update topic's last_post and last_activity when creating a new post
        if not self.pk:  # New post
            self.topic.last_post = self
            self.topic.reply_count += 1
            self.topic.save(update_fields=['last_post', 'reply_count', 'last_activity'])
        super().save(*args, **kwargs)


class PostLike(models.Model):
    """Model for post likes/reactions"""
    
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(ProfessorUser, on_delete=models.CASCADE, related_name='post_likes')
    
    # Like type (for future expansion to different reaction types)
    like_type = models.CharField(
        max_length=20,
        choices=[
            ('like', 'Like'),
            ('dislike', 'Dislike'),
            ('helpful', 'Helpful'),
            ('insightful', 'Insightful'),
        ],
        default='like'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['post', 'user']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['post', 'like_type']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} {self.like_type}s post {self.post.id}"


class TopicSubscription(models.Model):
    """Model for topic subscriptions/notifications"""
    
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='subscriptions')
    user = models.ForeignKey(ProfessorUser, on_delete=models.CASCADE, related_name='topic_subscriptions')
    
    # Subscription settings
    notify_on_reply = models.BooleanField(default=True)
    notify_on_like = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['topic', 'user']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['topic']),
        ]
    
    def __str__(self):
        return f"{self.user.email} subscribed to {self.topic.title}"
