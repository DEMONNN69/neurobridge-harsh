from django.db import models
from django.conf import settings
import uuid

class AssessmentQuestion(models.Model):
    """Model to store generated questions with their metadata"""
    CONDITION_CHOICES = [
        ('dyslexia', 'Dyslexia'),
        ('autism', 'Autism'),
    ]
    
    question_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    question_text = models.TextField()
    options = models.JSONField()  # Store options as JSON array
    correct_answer = models.CharField(max_length=1)  # A, B, C, or D
    condition_type = models.CharField(max_length=20, choices=CONDITION_CHOICES)
    difficulty_level = models.CharField(max_length=20, default='medium')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.condition_type} - {self.question_text[:50]}..."

class AssessmentSession(models.Model):
    """Model to store assessment session data"""
    DYSLEXIC_TYPE_CHOICES = [
        ('phonological', 'Phonological Dyslexia'),
        ('surface', 'Surface Dyslexia'),
        ('mixed', 'Mixed Dyslexia'),
        ('rapid_naming', 'Rapid Naming Deficit'),
        ('double_deficit', 'Double Deficit'),    ]
    
    SEVERITY_CHOICES = [
        ('mild', 'Mild'),
        ('moderate', 'Moderate'),
        ('severe', 'Severe'),
    ]
    
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    total_questions = models.IntegerField()
    correct_answers = models.IntegerField()
    accuracy_percentage = models.FloatField()
    total_assessment_time = models.IntegerField(default=0)  # Total time in seconds
    
    # AI model will analyze these later
    predicted_dyslexic_type = models.CharField(max_length=30, choices=DYSLEXIC_TYPE_CHOICES, null=True, blank=True)
    predicted_severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.accuracy_percentage}% ({self.created_at})"

class AssessmentResponse(models.Model):
    """Model to store individual question responses"""
    session = models.ForeignKey(AssessmentSession, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(AssessmentQuestion, on_delete=models.CASCADE)
    user_answer = models.CharField(max_length=1)  # A, B, C, or D
    is_correct = models.BooleanField()
    response_time = models.FloatField(null=True, blank=True)  # Time taken to answer in seconds
    
    class Meta:
        unique_together = ['session', 'question']
    
    def __str__(self):
        return f"{self.session.user.username} - Q{self.question.question_id} - {'✓' if self.is_correct else '✗'}"

class QuestionTiming(models.Model):
    """Model to store detailed timing information for each question"""
    session = models.ForeignKey(AssessmentSession, on_delete=models.CASCADE, related_name='question_timings')
    question = models.ForeignKey(AssessmentQuestion, on_delete=models.CASCADE)
    start_time = models.BigIntegerField()  # Timestamp in milliseconds
    end_time = models.BigIntegerField()    # Timestamp in milliseconds
    response_time = models.FloatField()    # Time in seconds
    
    class Meta:
        unique_together = ['session', 'question']
    
    def __str__(self):
        return f"{self.session.user.username} - Q{self.question.question_id} - {self.response_time}s"
