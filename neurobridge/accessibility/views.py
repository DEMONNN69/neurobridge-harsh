from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from .models import AccessibilitySettings, DyslexiaProfile, AccessibilityLog, SupportRequest
from .serializers import (
    AccessibilitySettingsSerializer, DyslexiaProfileSerializer,
    AccessibilityLogSerializer, SupportRequestSerializer
)

class AccessibilitySettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = AccessibilitySettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        settings, created = AccessibilitySettings.objects.get_or_create(user=self.request.user)
        return settings

    def perform_update(self, serializer):
        # Log the accessibility setting change
        old_settings = AccessibilitySettings.objects.get(user=self.request.user)
        new_settings = serializer.save()
        
        # Log changes for analytics
        AccessibilityLog.objects.create(
            user=self.request.user,
            action='setting_changed',
            feature_name='accessibility_settings',
            old_value=str(old_settings.__dict__),
            new_value=str(new_settings.__dict__)
        )

class DyslexiaProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = DyslexiaProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = DyslexiaProfile.objects.get_or_create(user=self.request.user)
        return profile

class AccessibilityLogListView(generics.ListAPIView):
    serializer_class = AccessibilityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AccessibilityLog.objects.filter(user=self.request.user).order_by('-timestamp')

class SupportRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = SupportRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'teacher':
            # Teachers can see all support requests
            return SupportRequest.objects.all().order_by('-created_at')
        else:
            # Students can only see their own support requests
            return SupportRequest.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SupportRequestDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = SupportRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'teacher':
            return SupportRequest.objects.all()
        else:
            return SupportRequest.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'resolved' and not instance.resolved_at:
            instance.resolved_at = timezone.now()
            instance.save()

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def log_accessibility_action(request):
    """Log accessibility feature usage for analytics"""
    action = request.data.get('action')
    feature_name = request.data.get('feature_name')
    context = request.data.get('context', {})
    
    if not action or not feature_name:
        return Response({'error': 'action and feature_name are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    AccessibilityLog.objects.create(
        user=request.user,
        action=action,
        feature_name=feature_name,
        context=context
    )
    
    return Response({'message': 'Action logged successfully'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def accessibility_recommendations(request):
    """Get personalized accessibility recommendations based on user profile and usage"""
    try:
        settings = AccessibilitySettings.objects.get(user=request.user)
        dyslexia_profile = DyslexiaProfile.objects.get(user=request.user)
    except (AccessibilitySettings.DoesNotExist, DyslexiaProfile.DoesNotExist):
        return Response({'recommendations': []})
    
    recommendations = []
    
    # Dyslexia-specific recommendations
    if dyslexia_profile.dyslexia_type and dyslexia_profile.dyslexia_type != 'none':
        if not settings.syllable_highlighting:
            recommendations.append({
                'type': 'feature_suggestion',
                'title': 'Enable Syllable Highlighting',
                'description': 'Based on your dyslexia profile, syllable highlighting can improve reading comprehension.',
                'action': 'enable_syllable_highlighting'
            })
        
        if settings.font_family == 'default':
            recommendations.append({
                'type': 'feature_suggestion',
                'title': 'Try Dyslexia-Friendly Fonts',
                'description': 'OpenDyslexic or Lexend fonts are designed to improve readability for dyslexic users.',
                'action': 'change_font_family'
            })
    
    # General accessibility recommendations
    if not settings.text_to_speech_enabled:
        recommendations.append({
            'type': 'feature_suggestion',
            'title': 'Enable Text-to-Speech',
            'description': 'Audio support can help with reading comprehension and reduce eye strain.',
            'action': 'enable_text_to_speech'
        })
    
    return Response({'recommendations': recommendations})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def accessibility_analytics(request):
    """Get accessibility usage analytics for the current user"""
    if request.user.user_type != 'teacher':
        return Response({'error': 'Only teachers can access analytics'}, status=status.HTTP_403_FORBIDDEN)
    
    # Get aggregated accessibility usage data
    logs = AccessibilityLog.objects.all()
    
    feature_usage = {}
    for log in logs:
        if log.feature_name not in feature_usage:
            feature_usage[log.feature_name] = 0
        feature_usage[log.feature_name] += 1
    
    analytics_data = {
        'total_logs': logs.count(),
        'feature_usage': feature_usage,
        'most_used_features': sorted(feature_usage.items(), key=lambda x: x[1], reverse=True)[:10]
    }
    
    return Response(analytics_data)
