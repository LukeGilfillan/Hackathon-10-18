from django.urls import path
from . import views, auth_views

urlpatterns = [
    path('hello/', views.hello_world, name='hello_world'),
    path('health/', views.health, name='health'),
    path('grants/', views.search_grants, name='search_grants'),
    path('grants/<int:grant_id>/', views.get_grant, name='get_grant'),
    path('profiles/', views.search_profiles, name='search_profiles'),
    path('profiles/<str:email>/', views.get_profile, name='get_profile'),
    
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
]
