from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404
from django.utils import timezone
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

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def save_pre_assessment_data(request):
    """
    Save pre-assessment form data to the user's StudentProfile.
    
    Expected request data:
    {
        "age": 18,
        "grade": "High School",
        "reading_level": "Developing reader",
        "primary_language": "English",
        "has_reading_difficulty": false,
        "needs_assistance": false,
        "previous_assessment": false
    }
    """
    # Check if user is a student
    if request.user.user_type != 'student':
        return Response({
            'error': 'Only students can save pre-assessment data'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get or create student profile
    student_profile, created = StudentProfile.objects.get_or_create(
        user=request.user,
        defaults={'student_id': f'STU{request.user.id:06d}'}
    )
    
    # Extract and validate data
    data = request.data
    try:
        # Update pre-assessment fields
        student_profile.age = data.get('age')
        student_profile.grade_level_detailed = data.get('grade')
        student_profile.reading_level = data.get('reading_level')
        student_profile.primary_language = data.get('primary_language', 'English')
        student_profile.has_reading_difficulty = data.get('has_reading_difficulty', False)
        student_profile.needs_assistance = data.get('needs_assistance', False)
        student_profile.previous_assessment = data.get('previous_assessment', False)
        student_profile.pre_assessment_completed = True
        student_profile.pre_assessment_date = timezone.now()
        
        student_profile.save()
        
        return Response({
            'message': 'Pre-assessment data saved successfully',
            'pre_assessment_completed': True,
            'data': {
                'age': student_profile.age,
                'grade': student_profile.grade_level_detailed,
                'reading_level': student_profile.reading_level,
                'primary_language': student_profile.primary_language,
                'has_reading_difficulty': student_profile.has_reading_difficulty,
                'needs_assistance': student_profile.needs_assistance,
                'previous_assessment': student_profile.previous_assessment,
                'completed_date': student_profile.pre_assessment_date
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to save pre-assessment data: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_pre_assessment_data(request):
    """
    Retrieve pre-assessment form data from the user's StudentProfile.
    
    Returns:
    {
        "pre_assessment_completed": true/false,
        "data": {
            "age": 18,
            "grade": "High School",
            "reading_level": "Developing reader",
            "primary_language": "English",
            "has_reading_difficulty": false,
            "needs_assistance": false,
            "previous_assessment": false,
            "completed_date": "2025-06-08T14:52:26Z"
        }
    }
    """
    # Check if user is a student
    if request.user.user_type != 'student':
        return Response({
            'error': 'Only students can access pre-assessment data'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Get student profile
        student_profile = StudentProfile.objects.get(user=request.user)
        
        return Response({
            'pre_assessment_completed': student_profile.pre_assessment_completed,
            'data': {
                'age': student_profile.age,
                'grade': student_profile.grade_level_detailed,
                'reading_level': student_profile.reading_level,
                'primary_language': student_profile.primary_language,
                'has_reading_difficulty': student_profile.has_reading_difficulty,
                'needs_assistance': student_profile.needs_assistance,
                'previous_assessment': student_profile.previous_assessment,
                'completed_date': student_profile.pre_assessment_date
            }
        }, status=status.HTTP_200_OK)
        
    except StudentProfile.DoesNotExist:
        # If no student profile exists, return default data
        return Response({
            'pre_assessment_completed': False,
            'data': {
                'age': None,
                'grade': None,
                'reading_level': None,
                'primary_language': 'English',
                'has_reading_difficulty': False,
                'needs_assistance': False,
                'previous_assessment': False,
                'completed_date': None
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'error': f'Failed to retrieve pre-assessment data: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
