from rest_framework import serializers
from .models import (
    TaskCategory, AgeRange, DifficultyLevel, Question, 
    QuestionOption, AssessmentSession, StudentResponse, QuestionSet
)


class TaskCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskCategory
        fields = ['id', 'name', 'description', 'weight', 'is_active']


class AgeRangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgeRange
        fields = ['id', 'name', 'min_age', 'max_age', 'description']


class DifficultyLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = DifficultyLevel
        fields = ['id', 'name', 'description', 'order']


class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'is_correct', 'option_image', 'option_audio', 'order', 'explanation']
        read_only_fields = ['is_correct']  # Don't expose correct answers to frontend during assessment


class QuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    difficulty_name = serializers.CharField(source='difficulty_level.name', read_only=True)
    age_ranges = AgeRangeSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'title', 'question_text', 'question_type', 'category', 'category_name',
            'difficulty_level', 'difficulty_name', 'age_ranges', 'grade_levels',
            'image', 'audio_file', 'instructions', 'audio_instructions',
            'points', 'time_limit', 'options', 'additional_data'
        ]


class QuestionForAssessmentSerializer(serializers.ModelSerializer):
    """Serializer for questions during assessment - hides correct answers"""
    options = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    difficulty_name = serializers.CharField(source='difficulty_level.name', read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'title', 'question_text', 'question_type', 'category_name',
            'difficulty_name', 'image', 'audio_file', 'instructions', 
            'audio_instructions', 'points', 'time_limit', 'options', 'additional_data'
        ]
    
    def get_options(self, obj):
        """Return options without revealing correct answers"""
        options = obj.options.all()
        return [
            {
                'id': option.id,
                'option_text': option.option_text,
                'option_image': option.option_image.url if option.option_image else None,
                'option_audio': option.option_audio.url if option.option_audio else None,
                'order': option.order
            }
            for option in options
        ]


class StudentResponseSerializer(serializers.ModelSerializer):
    question_title = serializers.CharField(source='question.title', read_only=True)
    
    class Meta:
        model = StudentResponse
        fields = [
            'id', 'question', 'question_title', 'selected_option', 
            'text_response', 'response_data', 'time_taken_seconds', 
            'answered_at'
        ]
        read_only_fields = ['answered_at']


class AssessmentSessionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    responses = StudentResponseSerializer(many=True, read_only=True)
    
    class Meta:
        model = AssessmentSession
        fields = [
            'id', 'student', 'student_name', 'status', 'started_at', 
            'completed_at', 'total_time_seconds', 'total_score', 
            'max_possible_score', 'accuracy_percentage', 'risk_indicators',
            'pre_assessment_data', 'responses'
        ]
        read_only_fields = ['started_at', 'total_score', 'max_possible_score', 'accuracy_percentage']


class QuestionSetSerializer(serializers.ModelSerializer):
    target_age_ranges = AgeRangeSerializer(many=True, read_only=True)
    target_categories = TaskCategorySerializer(many=True, read_only=True)
    question_count = serializers.IntegerField(source='questions.count', read_only=True)
    
    class Meta:
        model = QuestionSet
        fields = [
            'id', 'name', 'description', 'target_age_ranges', 'target_categories',
            'is_active', 'randomize_questions', 'max_questions', 'question_count'
        ]
