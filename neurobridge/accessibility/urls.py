from django.urls import path
from . import views

urlpatterns = [
    path('settings/', views.AccessibilitySettingsView.as_view(), name='accessibility-settings'),
    path('dyslexia-profile/', views.DyslexiaProfileView.as_view(), name='dyslexia-profile'),
    path('logs/', views.AccessibilityLogListView.as_view(), name='accessibility-logs'),
    path('log-action/', views.log_accessibility_action, name='log-accessibility-action'),
    path('recommendations/', views.accessibility_recommendations, name='accessibility-recommendations'),
    path('analytics/', views.accessibility_analytics, name='accessibility-analytics'),
    
    path('support-requests/', views.SupportRequestListCreateView.as_view(), name='support-request-list'),
    path('support-requests/<int:pk>/', views.SupportRequestDetailView.as_view(), name='support-request-detail'),
]
