from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import UserProfile, StudentProfile, TeacherProfile, Achievement
from .serializers import UserProfileSerializer, StudentProfileSerializer, TeacherProfileSerializer, AchievementSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

class StudentProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        if self.request.user.user_type != 'student':
            return None
        profile, created = StudentProfile.objects.get_or_create(user=self.request.user)
        return profile

class TeacherProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = TeacherProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        if self.request.user.user_type != 'teacher':
            return None
        profile, created = TeacherProfile.objects.get_or_create(user=self.request.user)
        return profile

class StudentAchievementsView(generics.ListCreateAPIView):
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'student':
            return Achievement.objects.filter(student=self.request.user)
        elif self.request.user.user_type == 'teacher':
            return Achievement.objects.filter(awarded_by=self.request.user)
        return Achievement.objects.none()

    def perform_create(self, serializer):
        if self.request.user.user_type == 'teacher':
            serializer.save(awarded_by=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def student_dashboard_stats(request):
    if request.user.user_type != 'student':
        return Response({'error': 'Only students can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    achievements = Achievement.objects.filter(student=request.user)
    total_points = sum(achievement.points for achievement in achievements)
    
    stats = {
        'total_achievements': achievements.count(),
        'total_points': total_points,
        'recent_achievements': AchievementSerializer(achievements.order_by('-earned_date')[:5], many=True).data
    }
    
    return Response(stats)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def student_assessment_status(request):
    """Check if student has completed the assessment"""
    if request.user.user_type != 'student':
        return Response({'error': 'Only students can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        student_profile = StudentProfile.objects.get(user=request.user)
        completed = student_profile.assessment_score is not None
        
        return Response({
            'completed': completed,
            'assessment_score': student_profile.assessment_score if completed else None
        })
    except StudentProfile.DoesNotExist:
        # If no student profile exists, assessment is not completed
        return Response({
            'completed': False,
            'assessment_score': None
        })
