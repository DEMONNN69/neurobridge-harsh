# quiz_generator/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .serializers import QuizGenerationRequestSerializer
from .models import AssessmentQuestion, AssessmentSession, AssessmentResponse, QuestionTiming
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
        }, status=status.HTTP_403_FORBIDDEN)    # Validate required fields
    session_id = request.data.get('session_id')
    assessment_type = request.data.get('assessment_type', 'both')
    answers = request.data.get('answers', [])
    total_questions = request.data.get('total_questions', 0)
    correct_answers = request.data.get('correct_answers', 0)
    total_assessment_time = request.data.get('total_assessment_time', 0)
    question_timings = request.data.get('question_timings', [])
    
    if not answers or total_questions == 0:
        return Response({
            'error': 'Assessment answers and total questions are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Calculate accuracy percentage
    accuracy = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
    
    try:
        # Create assessment session with timing data
        session = AssessmentSession.objects.create(
            user=request.user,
            assessment_type=assessment_type,
            total_questions=total_questions,
            correct_answers=correct_answers,
            accuracy_percentage=accuracy,
            total_assessment_time=total_assessment_time,
            # Assign random values for now (AI model will update these later)
            predicted_dyslexic_type=random.choice(['phonological', 'surface', 'mixed', 'rapid_naming', 'double_deficit']),
            predicted_severity=random.choice(['mild', 'moderate', 'severe'])
        )        # Save individual responses for AI analysis
        wrong_questions = []
        backend_correct_count = 0  # Recalculate based on backend verification
        
        # Separate counters for dyslexia and autism scores
        dyslexia_correct = 0
        dyslexia_total = 0
        autism_correct = 0
        autism_total = 0
        
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
                
                # Count by condition type for separate scoring
                if question.condition_type == 'dyslexia':
                    dyslexia_total += 1
                    if is_correct:
                        dyslexia_correct += 1
                elif question.condition_type == 'autism':
                    autism_total += 1
                    if is_correct:
                        autism_correct += 1
                
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
                continue          # Calculate separate scores
        dyslexia_score = (dyslexia_correct / dyslexia_total * 100) if dyslexia_total > 0 else None
        autism_score = (autism_correct / autism_total * 100) if autism_total > 0 else None
        
        # Update session with backend-verified correct count and accuracy
        session.correct_answers = backend_correct_count
        session.accuracy_percentage = (backend_correct_count / total_questions) * 100 if total_questions > 0 else 0
        session.dyslexia_score = dyslexia_score
        session.autism_score = autism_score
        session.save()
        
        # Save detailed question timing data
        for timing_data in question_timings:
            question_id = timing_data.get('question_id')
            start_time = timing_data.get('start_time', 0)
            end_time = timing_data.get('end_time', 0)
            response_time = timing_data.get('response_time', 0)
            
            try:
                question = AssessmentQuestion.objects.get(question_id=question_id)
                QuestionTiming.objects.create(
                    session=session,
                    question=question,
                    start_time=start_time,
                    end_time=end_time,
                    response_time=response_time
                )
            except AssessmentQuestion.DoesNotExist:
                print(f"Question with ID {question_id} not found for timing data")
                continue
          # Update student profile with corrected assessment score and separate scores
        student_profile, created = StudentProfile.objects.get_or_create(
            user=request.user,
            defaults={'student_id': f'STU{request.user.id:06d}'}
        )
        student_profile.assessment_score = session.accuracy_percentage
        student_profile.assessment_type = assessment_type
        student_profile.dyslexia_score = dyslexia_score
        student_profile.autism_score = autism_score
        student_profile.save()
        
        return Response({
            'session_id': str(session.session_id),
            'assessment_type': assessment_type,
            'accuracy': session.accuracy_percentage,
            'total_questions': total_questions,
            'correct_answers': backend_correct_count,
            'dyslexia_score': dyslexia_score,
            'autism_score': autism_score,
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
    Generate assessment questions based on selected assessment type.
    
    POST /api/quiz/generate/
    
    Request body:
    {
        "assessment_type": "dyslexia" | "autism" | "both"
    }
    
    Question generation logic:
    - dyslexia: 10 questions (3 easy, 4 moderate, 3 hard)
    - autism: 10 questions (3 easy, 4 moderate, 3 hard)  
    - both: 20 questions (6 easy, 8 moderate, 6 hard) - 10 dyslexia + 10 autism
    
    Response includes questions with saved question_ids for tracking.
    """    # Validate request data using serializer
    serializer = QuizGenerationRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'error': 'Invalid request data',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)      # Extract validated data
    validated_data = serializer.validated_data
    assessment_type = validated_data.get('assessment_type', 'both')
    
    # Set question counts and difficulty distribution based on assessment type
    if assessment_type == 'dyslexia':
        # 10 questions for dyslexia only
        condition = 'dyslexia'
        num_easy = 3
        num_moderate = 4
        num_hard = 3
    elif assessment_type == 'autism':
        # 10 questions for autism only
        condition = 'autism'
        num_easy = 3
        num_moderate = 4
        num_hard = 3
    else:  # both
        # 20 questions total (10 dyslexia + 10 autism)
        condition = 'mixed'
        num_easy = 6
        num_moderate = 8
        num_hard = 6

    try:
        # Generate questions based on assessment type
        questions_data = generate_assessment_questions(
            condition=condition,
            num_easy=num_easy,
            num_moderate=num_moderate,
            num_hard=num_hard
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
          # Calculate expected total questions
        expected_total = num_easy + num_moderate + num_hard
        
        # Ensure we have the expected number of questions
        if len(questions) != expected_total:
            return Response({
                'error': f'Expected {expected_total} questions but got {len(questions)}',
                'details': 'Question generation did not produce the expected count'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)        # Save questions to database and format for response
        dyslexia_count = 0
        autism_count = 0
        
        for i, q in enumerate(questions):
            # Determine condition type based on assessment type and question data
            if assessment_type == 'dyslexia':
                condition_type = 'dyslexia'
                dyslexia_count += 1
            elif assessment_type == 'autism':
                condition_type = 'autism'
                autism_count += 1
            else:  # both assessments
                # For 'both' assessment type, use focus_area field from Gemini
                if 'focus_area' in q:
                    condition_type = q['focus_area']
                else:
                    # Fallback: alternate between dyslexia and autism to ensure mix
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
                'question_type': condition_type,  # Added for frontend clarity
                'explanation': q.get('explanation', '')
            }
            all_questions.append(formatted_question)
          # Shuffle questions for randomized order
        random.shuffle(all_questions)
        
        # Validate question counts based on assessment type
        expected_total = 10 if assessment_type in ['dyslexia', 'autism'] else 20
        if len(all_questions) != expected_total:
            return Response({
                'error': f'Expected {expected_total} questions but got {len(all_questions)}',
                'details': f'Question generation failed for assessment type: {assessment_type}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # For 'both' assessment type, ensure we have questions from both conditions
        if assessment_type == 'both':
            if dyslexia_count == 0 or autism_count == 0:
                return Response({
                    'error': 'Both assessment types must have questions',
                    'details': f'Generated {dyslexia_count} dyslexia and {autism_count} autism questions'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Generate session ID for tracking
        session_id = str(uuid.uuid4())          # Build response
        response_data = {
            'session_id': session_id,
            'questions': all_questions,
            'total_questions': len(all_questions),
            'condition': condition,
            'assessment_type': assessment_type,
            'dyslexia_questions': dyslexia_count,
            'autism_questions': autism_count,
            'difficulty_distribution': {
                'easy': num_easy,
                'moderate': num_moderate,
                'hard': num_hard
            },
            'generated_at': timezone.now(),
            'generated_by': request.user.id,
            'message': f'Generated {len(all_questions)} questions for {assessment_type} assessment'
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


