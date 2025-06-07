# quiz_generator/serializers.py
from rest_framework import serializers

class QuizGenerationRequestSerializer(serializers.Serializer):
    """Serializer for quiz generation request data."""
    
    condition = serializers.ChoiceField(
        choices=['dyslexia', 'autism', 'mixed'],
        default='mixed',
        required=False,
        help_text="The condition to generate questions for. 'mixed' generates both dyslexia and autism questions."
    )
    num_easy = serializers.IntegerField(
        min_value=0,
        default=2,
        required=False,
        help_text="Number of easy questions to generate"
    )
    num_moderate = serializers.IntegerField(
        min_value=0,
        default=4,
        required=False,
        help_text="Number of moderate questions to generate"
    )
    num_hard = serializers.IntegerField(
        min_value=0,
        default=4,
        required=False,
        help_text="Number of hard questions to generate"
    )
    assessment_type = serializers.ChoiceField(
        choices=['dyslexia', 'autism', 'both'],
        default='both',
        required=False,
        help_text="Type of assessment chosen by user"
    )
    
    # Pre-assessment data fields
    age = serializers.IntegerField(
        min_value=3,
        max_value=100,
        required=False,
        help_text="Student's age"
    )
    grade = serializers.CharField(
        max_length=50,
        required=False,
        help_text="Student's grade level"
    )
    reading_level = serializers.CharField(
        max_length=100,
        required=False,
        help_text="Student's reading proficiency level"
    )
    primary_language = serializers.CharField(
        max_length=50,
        default='English',
        required=False,
        help_text="Student's primary language"
    )
    has_reading_difficulty = serializers.BooleanField(
        default=False,
        required=False,
        help_text="Whether student has difficulty reading"
    )
    needs_assistance = serializers.BooleanField(
        default=False,
        required=False,
        help_text="Whether student may need assistance during assessment"
    )
    previous_assessment = serializers.BooleanField(
        default=False,
        required=False,
        help_text="Whether student has taken similar assessment before"
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
    
    def get_customized_difficulty_distribution(self):
        """
        Adjust difficulty distribution based on pre-assessment data.
        Returns a dictionary with customized question counts.
        """
        data = self.validated_data
        age = data.get('age', 10)
        reading_level = data.get('reading_level', '')
        has_reading_difficulty = data.get('has_reading_difficulty', False)
        assessment_type = data.get('assessment_type', 'both')
        
        # Base question counts
        if assessment_type in ['dyslexia', 'autism']:
            base_total = 10
        else:  # both
            base_total = 20
        
        # Adjust difficulty based on age and reading level
        if age < 7 or reading_level in ['Cannot read yet', 'Beginning reader (simple words)']:
            # More easy questions for young children or non-readers
            if base_total == 10:
                return {'easy': 6, 'moderate': 3, 'hard': 1}
            else:  # 20 questions
                return {'easy': 12, 'moderate': 6, 'hard': 2}
        
        elif age < 12 or reading_level == 'Early reader (simple sentences)':
            # Slightly easier distribution for younger students
            if base_total == 10:
                return {'easy': 4, 'moderate': 4, 'hard': 2}
            else:  # 20 questions
                return {'easy': 8, 'moderate': 8, 'hard': 4}
        
        elif has_reading_difficulty:
            # More easy and moderate questions for students with reading difficulties
            if base_total == 10:
                return {'easy': 4, 'moderate': 5, 'hard': 1}
            else:  # 20 questions
                return {'easy': 8, 'moderate': 10, 'hard': 2}
        
        else:
            # Standard distribution for typical students
            if base_total == 10:
                return {'easy': 3, 'moderate': 4, 'hard': 3}
            else:  # 20 questions
                return {'easy': 6, 'moderate': 8, 'hard': 6}
    
    def should_use_visual_assessment(self):
        """
        Determine if visual/interactive assessment should be recommended.
        """
        data = self.validated_data
        age = data.get('age', 10)
        reading_level = data.get('reading_level', '')
        
        return (age < 7 or 
                reading_level in ['Cannot read yet', 'Beginning reader (simple words)'] or
                data.get('needs_assistance', False))

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
    assessment_type = serializers.ChoiceField(
        choices=['dyslexia', 'autism', 'both'],
        default='both',
        required=False,
        help_text="Type of assessment chosen by user"
    )
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
