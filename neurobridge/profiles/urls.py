from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('student/', views.StudentProfileView.as_view(), name='student-profile'),
    path('teacher/', views.TeacherProfileView.as_view(), name='teacher-profile'),
    path('achievements/', views.StudentAchievementsView.as_view(), name='achievements'),
    path('dashboard/stats/', views.student_dashboard_stats, name='student-dashboard-stats'),
    path('student/assessment-status/', views.student_assessment_status, name='student-assessment-status'),
]
