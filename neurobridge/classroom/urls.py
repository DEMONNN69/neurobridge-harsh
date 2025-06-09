from django.urls import path
from . import views

app_name = 'classroom'

urlpatterns = [
    # Teacher classroom management
    path('teacher-classrooms/', views.TeacherClassroomListView.as_view(), name='teacher-classrooms'),
    path('create/', views.ClassroomCreateView.as_view(), name='classroom-create'),
    path('<int:pk>/update/', views.ClassroomUpdateView.as_view(), name='classroom-update'),
    path('<int:pk>/delete/', views.ClassroomDeleteView.as_view(), name='classroom-delete'),
    path('<int:pk>/students/', views.ClassroomStudentsView.as_view(), name='classroom-students'),
    path('<int:classroom_id>/remove-student/<int:student_id>/', views.remove_student, name='remove-student'),
    
    # Student classroom management
    path('student-classrooms/', views.StudentClassroomListView.as_view(), name='student-classrooms'),
    path('join/', views.join_classroom, name='join-classroom'),
    path('<int:classroom_id>/leave/', views.leave_classroom, name='leave-classroom'),
    
    # Shared classroom operations
    path('<int:pk>/', views.ClassroomDetailView.as_view(), name='classroom-detail'),
    path('<int:pk>/members/', views.ClassroomMembersView.as_view(), name='classroom-members'),
]
