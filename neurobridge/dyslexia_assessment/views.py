from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import (
    TaskCategory, AgeRange, DifficultyLevel, Question, 
    QuestionOption, AssessmentSession, StudentResponse, QuestionSet
)
from .serializers import (
    TaskCategorySerializer, AgeRangeSerializer, DifficultyLevelSerializer,
    QuestionSerializer, QuestionForAssessmentSerializer, AssessmentSessionSerializer,
    StudentResponseSerializer, QuestionSetSerializer
)


class TaskCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for task categories"""
    queryset = TaskCategory.objects.filter(is_active=True)
    serializer_class = TaskCategorySerializer
    permission_classes = [IsAuthenticated]


class AgeRangeViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for age ranges"""
    queryset = AgeRange.objects.all()
    serializer_class = AgeRangeSerializer
    permission_classes = [IsAuthenticated]


class DifficultyLevelViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for difficulty levels"""
    queryset = DifficultyLevel.objects.all()
    serializer_class = DifficultyLevelSerializer
    permission_classes = [IsAuthenticated]


class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for questions - admin use"""
    queryset = Question.objects.filter(is_active=True, is_published=True)
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Filter by difficulty
        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty_level_id=difficulty)
        
        # Filter by age range
        age = self.request.query_params.get('age')
        if age:
            queryset = queryset.filter(age_ranges__min_age__lte=age, age_ranges__max_age__gte=age)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def get_assessment_questions(self, request):
        """Get questions for a specific assessment session"""
        pre_assessment_data = request.data.get('pre_assessment_data', {})
        age = pre_assessment_data.get('age')
        categories = request.data.get('categories', [])
        max_questions = request.data.get('max_questions', 6)
        
        # Build queryset based on criteria
        queryset = self.get_queryset()
        
        if age:
            queryset = queryset.filter(
                age_ranges__min_age__lte=age, 
                age_ranges__max_age__gte=age
            ).distinct()
        
        if categories:
            queryset = queryset.filter(category_id__in=categories)
        
        # Randomize and limit
        questions = queryset.order_by('?')[:max_questions]
        
        # Use assessment-specific serializer that hides correct answers
        serializer = QuestionForAssessmentSerializer(questions, many=True)
        return Response(serializer.data)


class AssessmentSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for assessment sessions"""
    serializer_class = AssessmentSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Students can only see their own sessions
        if self.request.user.user_type == 'student':
            return AssessmentSession.objects.filter(student=self.request.user)
        # Teachers can see sessions from their students
        return AssessmentSession.objects.all()
    
    def perform_create(self, serializer):
        """Create a new assessment session"""
        serializer.save(student=self.request.user)
    
    @action(detail=True, methods=['post'])
    def submit_response(self, request, pk=None):
        """Submit a response to a question in this session"""
        session = self.get_object()
        
        if session.status != 'in_progress':
            return Response(
                {'error': 'Cannot submit responses to a completed session'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        question_id = request.data.get('question_id')
        selected_option_id = request.data.get('selected_option_id')
        text_response = request.data.get('text_response', '')
        response_data = request.data.get('response_data', {})
        time_taken = request.data.get('time_taken_seconds')
        
        if not question_id:
            return Response(
                {'error': 'question_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        question = get_object_or_404(Question, id=question_id)
        
        # Create or update response
        response, created = StudentResponse.objects.get_or_create(
            session=session,
            question=question,
            defaults={
                'selected_option_id': selected_option_id,
                'text_response': text_response,
                'response_data': response_data,
                'time_taken_seconds': time_taken,
            }
        )
        
        if not created:
            # Update existing response
            response.selected_option_id = selected_option_id
            response.text_response = text_response
            response.response_data = response_data
            response.time_taken_seconds = time_taken
            response.save()
        
        serializer = StudentResponseSerializer(response)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete_session(self, request, pk=None):
        """Mark the session as completed and calculate results"""
        session = self.get_object()
        
        if session.status != 'in_progress':
            return Response(
                {'error': 'Session is already completed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.status = 'completed'
        session.completed_at = timezone.now()
        
        # Calculate total time if not provided
        if not session.total_time_seconds:
            time_diff = session.completed_at - session.started_at
            session.total_time_seconds = int(time_diff.total_seconds())
        
        session.save()
        
        # Calculate results
        session.calculate_results()
        
        serializer = self.get_serializer(session)
        return Response(serializer.data)


class QuestionSetViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for question sets"""
    queryset = QuestionSet.objects.filter(is_active=True)
    serializer_class = QuestionSetSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def get_questions_for_student(self, request, pk=None):
        """Get questions from this set for a specific student"""
        question_set = self.get_object()
        student_profile = request.data.get('student_profile', {})
        
        questions = question_set.get_questions_for_student(student_profile)
        serializer = QuestionForAssessmentSerializer(questions, many=True)
        return Response(serializer.data)
