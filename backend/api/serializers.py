from rest_framework import serializers
from .models import Grant, ResearcherProfile, Professor, GrantRecommendation, SavedGrant, CollaborationInvite, Collaboration, ProfessorUser, Forum, Topic, Post, PostLike, TopicSubscription, GrantPipelineStage, GrantPipelineEntry

class GrantSerializer(serializers.ModelSerializer):
    """Serializer for Grant model"""
    
    class Meta:
        model = Grant
        fields = [
            'id', 'title', 'opportunity_id', 'opportunity_number', 'description',
            'agency_code', 'agency_name', 'award_floor', 'award_ceiling', 'estimated_total_program_funding',
            'expected_number_of_awards', 'post_date', 'close_date', 'close_date_explanation',
            'last_updated_date', 'archive_date', 'opportunity_category', 'opportunity_category_explanation',
            'funding_instrument_type', 'category_of_funding_activity', 'category_explanation',
            'cfda_numbers', 'eligible_applicants', 'additional_information_on_eligibility',
            'cost_sharing_or_matching_requirement', 'additional_information_text',
            'additional_information_url', 'grantor_contact_text', 'grantor_contact_email',
            'grantor_contact_email_description', 'grantor_contact_name', 'grantor_contact_phone_number',
            'version', 'catholic_social_teaching_compliance', 'catholic_social_teaching_notes',
            'catholic_social_teaching_reviewed_at', 'created_at', 'updated_at', 'is_closed', 'days_until_close'
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
            'capability_and_strategy', 'is_active', 'created_at', 'updated_at'
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


class SavedGrantSerializer(serializers.ModelSerializer):
    """Serializer for SavedGrant model"""
    
    grant = GrantSerializer(read_only=True)
    grant_id = serializers.IntegerField(write_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = SavedGrant
        fields = [
            'id', 'user_email', 'grant', 'grant_id', 'notes', 'status', 'status_display',
            'is_public', 'allow_collaboration', 'saved_at', 'updated_at'
        ]
        read_only_fields = ['id', 'saved_at', 'updated_at', 'user_email', 'status_display']


class CollaborationInviteSerializer(serializers.ModelSerializer):
    """Serializer for CollaborationInvite model"""
    
    grant_title = serializers.CharField(source='grant.grant.title', read_only=True)
    inviter_email = serializers.CharField(source='inviter.email', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = CollaborationInvite
        fields = [
            'id', 'grant_title', 'inviter_email', 'invitee_email', 'invitee_name',
            'message', 'role', 'role_display', 'status', 'status_display',
            'created_at', 'responded_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_at', 'responded_at', 'grant_title', 'inviter_email', 'role_display', 'status_display']


class CollaborationSerializer(serializers.ModelSerializer):
    """Serializer for Collaboration model"""
    
    grant_title = serializers.CharField(source='grant.grant.title', read_only=True)
    collaborator_email = serializers.CharField(source='collaborator.email', read_only=True)
    collaborator_name = serializers.CharField(source='collaborator.professor_profile.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = Collaboration
        fields = [
            'id', 'grant_title', 'collaborator_email', 'collaborator_name',
            'role', 'role_display', 'contribution_notes', 'is_active',
            'joined_at', 'updated_at'
        ]
        read_only_fields = ['id', 'joined_at', 'updated_at', 'grant_title', 'collaborator_email', 'collaborator_name', 'role_display']


class ProfessorUserSerializer(serializers.ModelSerializer):
    """Serializer for ProfessorUser model"""
    
    professor_profile = ProfessorSerializer(read_only=True)
    
    class Meta:
        model = ProfessorUser
        fields = [
            'id', 'email', 'is_authenticated', 'created_at', 'last_login', 'professor_profile'
        ]
        read_only_fields = ['id', 'created_at', 'last_login']


# Forum Serializers

class ForumSerializer(serializers.ModelSerializer):
    """Serializer for Forum model"""
    
    topic_count = serializers.SerializerMethodField()
    latest_topic = serializers.SerializerMethodField()
    
    class Meta:
        model = Forum
        fields = [
            'id', 'name', 'description', 'slug', 'is_active', 'is_public',
            'allow_anonymous', 'order', 'topic_count', 'latest_topic',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'topic_count', 'latest_topic']
    
    def get_topic_count(self, obj):
        return obj.topics.count()
    
    def get_latest_topic(self, obj):
        latest_topic = obj.topics.first()
        if latest_topic:
            return {
                'id': latest_topic.id,
                'title': latest_topic.title,
                'author': latest_topic.get_author_display_name(),
                'last_activity': latest_topic.last_activity
            }
        return None


class PostLikeSerializer(serializers.ModelSerializer):
    """Serializer for PostLike model"""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PostLike
        fields = [
            'id', 'user_email', 'user_name', 'like_type', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'user_email', 'user_name']
    
    def get_user_name(self, obj):
        if obj.user.professor_profile:
            return obj.user.professor_profile.name
        return obj.user.email.split('@')[0]


class PostSerializer(serializers.ModelSerializer):
    """Serializer for Post model"""
    
    author_name = serializers.CharField(source='get_author_display_name', read_only=True)
    author_email = serializers.CharField(source='author.email', read_only=True)
    like_count = serializers.SerializerMethodField()
    user_like = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'content', 'author_name', 'author_email', 'is_anonymous',
            'is_edited', 'edited_at', 'edit_reason', 'like_count', 'user_like',
            'replies', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'author_name', 'author_email', 'like_count', 'user_like', 'replies']
    
    def get_like_count(self, obj):
        return obj.likes.count()
    
    def get_user_like(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            try:
                from .models import ProfessorUser
                user = ProfessorUser.objects.get(email=request.user.email)
                like = obj.likes.filter(user=user).first()
                if like:
                    return PostLikeSerializer(like).data
            except:
                pass
        return None
    
    def get_replies(self, obj):
        replies = obj.replies.all()[:5]  # Limit to 5 replies for performance
        return PostSerializer(replies, many=True, context=self.context).data


class TopicSerializer(serializers.ModelSerializer):
    """Serializer for Topic model"""
    
    author_name = serializers.CharField(source='get_author_display_name', read_only=True)
    author_email = serializers.CharField(source='author.email', read_only=True)
    forum_name = serializers.CharField(source='forum.name', read_only=True)
    last_post_author = serializers.SerializerMethodField()
    posts = serializers.SerializerMethodField()
    is_subscribed = serializers.SerializerMethodField()
    
    class Meta:
        model = Topic
        fields = [
            'id', 'title', 'content', 'author_name', 'author_email', 'forum_name',
            'is_pinned', 'is_locked', 'is_anonymous', 'view_count', 'reply_count',
            'last_post_author', 'last_activity', 'posts', 'is_subscribed',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'author_name', 'author_email', 'forum_name', 'view_count', 'reply_count', 'last_post_author', 'last_activity', 'posts', 'is_subscribed']
    
    def get_last_post_author(self, obj):
        if obj.last_post:
            return obj.last_post.get_author_display_name()
        return None
    
    def get_posts(self, obj):
        posts = obj.posts.all()[:10]  # Limit to 10 posts for performance
        return PostSerializer(posts, many=True, context=self.context).data
    
    def get_is_subscribed(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            try:
                from .models import ProfessorUser
                user = ProfessorUser.objects.get(email=request.user.email)
                return obj.subscriptions.filter(user=user).exists()
            except:
                pass
        return False


class TopicListSerializer(serializers.ModelSerializer):
    """Simplified serializer for Topic list view"""
    
    author_name = serializers.CharField(source='get_author_display_name', read_only=True)
    forum_name = serializers.CharField(source='forum.name', read_only=True)
    last_post_author = serializers.SerializerMethodField()
    
    class Meta:
        model = Topic
        fields = [
            'id', 'title', 'author_name', 'forum_name', 'is_pinned', 'is_locked',
            'view_count', 'reply_count', 'last_post_author', 'last_activity',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'author_name', 'forum_name', 'view_count', 'reply_count', 'last_post_author', 'last_activity']
    
    def get_last_post_author(self, obj):
        if obj.last_post:
            return obj.last_post.get_author_display_name()
        return None


class TopicSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for TopicSubscription model"""
    
    topic_title = serializers.CharField(source='topic.title', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = TopicSubscription
        fields = [
            'id', 'topic_title', 'user_email', 'notify_on_reply', 'notify_on_like',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'topic_title', 'user_email']


class GrantPipelineStageSerializer(serializers.ModelSerializer):
    """Serializer for GrantPipelineStage model"""
    
    grant_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GrantPipelineStage
        fields = [
            'id', 'name', 'order', 'color', 'grant_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'grant_count']
    
    def get_grant_count(self, obj):
        return obj.grants.count()


class GrantPipelineEntrySerializer(serializers.ModelSerializer):
    """Serializer for GrantPipelineEntry model"""
    
    grant = GrantSerializer(read_only=True)
    stage = GrantPipelineStageSerializer(read_only=True)
    grant_id = serializers.IntegerField(write_only=True)
    stage_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = GrantPipelineEntry
        fields = [
            'id', 'grant', 'stage', 'grant_id', 'stage_id', 'notes', 'priority',
            'application_deadline', 'application_submitted_date', 'decision_date',
            'decision_status', 'created_at', 'updated_at', 'moved_to_stage_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'moved_to_stage_at']


