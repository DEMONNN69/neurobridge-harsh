# quiz_generator/serializers.py
from rest_framework import serializers

class QuizGenerationRequestSerializer(serializers.Serializer):
    """Serializer for quiz generation request data."""
    
    condition = serializers.ChoiceField(
        choices=['dyslexia', 'autism', 'mixed'],
        default='mixed',
        help_text="The condition to generate questions for. 'mixed' generates both dyslexia and autism questions."
    )
    num_easy = serializers.IntegerField(
        min_value=0,
        default=2,
        help_text="Number of easy questions to generate"
    )
    num_moderate = serializers.IntegerField(
        min_value=0,
        default=4,
        help_text="Number of moderate questions to generate"
    )
    num_hard = serializers.IntegerField(
        min_value=0,
        default=4,
        help_text="Number of hard questions to generate"
    )

    def validate(self, data):
        """Custom validation to ensure at least one question is requested and not too many."""
        total_questions = data['num_easy'] + data['num_moderate'] + data['num_hard']
        
        if total_questions == 0:
            raise serializers.ValidationError(
                "At least one question must be requested (easy, moderate, or hard)."
            )
        
        if total_questions > 15:
            raise serializers.ValidationError(
                "Cannot request more than 15 questions in total."
            )
        
        return data

class QuestionSerializer(serializers.Serializer):
    """Serializer for individual quiz questions."""
    id = serializers.IntegerField()
    question_id = serializers.CharField()
    question = serializers.CharField()
    options = serializers.ListField(child=serializers.CharField())
    correct_answer = serializers.CharField()
    difficulty = serializers.ChoiceField(choices=['easy', 'moderate', 'hard'])
    condition = serializers.ChoiceField(choices=['dyslexia', 'autism'])
    explanation = serializers.CharField(required=False)

class AssessmentAnswerSerializer(serializers.Serializer):
    """Serializer for individual assessment answers."""
    question_id = serializers.CharField()
    selected_answer = serializers.CharField()
    is_correct = serializers.BooleanField()
    response_time = serializers.FloatField(required=False, default=0)

class QuestionTimingSerializer(serializers.Serializer):
    """Serializer for individual question timing data."""
    question_id = serializers.CharField()
    start_time = serializers.IntegerField()  # Timestamp in milliseconds
    end_time = serializers.IntegerField()    # Timestamp in milliseconds
    response_time = serializers.FloatField() # Time in seconds

class AssessmentSubmissionSerializer(serializers.Serializer):
    """Serializer for assessment submission data."""
    session_id = serializers.CharField(required=False)
    answers = serializers.ListField(child=AssessmentAnswerSerializer())
    total_questions = serializers.IntegerField(min_value=1)
    correct_answers = serializers.IntegerField(min_value=0)
    total_assessment_time = serializers.IntegerField(required=False, default=0)  # Total time in seconds
    question_timings = serializers.ListField(child=QuestionTimingSerializer(), required=False, default=list)
    
    def validate(self, data):
        """Validate that correct_answers is not greater than total_questions."""
        if data['correct_answers'] > data['total_questions']:
            raise serializers.ValidationError(
                "Correct answers cannot exceed total questions."
            )
        return data

class QuizGenerationResponseSerializer(serializers.Serializer):
    """Serializer for quiz generation response data."""
    questions = QuestionSerializer(many=True)
    total_questions = serializers.IntegerField()
    condition = serializers.CharField()
    generated_at = serializers.DateTimeField()
