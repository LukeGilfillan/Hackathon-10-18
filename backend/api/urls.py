from django.urls import path
from . import views, auth_views

urlpatterns = [
    path('hello/', views.hello_world, name='hello_world'),
    path('health/', views.health, name='health'),
    path('grants/', views.search_grants, name='search_grants'),
    path('grants/<int:grant_id>/', views.get_grant, name='get_grant'),
    path('profiles/', views.search_profiles, name='search_profiles'),
    path('profiles/<str:email>/', views.get_profile, name='get_profile'),
    
    # Natural Language Search endpoints
    path('search/grants/nlp/', views.natural_language_search_grants, name='natural_language_search_grants'),
    path('search/profiles/nlp/', views.natural_language_search_profiles, name='natural_language_search_profiles'),
    
    # Authentication endpoints
    path('auth/signup/', auth_views.sign_up, name='sign_up'),
    path('auth/signin/', auth_views.sign_in, name='sign_in'),
    path('auth/signout/', auth_views.sign_out, name='sign_out'),
    path('auth/current-user/', auth_views.get_current_user, name='get_current_user'),
    path('auth/check-email/', auth_views.check_email_exists, name='check_email_exists'),
    
    # Professor-related endpoints
    path('professors/recommendations/', views.get_professor_recommendations, name='get_professor_recommendations'),
    path('professors/recommendations/interaction/', views.update_recommendation_interaction, name='update_recommendation_interaction'),
    path('professors/<str:email>/', views.get_professor_profile, name='get_professor_profile'),
    path('professors/', views.create_professor_profile, name='create_professor_profile'),
    path('professors/<str:email>/update/', views.update_professor_profile, name='update_professor_profile'),
    
    # Saved Grants and Collaboration endpoints
    path('saved-grants/', views.saved_grants, name='saved_grants'),
    path('saved-grants/<int:saved_grant_id>/', views.saved_grant_detail, name='saved_grant_detail'),
    path('collaboration-invites/', views.collaboration_invites, name='collaboration_invites'),
    path('collaboration-invites/<int:invite_id>/respond/', views.collaboration_invite_response, name='collaboration_invite_response'),
    path('collaborations/', views.collaborations, name='collaborations'),
    path('saved-grants/<int:saved_grant_id>/collaborators/', views.grant_collaborators, name='grant_collaborators'),
    
    # Forum endpoints
    path('forums/', views.get_forums, name='get_forums'),
    path('forums/<str:forum_slug>/topics/', views.get_forum_topics, name='get_forum_topics'),
    path('topics/<int:topic_id>/', views.get_topic, name='get_topic'),
    path('topics/', views.create_topic, name='create_topic'),
    path('posts/', views.create_post, name='create_post'),
    path('posts/like/', views.toggle_post_like, name='toggle_post_like'),
    path('topics/subscribe/', views.toggle_topic_subscription, name='toggle_topic_subscription'),
    
    # Grant Pipeline endpoints
    path('grant-pipeline/', views.grant_pipeline, name='grant_pipeline'),
    path('grant-pipeline/entry/<int:entry_id>/', views.grant_pipeline_entry, name='grant_pipeline_entry'),
    path('grant-pipeline/entry/<int:entry_id>/move/', views.move_grant_to_stage, name='move_grant_to_stage'),
    path('pipeline-stages/', views.pipeline_stages, name='pipeline_stages'),
    
    # Chatbot endpoint
    path('chatbot/', views.cardinal_concordia_chatbot, name='cardinal_concordia_chatbot'),
]
