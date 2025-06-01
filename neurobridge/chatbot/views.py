from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
import uuid
from .models import ChatSession, ChatMessage, BotPersonality, UserPreference, ChatFeedback
from .serializers import (
    ChatSessionSerializer, ChatMessageSerializer, BotPersonalitySerializer,
    UserPreferenceSerializer, ChatFeedbackSerializer
)

class ChatSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user, is_active=True)

    def perform_create(self, serializer):
        session_id = str(uuid.uuid4())
        serializer.save(user=self.request.user, session_id=session_id)

class ChatSessionDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)

class ChatMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        session_id = self.kwargs.get('session_id')
        try:
            session = ChatSession.objects.get(session_id=session_id, user=self.request.user)
            return session.messages.all()
        except ChatSession.DoesNotExist:
            return ChatMessage.objects.none()

    def perform_create(self, serializer):
        session_id = self.kwargs.get('session_id')
        try:
            session = ChatSession.objects.get(session_id=session_id, user=self.request.user)
            serializer.save(session=session)
            
            # Update session timestamp
            session.save()  # This will update the updated_at field
        except ChatSession.DoesNotExist:
            pass

class BotPersonalityListView(generics.ListAPIView):
    serializer_class = BotPersonalitySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = BotPersonality.objects.filter(is_active=True)

class UserPreferenceView(generics.RetrieveUpdateAPIView):
    serializer_class = UserPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        preference, created = UserPreference.objects.get_or_create(user=self.request.user)
        return preference

class ChatFeedbackCreateView(generics.CreateAPIView):
    serializer_class = ChatFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_message(request, session_id):
    """Send a message and get bot response"""
    try:
        session = ChatSession.objects.get(session_id=session_id, user=request.user)
    except ChatSession.DoesNotExist:
        return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)

    user_message = request.data.get('message', '')
    if not user_message:
        return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Save user message
    user_msg = ChatMessage.objects.create(
        session=session,
        message_type='user',
        content=user_message
    )

    # Generate bot response (simplified - you would integrate with actual AI service)
    bot_response = generate_bot_response(user_message, request.user)
    
    # Save bot response
    bot_msg = ChatMessage.objects.create(
        session=session,
        message_type='bot',
        content=bot_response
    )

    return Response({
        'user_message': ChatMessageSerializer(user_msg).data,
        'bot_response': ChatMessageSerializer(bot_msg).data
    })

def generate_bot_response(user_message, user):
    """Generate a bot response based on user message and context"""
    # This is a simplified response generator
    # In a real implementation, you would integrate with OpenAI, Claude, or other AI services
    
    user_type = user.user_type
    message_lower = user_message.lower()
    
    # Role-specific responses
    if user_type == 'student':
        if 'help' in message_lower or 'assistance' in message_lower:
            return "I'm here to help you with your learning journey! What specific topic would you like assistance with?"
        elif 'dyslexia' in message_lower:
            return "I understand you may have questions about dyslexia support. I can help you with reading strategies, study techniques, and accessibility features. What would you like to know?"
        elif 'homework' in message_lower or 'assignment' in message_lower:
            return "I can help you organize your assignments and break them down into manageable steps. Would you like help with a specific assignment?"
        else:
            return "I'm your learning companion! I can help with studying, assignments, dyslexia support, and learning strategies. How can I assist you today?"
    
    elif user_type == 'teacher':
        if 'student' in message_lower and 'progress' in message_lower:
            return "I can help you track student progress and identify students who might need additional support. Would you like to see analytics or specific student information?"
        elif 'dyslexia' in message_lower:
            return "I can provide information about dyslexia-friendly teaching strategies, accommodations, and resources. What specific aspect would you like to explore?"
        elif 'lesson' in message_lower or 'curriculum' in message_lower:
            return "I can assist with lesson planning and creating accessible content for neurodiverse learners. What subject or topic are you working on?"
        else:
            return "Hello! I'm here to support your teaching with insights about student progress, dyslexia-friendly strategies, and curriculum planning. How can I help?"
    
    # Default response
    return "Thank you for your message! I'm here to help with learning and accessibility support. Could you tell me more about what you need assistance with?"

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def end_session(request, session_id):
    """End a chat session"""
    try:
        session = ChatSession.objects.get(session_id=session_id, user=request.user)
        session.is_active = False
        session.save()
        return Response({'message': 'Session ended successfully'})
    except ChatSession.DoesNotExist:
        return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)
