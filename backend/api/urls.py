from django.urls import path
from . import views

urlpatterns = [
    path('hello/', views.hello_world, name='hello_world'),
    path('health/', views.health, name='health'),
    path('grants/', views.search_grants, name='search_grants'),
    path('grants/<int:grant_id>/', views.get_grant, name='get_grant'),
    path('profiles/', views.search_profiles, name='search_profiles'),
    path('profiles/<str:email>/', views.get_profile, name='get_profile'),
]
