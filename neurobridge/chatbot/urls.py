from django.urls import path
from . import views

urlpatterns = [
    path('sessions/', views.ChatSessionListCreateView.as_view(), name='chat-session-list'),
    path('sessions/<str:session_id>/', views.ChatSessionDetailView.as_view(), name='chat-session-detail'),
    path('sessions/<str:session_id>/messages/', views.ChatMessageListCreateView.as_view(), name='chat-messages'),
    path('sessions/<str:session_id>/send/', views.send_message, name='send-message'),
    path('sessions/<str:session_id>/end/', views.end_session, name='end-session'),
    
    path('personalities/', views.BotPersonalityListView.as_view(), name='bot-personalities'),
    path('preferences/', views.UserPreferenceView.as_view(), name='chat-preferences'),
    path('feedback/', views.ChatFeedbackCreateView.as_view(), name='chat-feedback'),
]
