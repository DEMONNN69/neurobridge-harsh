from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
import uuid
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_manual_assessment(request):
    """Start a new manual assessment session for a student"""
    try:
        student_age = request.data.get('student_age')
        if not student_age:
            return Response(
                {'error': 'student_age is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get age-appropriate questions
        age_ranges = AgeRange.objects.filter(
            min_age__lte=student_age, 
            max_age__gte=student_age
        )
        
        if not age_ranges.exists():
            # Fallback to closest age range
            age_ranges = AgeRange.objects.all()
        
        # Get questions from different categories and difficulty levels
        questions = Question.objects.filter(
            is_active=True,
            is_published=True,
            age_ranges__in=age_ranges
        ).distinct().order_by('?')[:10]  # Random selection of 10 questions
        
        if not questions.exists():
            return Response(
                {'error': 'No questions available for this age group'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create assessment session
        session = AssessmentSession.objects.create(
            student=request.user,
            status='in_progress',
            pre_assessment_data={'student_age': student_age}
        )
        
        # Serialize questions for frontend
        question_serializer = QuestionForAssessmentSerializer(questions, many=True)
        
        return Response({
            'session_id': str(session.id),
            'questions': question_serializer.data,
            'student_age': student_age,
            'total_questions': len(questions)
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_manual_assessment(request):
    """Submit completed manual assessment"""
    try:
        session_id = request.data.get('session_id')
        responses = request.data.get('responses', [])
        total_time = request.data.get('total_time', 0)
        completion_status = request.data.get('completion_status', 'completed')
        
        if not session_id:
            return Response(
                {'error': 'session_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get session
        try:
            session = AssessmentSession.objects.get(
                id=session_id, 
                student=request.user
            )
        except AssessmentSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if session.status != 'in_progress':
            return Response(
                {'error': 'Session is already completed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process responses
        total_score = 0
        max_possible_score = 0
        
        for response_data in responses:
            question_id = response_data.get('question_id')
            response_payload = response_data.get('response_data')
            response_time = response_data.get('response_time', 0)
            start_time = response_data.get('start_time')
            end_time = response_data.get('end_time')
            
            try:
                question = Question.objects.get(id=question_id)
                max_possible_score += question.points
                
                # Determine if response is correct based on question type
                is_correct = False
                selected_option = None
                text_response = ''
                
                if question.question_type == 'multiple_choice':
                    # response_payload should be option ID
                    try:
                        selected_option = QuestionOption.objects.get(
                            id=response_payload, 
                            question=question
                        )
                        is_correct = selected_option.is_correct
                    except QuestionOption.DoesNotExist:
                        pass
                        
                elif question.question_type == 'true_false':
                    # response_payload should be boolean
                    # Need to check against correct answer in question data
                    correct_answer = question.additional_data.get('correct_answer', True)
                    is_correct = response_payload == correct_answer
                    
                elif question.question_type == 'text_response':
                    # Store text response for manual review
                    text_response = str(response_payload)
                    is_correct = False  # Requires manual review
                    
                elif question.question_type in ['sequencing', 'matching']:
                    # Complex response types - store for manual review
                    is_correct = False  # Requires manual review
                    
                elif question.question_type == 'audio_response':
                    # Audio response - store for manual review
                    is_correct = False  # Requires manual review
                
                if is_correct:
                    total_score += question.points
                
                # Create student response
                StudentResponse.objects.create(
                    session=session,
                    question=question,
                    selected_option=selected_option,
                    text_response=text_response,
                    response_data=response_payload,
                    time_taken_seconds=response_time,
                    is_correct=is_correct,
                    needs_review=question.question_type in ['text_response', 'sequencing', 'matching', 'audio_response']
                )
                
            except Question.DoesNotExist:
                continue
        
        # Update session
        session.status = completion_status
        session.completed_at = timezone.now()
        session.total_time_seconds = total_time
        session.total_score = total_score
        session.max_possible_score = max_possible_score
        session.accuracy_percentage = (total_score / max_possible_score * 100) if max_possible_score > 0 else 0
        session.save()
        
        # Calculate risk indicators based on performance
        session.calculate_results()
        
        # Update student profile with assessment completion
        from profiles.models import StudentProfile
        student_profile, created = StudentProfile.objects.get_or_create(
            user=request.user,
            defaults={'student_id': f'STU{request.user.id:06d}'}
        )
        student_profile.assessment_score = session.accuracy_percentage
        student_profile.save()
        
        return Response({
            'session_id': str(session.id),
            'total_score': total_score,
            'max_possible_score': max_possible_score,
            'accuracy_percentage': session.accuracy_percentage,
            'total_time': total_time,
            'completion_status': completion_status,
            'risk_indicators': session.risk_indicators
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_manual_assessment_results(request, session_id):
    """Get results for a specific assessment session"""
    try:
        session = AssessmentSession.objects.get(
            id=session_id, 
            student=request.user
        )
        serializer = AssessmentSessionSerializer(session)
        return Response(serializer.data)
        
    except AssessmentSession.DoesNotExist:
        return Response(
            {'error': 'Session not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_manual_assessment_history(request):
    """Get assessment history for the current user"""
    sessions = AssessmentSession.objects.filter(
        student=request.user
    ).order_by('-started_at')
    
    serializer = AssessmentSessionSerializer(sessions, many=True)
    return Response(serializer.data)
