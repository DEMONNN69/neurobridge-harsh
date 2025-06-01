from django.db import models
from django.conf import settings

class ChatSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_sessions')
    session_id = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=200, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat Session - {self.user.first_name} {self.user.last_name} ({self.session_id})"

class ChatMessage(models.Model):
    MESSAGE_TYPE_CHOICES = [
        ('user', 'User Message'),
        ('bot', 'Bot Response'),
        ('system', 'System Message'),
    ]
    
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPE_CHOICES)
    content = models.TextField()
    audio_url = models.URLField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.message_type.title()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class BotPersonality(models.Model):
    PERSONALITY_TYPE_CHOICES = [
        ('tutor', 'Academic Tutor'),
        ('companion', 'Learning Companion'),
        ('counselor', 'Academic Counselor'),
        ('motivator', 'Motivational Coach'),
    ]
    
    name = models.CharField(max_length=100)
    personality_type = models.CharField(max_length=20, choices=PERSONALITY_TYPE_CHOICES)
    description = models.TextField()
    avatar_url = models.URLField(blank=True, null=True)
    system_prompt = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.personality_type})"

class UserPreference(models.Model):
    COMMUNICATION_STYLE_CHOICES = [
        ('formal', 'Formal'),
        ('casual', 'Casual'),
        ('encouraging', 'Encouraging'),
        ('direct', 'Direct'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_preferences')
    preferred_personality = models.ForeignKey(BotPersonality, on_delete=models.SET_NULL, null=True, blank=True)
    communication_style = models.CharField(max_length=20, choices=COMMUNICATION_STYLE_CHOICES, default='encouraging')
    enable_audio_response = models.BooleanField(default=False)
    enable_speech_recognition = models.BooleanField(default=False)
    response_speed = models.CharField(max_length=10, choices=[('slow', 'Slow'), ('normal', 'Normal'), ('fast', 'Fast')], default='normal')
    language_preference = models.CharField(max_length=10, default='en')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Chat Preferences - {self.user.first_name} {self.user.last_name}"

class ChatFeedback(models.Model):
    FEEDBACK_TYPE_CHOICES = [
        ('helpful', 'Helpful'),
        ('not_helpful', 'Not Helpful'),
        ('inappropriate', 'Inappropriate'),
        ('error', 'Error'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_feedback')
    message = models.ForeignKey(ChatMessage, on_delete=models.CASCADE, related_name='feedback')
    feedback_type = models.CharField(max_length=20, choices=FEEDBACK_TYPE_CHOICES)
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)], blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.feedback_type.title()} - {self.user.first_name} {self.user.last_name}"
