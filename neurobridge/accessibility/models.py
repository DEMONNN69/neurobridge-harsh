from django.db import models
from django.conf import settings

class AccessibilitySettings(models.Model):
    DYSLEXIA_MODE_CHOICES = [
        ('none', 'None'),
        ('phonological', 'Phonological'),
        ('surface', 'Surface'),
        ('visual', 'Visual'),
    ]
    
    FONT_SIZE_CHOICES = [
        ('small', 'Small'),
        ('medium', 'Medium'),
        ('large', 'Large'),
    ]
    
    FONT_FAMILY_CHOICES = [
        ('default', 'Default'),
        ('opendyslexic', 'OpenDyslexic'),
        ('lexend', 'Lexend'),
    ]
    
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('high_contrast', 'High Contrast'),
        ('dyslexia_friendly', 'Dyslexia Friendly'),
    ]
    
    SPACING_CHOICES = [
        ('normal', 'Normal'),
        ('wide', 'Wide'),
        ('wider', 'Wider'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='accessibility_settings')
    
    # Dyslexia Support
    dyslexia_mode = models.CharField(max_length=20, choices=DYSLEXIA_MODE_CHOICES, default='none')
    syllable_highlighting = models.BooleanField(default=False)
    word_emphasis = models.BooleanField(default=False)
    
    # Visual Settings
    font_size = models.CharField(max_length=10, choices=FONT_SIZE_CHOICES, default='medium')
    font_family = models.CharField(max_length=20, choices=FONT_FAMILY_CHOICES, default='default')
    line_spacing = models.CharField(max_length=10, choices=SPACING_CHOICES, default='normal')
    letter_spacing = models.CharField(max_length=10, choices=SPACING_CHOICES, default='normal')
    
    # Theme and Colors
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default='light')
    custom_background_color = models.CharField(max_length=7, blank=True, null=True)
    custom_text_color = models.CharField(max_length=7, blank=True, null=True)
    
    # Audio Settings
    text_to_speech_enabled = models.BooleanField(default=False)
    speech_rate = models.FloatField(default=1.0, help_text="Speech rate multiplier")
    speech_volume = models.FloatField(default=1.0, help_text="Speech volume (0.0 to 1.0)")
    
    # Navigation and Interaction
    keyboard_navigation = models.BooleanField(default=False)
    reduced_motion = models.BooleanField(default=False)
    focus_indicators = models.BooleanField(default=True)
    
    # Reading Assistance
    reading_guide = models.BooleanField(default=False)
    text_highlighting = models.BooleanField(default=False)
    auto_scroll = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Accessibility Settings - {self.user.first_name} {self.user.last_name}"

class DyslexiaProfile(models.Model):
    READING_DIFFICULTY_CHOICES = [
        ('mild', 'Mild'),
        ('moderate', 'Moderate'),
        ('severe', 'Severe'),
    ]
    
    PROCESSING_SPEED_CHOICES = [
        ('slow', 'Slow'),
        ('average', 'Average'),
        ('fast', 'Fast'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dyslexia_profile')
    
    # Assessment Results
    phonological_awareness_score = models.PositiveIntegerField(blank=True, null=True)
    visual_processing_score = models.PositiveIntegerField(blank=True, null=True)
    working_memory_score = models.PositiveIntegerField(blank=True, null=True)
    processing_speed_score = models.PositiveIntegerField(blank=True, null=True)
    
    # Difficulty Areas
    reading_difficulty_level = models.CharField(max_length=10, choices=READING_DIFFICULTY_CHOICES, blank=True, null=True)
    spelling_difficulty = models.BooleanField(default=False)
    writing_difficulty = models.BooleanField(default=False)
    math_difficulty = models.BooleanField(default=False)
    
    # Strengths and Accommodations
    strengths = models.TextField(blank=True, null=True)
    recommended_accommodations = models.TextField(blank=True, null=True)
    
    # Progress Tracking
    assessment_date = models.DateField(blank=True, null=True)
    last_review_date = models.DateField(blank=True, null=True)
    next_review_date = models.DateField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Dyslexia Profile - {self.user.first_name} {self.user.last_name}"

class AccessibilityLog(models.Model):
    ACTION_CHOICES = [
        ('setting_changed', 'Setting Changed'),
        ('feature_used', 'Feature Used'),
        ('assistance_requested', 'Assistance Requested'),
        ('error_encountered', 'Error Encountered'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='accessibility_logs')
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    feature_name = models.CharField(max_length=100)
    old_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)
    context = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} - {self.action} - {self.feature_name}"

class SupportRequest(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    CATEGORY_CHOICES = [
        ('accessibility', 'Accessibility'),
        ('dyslexia_support', 'Dyslexia Support'),
        ('technical', 'Technical'),
        ('feature_request', 'Feature Request'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_requests')
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_support_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.first_name} {self.user.last_name}"
