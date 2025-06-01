from django.urls import path
from . import views

urlpatterns = [
    path('tasks/', views.TaskListCreateView.as_view(), name='task-list'),
    path('tasks/<int:pk>/', views.TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<int:task_id>/complete/', views.complete_task, name='complete-task'),
    path('tasks/upcoming/', views.upcoming_tasks, name='upcoming-tasks'),
    
    path('events/', views.EventListCreateView.as_view(), name='event-list'),
    path('events/<int:pk>/', views.EventDetailView.as_view(), name='event-detail'),
    
    path('study-sessions/', views.StudySessionListCreateView.as_view(), name='study-session-list'),
    
    path('reminders/', views.ReminderListCreateView.as_view(), name='reminder-list'),
    
    path('calendar/', views.calendar_view, name='calendar-view'),
]
