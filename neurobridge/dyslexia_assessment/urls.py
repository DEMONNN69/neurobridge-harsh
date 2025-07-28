from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TaskCategoryViewSet, AgeRangeViewSet, DifficultyLevelViewSet,
    QuestionViewSet, AssessmentSessionViewSet, QuestionSetViewSet,
    start_manual_assessment, submit_manual_assessment, 
    get_manual_assessment_results, get_manual_assessment_history
)

router = DefaultRouter()
router.register(r'categories', TaskCategoryViewSet)
router.register(r'age-ranges', AgeRangeViewSet)
router.register(r'difficulty-levels', DifficultyLevelViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'sessions', AssessmentSessionViewSet, basename='assessmentsession')
router.register(r'question-sets', QuestionSetViewSet)

app_name = 'dyslexia_assessment'

urlpatterns = [
    path('api/', include(router.urls)),
    # Manual assessment endpoints
    path('start/', start_manual_assessment, name='start_assessment'),
    path('submit/', submit_manual_assessment, name='submit_assessment'),
    path('results/<uuid:session_id>/', get_manual_assessment_results, name='assessment_results'),
    path('history/', get_manual_assessment_history, name='assessment_history'),
]
