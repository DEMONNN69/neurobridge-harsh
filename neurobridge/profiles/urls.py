from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('student/', views.StudentProfileView.as_view(), name='student-profile'),
    path('teacher/', views.TeacherProfileView.as_view(), name='teacher-profile'),
    path('achievements/', views.StudentAchievementsView.as_view(), name='achievements'),
    path('dashboard/stats/', views.student_dashboard_stats, name='student-dashboard-stats'),
    path('student/assessment-status/', views.student_assessment_status, name='student-assessment-status'),
    path('teacher/profile-completion/', views.teacher_profile_completion_status, name='teacher-profile-completion'),
    # Pre-assessment endpoints
    path('pre-assessment/save/', views.save_pre_assessment_data, name='save-pre-assessment'),
    path('pre-assessment/get/', views.get_pre_assessment_data, name='get-pre-assessment'),
]
