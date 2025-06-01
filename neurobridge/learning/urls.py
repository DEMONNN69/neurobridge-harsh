from django.urls import path
from . import views

urlpatterns = [
    path('courses/', views.CourseListCreateView.as_view(), name='course-list'),
    path('courses/<int:pk>/', views.CourseDetailView.as_view(), name='course-detail'),
    path('courses/<int:course_id>/lessons/', views.LessonListCreateView.as_view(), name='course-lessons'),
    path('courses/<int:course_id>/assignments/', views.AssignmentListCreateView.as_view(), name='course-assignments'),
    path('assignments/', views.AssignmentListCreateView.as_view(), name='assignment-list'),
    path('assignments/<int:assignment_id>/submissions/', views.SubmissionListCreateView.as_view(), name='assignment-submissions'),
    path('submissions/', views.SubmissionListCreateView.as_view(), name='submission-list'),
    path('enroll/<int:course_id>/', views.enroll_in_course, name='enroll-course'),
    path('progress/<int:lesson_id>/', views.update_progress, name='update-progress'),
]
