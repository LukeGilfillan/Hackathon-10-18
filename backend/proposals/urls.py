from django.urls import path
from . import views

urlpatterns = [
    # Grant Draft Management
    path('drafts/', views.list_grant_drafts, name='list_grant_drafts'),
    path('drafts/create/', views.create_grant_draft, name='create_grant_draft'),
    path('drafts/<int:draft_id>/', views.get_grant_draft, name='get_grant_draft'),
    path('drafts/<int:draft_id>/update/', views.update_grant_draft, name='update_grant_draft'),
    path('drafts/<int:draft_id>/delete/', views.delete_grant_draft, name='delete_grant_draft'),
    
    # AI-Powered Features
    path('drafts/<int:draft_id>/improve/', views.improve_draft_section, name='improve_draft_section'),
    path('drafts/<int:draft_id>/suggestions/', views.get_draft_suggestions, name='get_draft_suggestions'),
    path('drafts/<int:draft_id>/version/', views.create_draft_version, name='create_draft_version'),
    
    # Download Features
    path('drafts/<int:draft_id>/download/', views.download_proposal, name='download_proposal'),
    path('drafts/<int:draft_id>/download/<str:format_type>/', views.download_proposal, name='download_proposal_format'),
]
