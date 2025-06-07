# quiz_generator/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('generate/', views.generate_quiz_view, name='generate_quiz'),
    path('submit/', views.submit_assessment_view, name='submit_assessment'),
    path('submit-combined/', views.submit_combined_assessment_view, name='submit_combined_assessment'),
    path('info/', views.quiz_info_view, name='quiz_info'),
]
