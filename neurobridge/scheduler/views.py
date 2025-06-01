from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Task, Event, StudySession, Reminder
from .serializers import TaskSerializer, EventSerializer, StudySessionSerializer, ReminderSerializer

class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.filter(user=self.request.user)
        status_filter = self.request.query_params.get('status', None)
        priority_filter = self.request.query_params.get('priority', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
            
        return queryset.order_by('due_date', '-priority')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)

class EventListCreateView(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Event.objects.filter(user=self.request.user)
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(start_datetime__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_datetime__lte=end_date)
            
        return queryset.order_by('start_datetime')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(user=self.request.user)

class StudySessionListCreateView(generics.ListCreateAPIView):
    serializer_class = StudySessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'student':
            return StudySession.objects.filter(student=self.request.user)
        return StudySession.objects.none()

    def perform_create(self, serializer):
        if self.request.user.user_type == 'student':
            serializer.save(student=self.request.user)

class ReminderListCreateView(generics.ListCreateAPIView):
    serializer_class = ReminderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reminder.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def calendar_view(request):
    """Get calendar data for a specific month/week"""
    start_date_str = request.query_params.get('start_date')
    end_date_str = request.query_params.get('end_date')
    
    if not start_date_str or not end_date_str:
        # Default to current month
        now = timezone.now()
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            end_date = start_date.replace(year=now.year + 1, month=1) - timedelta(days=1)
        else:
            end_date = start_date.replace(month=now.month + 1) - timedelta(days=1)
    else:
        start_date = datetime.fromisoformat(start_date_str)
        end_date = datetime.fromisoformat(end_date_str)
    
    # Get events and tasks for the date range
    events = Event.objects.filter(
        user=request.user,
        start_datetime__gte=start_date,
        end_datetime__lte=end_date
    )
    
    tasks = Task.objects.filter(
        user=request.user,
        due_date__gte=start_date,
        due_date__lte=end_date
    )
    
    study_sessions = StudySession.objects.filter(
        student=request.user,
        start_time__gte=start_date,
        end_time__lte=end_date
    ) if request.user.user_type == 'student' else StudySession.objects.none()
    
    calendar_data = {
        'events': EventSerializer(events, many=True).data,
        'tasks': TaskSerializer(tasks, many=True).data,
        'study_sessions': StudySessionSerializer(study_sessions, many=True).data,
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat()
    }
    
    return Response(calendar_data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def complete_task(request, task_id):
    """Mark a task as completed"""
    try:
        task = Task.objects.get(id=task_id, user=request.user)
        task.status = 'completed'
        task.completed_at = timezone.now()
        task.save()
        
        return Response({'message': 'Task completed successfully'}, status=status.HTTP_200_OK)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def upcoming_tasks(request):
    """Get upcoming tasks for the next 7 days"""
    start_date = timezone.now()
    end_date = start_date + timedelta(days=7)
    
    tasks = Task.objects.filter(
        user=request.user,
        due_date__gte=start_date,
        due_date__lte=end_date,
        status__in=['pending', 'in_progress']
    ).order_by('due_date')
    
    return Response(TaskSerializer(tasks, many=True).data)
