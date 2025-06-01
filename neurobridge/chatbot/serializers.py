from rest_framework import serializers
from .models import ChatSession, ChatMessage, BotPersonality, UserPreference, ChatFeedback

class ChatSessionSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = '__all__'
        read_only_fields = ('user', 'session_id', 'created_at', 'updated_at')

    def get_message_count(self, obj):
        return obj.messages.count()

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ('created_at',)

class BotPersonalitySerializer(serializers.ModelSerializer):
    class Meta:
        model = BotPersonality
        fields = '__all__'
        read_only_fields = ('created_at',)

class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = '__all__'
        read_only_fields = ('user', 'updated_at')

class ChatFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatFeedback
        fields = '__all__'
        read_only_fields = ('user', 'created_at')
