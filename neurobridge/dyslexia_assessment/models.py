from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import json

User = get_user_model()


class TaskCategory(models.Model):
    """
    Categories for different types of dyslexia assessment tasks
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    # Clinical information
    clinical_significance = models.TextField(
        blank=True,
        help_text="What this category measures clinically"
    )
    
    # Scoring weight for this category in overall assessment
    weight = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=1.00,
        validators=[MinValueValidator(0.1), MaxValueValidator(5.0)],
        help_text="Weight of this category in overall scoring (0.1-5.0)"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Task Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class AgeRange(models.Model):
    """
    Age ranges for targeting questions appropriately
    """
    name = models.CharField(max_length=50, unique=True)  # e.g., "6-8 years", "9-11 years"
    min_age = models.PositiveIntegerField()
    max_age = models.PositiveIntegerField()
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['min_age']
    
    def __str__(self):
        return self.name
    
    def clean(self):
        if self.min_age > self.max_age:
            raise ValueError("Minimum age cannot be greater than maximum age")


class DifficultyLevel(models.Model):
    """
    Difficulty levels for questions
    """
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    name = models.CharField(max_length=20, choices=LEVEL_CHOICES, unique=True)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)  # For ordering difficulty levels
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.get_name_display()


class Question(models.Model):
    """
    Individual assessment questions
    """
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('text_response', 'Open Text Response'),
        ('sequencing', 'Sequencing/Ordering'),
        ('matching', 'Matching'),
        ('audio_response', 'Audio Response'),  # For future use
    ]
    
    # Basic question information
    title = models.CharField(max_length=200, help_text="Brief title for admin reference")
    question_text = models.TextField(help_text="The main question text")
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    
    # Categorization
    category = models.ForeignKey(TaskCategory, on_delete=models.CASCADE, related_name='questions')
    age_ranges = models.ManyToManyField(AgeRange, blank=True)
    difficulty_level = models.ForeignKey(DifficultyLevel, on_delete=models.CASCADE)
    grade_levels = models.CharField(
        max_length=50, 
        blank=True,
        help_text="e.g., 'K-2', '3-5', '6-8'"
    )
    
    # Media files
    image = models.ImageField(upload_to='assessment_images/', blank=True, null=True)
    audio_file = models.FileField(upload_to='assessment_audio/', blank=True, null=True)
    
    # Instructions and help
    instructions = models.TextField(
        blank=True,
        help_text="Special instructions for this question"
    )
    audio_instructions = models.FileField(
        upload_to='instruction_audio/', 
        blank=True, 
        null=True,
        help_text="Audio version of instructions"
    )
    
    # Scoring information
    points = models.PositiveIntegerField(
        default=1,
        help_text="Points awarded for correct answer"
    )
    time_limit = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Time limit in seconds (optional)"
    )
    
    # Metadata
    is_active = models.BooleanField(default=True)
    is_published = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional data for complex question types
    additional_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Extra data for sequencing, matching, etc."
    )
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_question_type_display()})"
    
    @property
    def has_multiple_choice_options(self):
        """Check if this question has multiple choice options"""
        return self.question_type in ['multiple_choice', 'true_false']
    
    @property
    def correct_options(self):
        """Get all correct options for this question"""
        if self.has_multiple_choice_options:
            return self.options.filter(is_correct=True)
        return None


class QuestionOption(models.Model):
    """
    Multiple choice options for questions
    """
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    option_text = models.TextField()
    is_correct = models.BooleanField(default=False)
    
    # Optional media for the option
    option_image = models.ImageField(upload_to='option_images/', blank=True, null=True)
    option_audio = models.FileField(upload_to='option_audio/', blank=True, null=True)
    
    # For ordering options
    order = models.PositiveIntegerField(default=1)
    
    # Explanation for why this option is correct/incorrect
    explanation = models.TextField(blank=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        status = "✓" if self.is_correct else "✗"
        return f"{status} {self.option_text[:50]}..."


class AssessmentSession(models.Model):
    """
    Individual assessment sessions/attempts by students
    """
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dyslexia_sessions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    
    # Session information
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    total_time_seconds = models.PositiveIntegerField(null=True, blank=True)
    
    # Questions included in this session
    questions = models.ManyToManyField(Question, through='StudentResponse')
    
    # Overall results
    total_score = models.PositiveIntegerField(default=0)
    max_possible_score = models.PositiveIntegerField(default=0)
    accuracy_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    
    # Clinical indicators
    risk_indicators = models.JSONField(
        default=dict,
        blank=True,
        help_text="Risk indicators by category"
    )
    
    # Pre-assessment data that influenced question selection
    pre_assessment_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Age, grade, reading level, etc."
    )
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.student.username} - {self.started_at.strftime('%Y-%m-%d %H:%M')}"
    
    def calculate_results(self):
        """Calculate and update session results"""
        responses = self.responses.all()
        total_score = sum(r.score_earned for r in responses)
        max_score = sum(r.question.points for r in responses)
        
        self.total_score = total_score
        self.max_possible_score = max_score
        self.accuracy_percentage = (total_score / max_score * 100) if max_score > 0 else 0
        
        # Calculate category-wise performance
        category_performance = {}
        for response in responses:
            category = response.question.category.name
            if category not in category_performance:
                category_performance[category] = {'correct': 0, 'total': 0}
            
            category_performance[category]['total'] += 1
            if response.is_correct:
                category_performance[category]['correct'] += 1
        
        # Calculate risk indicators based on performance thresholds
        risk_indicators = {}
        for category, perf in category_performance.items():
            accuracy = perf['correct'] / perf['total'] if perf['total'] > 0 else 0
            
            # Clinical thresholds (can be adjusted)
            if accuracy < 0.4:  # Less than 40% accuracy
                risk_indicators[category] = 'high_risk'
            elif accuracy < 0.6:  # Less than 60% accuracy
                risk_indicators[category] = 'moderate_risk'
            else:
                risk_indicators[category] = 'low_risk'
        
        self.risk_indicators = risk_indicators
        self.save()


class StudentResponse(models.Model):
    """
    Individual student responses to questions
    """
    session = models.ForeignKey(AssessmentSession, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    
    # Response data
    selected_option = models.ForeignKey(
        QuestionOption, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        help_text="For multiple choice questions"
    )
    text_response = models.TextField(
        blank=True,
        help_text="For open-ended questions"
    )
    response_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="For complex responses (sequencing, matching, etc.)"
    )
    
    # Timing and scoring
    time_taken_seconds = models.PositiveIntegerField(null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    score_earned = models.PositiveIntegerField(default=0)
    
    # Automatic scoring for objective questions
    auto_scored = models.BooleanField(default=False)
    
    # Manual review for subjective questions
    needs_review = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_responses'
    )
    review_notes = models.TextField(blank=True)
    
    # Timestamps
    answered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['session', 'question']
        ordering = ['answered_at']
    
    def __str__(self):
        return f"{self.session.student.username} - {self.question.title}"
    
    def save(self, *args, **kwargs):
        """Auto-score objective questions when saved"""
        if not self.auto_scored and self.question.question_type in ['multiple_choice', 'true_false']:
            if self.selected_option and self.selected_option.is_correct:
                self.is_correct = True
                self.score_earned = self.question.points
            else:
                self.is_correct = False
                self.score_earned = 0
            self.auto_scored = True
        
        # Mark subjective questions for review
        if self.question.question_type in ['text_response', 'sequencing', 'matching']:
            self.needs_review = True
        
        super().save(*args, **kwargs)


class QuestionSet(models.Model):
    """
    Predefined sets of questions for specific assessment purposes
    """
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    questions = models.ManyToManyField(Question, blank=True)
    
    # Targeting
    target_age_ranges = models.ManyToManyField(AgeRange, blank=True)
    target_categories = models.ManyToManyField(TaskCategory, blank=True)
    
    # Configuration
    is_active = models.BooleanField(default=True)
    randomize_questions = models.BooleanField(default=True)
    max_questions = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Maximum number of questions to include (leave blank for all)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def get_questions_for_student(self, student_profile):
        """Get appropriate questions for a specific student"""
        # This method can be implemented to intelligently select
        # questions based on student's age, grade, previous performance, etc.
        questions = self.questions.filter(is_active=True, is_published=True)
        
        # Add logic here for intelligent question selection
        # based on student_profile data
        
        if self.randomize_questions:
            questions = questions.order_by('?')  # Random order
        
        if self.max_questions:
            questions = questions[:self.max_questions]
        
        return questions
