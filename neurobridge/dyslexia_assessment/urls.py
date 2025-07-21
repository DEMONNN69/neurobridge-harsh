from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TaskCategoryViewSet, AgeRangeViewSet, DifficultyLevelViewSet,
    QuestionViewSet, AssessmentSessionViewSet, QuestionSetViewSet
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
]
