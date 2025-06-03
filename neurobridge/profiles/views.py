from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
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
            raise NotFound("Profile not found for non-student users")
        try:
            profile = StudentProfile.objects.get(user=self.request.user)
            return profile
        except StudentProfile.DoesNotExist:
            raise NotFound("Student profile not found. Please complete the assessment first.")

class TeacherProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = TeacherProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        if self.request.user.user_type != 'teacher':
            raise NotFound("Profile not found for non-teacher users")
        try:
            profile = TeacherProfile.objects.get(user=self.request.user)
            return profile
        except TeacherProfile.DoesNotExist:
            raise NotFound("Teacher profile not found. Please complete the profile setup first.")

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

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def teacher_profile_completion_status(request):
    """Check if teacher has completed their profile setup"""
    if request.user.user_type != 'teacher':
        return Response({'error': 'Only teachers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        teacher_profile = TeacherProfile.objects.get(user=request.user)
        
        # Check if required fields are completed
        required_fields = ['employee_id', 'department', 'specialization']
        completed = all(getattr(teacher_profile, field) for field in required_fields)
        completed = completed and teacher_profile.years_of_experience is not None
        
        return Response({
            'completed': completed,
            'profile': TeacherProfileSerializer(teacher_profile).data if completed else None
        })
    except TeacherProfile.DoesNotExist:
        # If no teacher profile exists, profile is not completed
        return Response({
            'completed': False,
            'profile': None
        })
