# quiz_generator/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .serializers import QuizGenerationRequestSerializer
from .models import AssessmentQuestion, AssessmentSession, AssessmentResponse
from profiles.models import StudentProfile
import random
import uuid

# Import your function from the script
from .gemini_mcq_generator import generate_assessment_questions

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_assessment_view(request):
    """
    Submit student assessment results and save detailed analysis data.
    
    Expected request data:
    {
        "session_id": "uuid-string",
        "answers": [
            {"question_id": "uuid", "selected_answer": "A", "is_correct": true, "response_time": 5.2},
            {"question_id": "uuid", "selected_answer": "B", "is_correct": false, "response_time": 3.1},
            ...
        ],
        "total_questions": 10,
        "correct_answers": 7
    }
    
    Returns the assessment results and assigns random dyslexic type/severity for now.
    """
    # Check if user is a student
    if request.user.user_type != 'student':
        return Response({
            'error': 'Only students can submit assessments'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Validate required fields
    session_id = request.data.get('session_id')
    answers = request.data.get('answers', [])
    total_questions = request.data.get('total_questions', 0)
    correct_answers = request.data.get('correct_answers', 0)
    
    if not answers or total_questions == 0:
        return Response({
            'error': 'Assessment answers and total questions are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Calculate accuracy percentage
    accuracy = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
    
    try:
        # Create assessment session
        session = AssessmentSession.objects.create(
            user=request.user,
            total_questions=total_questions,
            correct_answers=correct_answers,
            accuracy_percentage=accuracy,
            # Assign random values for now (AI model will update these later)
            predicted_dyslexic_type=random.choice(['phonological', 'surface', 'mixed', 'rapid_naming', 'double_deficit']),
            predicted_severity=random.choice(['mild', 'moderate', 'severe'])
        )        # Save individual responses for AI analysis
        wrong_questions = []
        backend_correct_count = 0  # Recalculate based on backend verification
        
        for answer in answers:
            question_id = answer.get('question_id')
            user_answer = answer.get('selected_answer')  # This will be A, B, C, or D
            is_correct = answer.get('is_correct', False)  # Frontend calculated this
            response_time = answer.get('response_time', 0)
            
            try:
                question = AssessmentQuestion.objects.get(question_id=question_id)
                
                # Double-check correctness on backend as well
                if user_answer in ['A', 'B', 'C', 'D']:
                    option_index = ord(user_answer) - ord('A')
                    if 0 <= option_index < len(question.options):
                        selected_option_text = question.options[option_index]
                        backend_is_correct = selected_option_text == question.correct_answer
                        # Use backend calculation as authoritative
                        is_correct = backend_is_correct
                        if is_correct:
                            backend_correct_count += 1
                
                # Create assessment response
                AssessmentResponse.objects.create(
                    session=session,
                    question=question,
                    user_answer=user_answer,
                    is_correct=is_correct,
                    response_time=response_time
                )
                
                # Track wrong questions with their condition type
                if not is_correct:
                    wrong_questions.append({
                        'question_id': str(question_id),
                        'condition_type': question.condition_type,
                        'difficulty': question.difficulty_level,
                        'user_answer': user_answer,
                        'correct_answer': question.correct_answer
                    })
                    
            except AssessmentQuestion.DoesNotExist:
                print(f"Question with ID {question_id} not found")
                continue
        
        # Update session with backend-verified correct count and accuracy
        session.correct_answers = backend_correct_count
        session.accuracy_percentage = (backend_correct_count / total_questions) * 100 if total_questions > 0 else 0
        session.save()
        
        # Update student profile with corrected assessment score
        student_profile, created = StudentProfile.objects.get_or_create(
            user=request.user,
            defaults={'student_id': f'STU{request.user.id:06d}'}
        )
        
        student_profile.assessment_score = session.accuracy_percentage
        student_profile.save()
        
        return Response({
            'session_id': str(session.session_id),
            'accuracy': session.accuracy_percentage,
            'total_questions': total_questions,
            'correct_answers': backend_correct_count,
            'wrong_questions': wrong_questions,
            'wrong_questions_count': len(wrong_questions),
            'predicted_dyslexic_type': session.predicted_dyslexic_type,
            'predicted_severity': session.predicted_severity,
            'message': 'Assessment completed successfully. Results saved for AI analysis.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to save assessment results: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz_view(request):
    """
    Generate a mix of 5 dyslexia and 5 autism questions for assessment.
    
    POST /api/quiz/generate/
    
    Request body:
    {
        "condition": "mixed" (or any condition, will generate mix),
        "num_easy": integer,
        "num_moderate": integer, 
        "num_hard": integer
    }
    
    Response includes questions with saved question_ids for tracking.
    """    # Validate request data using serializer
    serializer = QuizGenerationRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'error': 'Invalid request data',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
      # Extract validated data
    validated_data = serializer.validated_data
    num_easy = validated_data.get('num_easy', 2)
    num_moderate = validated_data.get('num_moderate', 4)
    num_hard = validated_data.get('num_hard', 4)

    try:
        # Generate exactly 10 mixed questions in one call to prevent duplicates
        # Use a single API call for consistency
        total_questions_needed = 10
        
        # Generate all questions at once with mixed condition
        questions_data = generate_assessment_questions(
            condition="mixed",  # Let Gemini handle the mix internally
            num_easy=2,
            num_moderate=4,
            num_hard=4
        )

        # Check for errors
        if "error" in questions_data:
            return Response({
                'error': 'Failed to generate questions',
                'details': questions_data.get('error')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Process and save questions to database
        all_questions = []
        questions = questions_data.get("questions", [])
        
        # Ensure we have exactly 10 questions
        if len(questions) != 10:
            return Response({
                'error': f'Expected 10 questions but got {len(questions)}',
                'details': 'Question generation did not produce the expected count'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
          # Save questions to database and format for response
        dyslexia_count = 0
        autism_count = 0
        
        for i, q in enumerate(questions):
            # Check if the question has a focus_area field from Gemini
            if 'focus_area' in q:
                condition_type = q['focus_area']
            else:
                # Fallback: alternate between dyslexia and autism to ensure 5+5 mix
                condition_type = 'dyslexia' if i % 2 == 0 else 'autism'
                
            if condition_type == 'dyslexia':
                dyslexia_count += 1
            else:
                autism_count += 1
            
            question = AssessmentQuestion.objects.create(
                question_text=q['question'],
                options=q['options'],
                correct_answer=q['correct_answer'],
                condition_type=condition_type,
                difficulty_level=q.get('difficulty', 'medium')
            )
            
            formatted_question = {
                'id': i + 1,
                'question_id': str(question.question_id),
                'question': q['question'],
                'options': q['options'],
                'correct_answer': q['correct_answer'],
                'difficulty': q.get('difficulty', 'medium'),
                'condition': condition_type,
                'explanation': q.get('explanation', '')
            }
            all_questions.append(formatted_question)
        
        # Shuffle questions for randomized order
        random.shuffle(all_questions)
        
        # Generate session ID for tracking
        session_id = str(uuid.uuid4())
        
        # Build response
        response_data = {
            'session_id': session_id,
            'questions': all_questions,
            'total_questions': len(all_questions),
            'condition': 'mixed',
            'dyslexia_questions': dyslexia_count,
            'autism_questions': autism_count,
            'generated_at': timezone.now(),
            'generated_by': request.user.id
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"An unexpected error occurred in generate_quiz_view: {e}")
        return Response({
            'error': 'An unexpected server error occurred',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def quiz_info_view(request):
    """
    Get information about the quiz generation API.
    """
    info = {
        'available_conditions': ['dyslexia', 'autism', 'mixed'],
        'difficulty_levels': ['easy', 'moderate', 'hard'],
        'default_mix': '5 dyslexia + 5 autism questions',
        'max_questions_per_request': 10,
        'min_questions_per_request': 1,
        'supported_formats': ['multiple_choice'],
        'api_version': '2.0',
        'description': 'Generate mixed assessment questions for detailed learning condition analysis'
    }
    
    return Response(info, status=status.HTTP_200_OK)


