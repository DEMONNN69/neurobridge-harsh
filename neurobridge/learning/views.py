from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Course, Lesson, Assignment, Submission, Enrollment, Progress
from .serializers import (
    CourseSerializer, LessonSerializer, AssignmentSerializer, 
    SubmissionSerializer, EnrollmentSerializer, ProgressSerializer
)

class CourseListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'teacher':
            return Course.objects.filter(teacher=self.request.user)
        elif self.request.user.user_type == 'student':
            enrolled_courses = Enrollment.objects.filter(
                student=self.request.user, is_active=True
            ).values_list('course', flat=True)
            return Course.objects.filter(id__in=enrolled_courses, is_active=True)
        return Course.objects.none()

    def perform_create(self, serializer):
        if self.request.user.user_type == 'teacher':
            serializer.save(teacher=self.request.user)

class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'teacher':
            return Course.objects.filter(teacher=self.request.user)
        elif self.request.user.user_type == 'student':
            enrolled_courses = Enrollment.objects.filter(
                student=self.request.user, is_active=True
            ).values_list('course', flat=True)
            return Course.objects.filter(id__in=enrolled_courses)
        return Course.objects.none()

class LessonListCreateView(generics.ListCreateAPIView):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course_id = self.kwargs.get('course_id')
        course = get_object_or_404(Course, id=course_id)
        
        # Check if user has access to this course
        if self.request.user.user_type == 'teacher' and course.teacher == self.request.user:
            return course.lessons.all()
        elif self.request.user.user_type == 'student':
            enrollment = Enrollment.objects.filter(
                student=self.request.user, course=course, is_active=True
            ).first()
            if enrollment:
                return course.lessons.all()
        return Lesson.objects.none()

class AssignmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course_id = self.kwargs.get('course_id')
        if course_id:
            course = get_object_or_404(Course, id=course_id)
            return Assignment.objects.filter(course=course)
        
        if self.request.user.user_type == 'teacher':
            return Assignment.objects.filter(teacher=self.request.user)
        elif self.request.user.user_type == 'student':
            enrolled_courses = Enrollment.objects.filter(
                student=self.request.user, is_active=True
            ).values_list('course', flat=True)
            return Assignment.objects.filter(course__in=enrolled_courses, status='published')
        return Assignment.objects.none()

    def perform_create(self, serializer):
        if self.request.user.user_type == 'teacher':
            course_id = self.kwargs.get('course_id')
            if course_id:
                course = get_object_or_404(Course, id=course_id, teacher=self.request.user)
                serializer.save(teacher=self.request.user, course=course)

class SubmissionListCreateView(generics.ListCreateAPIView):
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        assignment_id = self.kwargs.get('assignment_id')
        if assignment_id:
            assignment = get_object_or_404(Assignment, id=assignment_id)
            if self.request.user.user_type == 'teacher' and assignment.teacher == self.request.user:
                return assignment.submissions.all()
            elif self.request.user.user_type == 'student':
                return assignment.submissions.filter(student=self.request.user)
        
        if self.request.user.user_type == 'student':
            return Submission.objects.filter(student=self.request.user)
        elif self.request.user.user_type == 'teacher':
            return Submission.objects.filter(assignment__teacher=self.request.user)
        return Submission.objects.none()

    def perform_create(self, serializer):
        if self.request.user.user_type == 'student':
            assignment_id = self.kwargs.get('assignment_id')
            if assignment_id:
                assignment = get_object_or_404(Assignment, id=assignment_id)
                serializer.save(student=self.request.user, assignment=assignment)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def enroll_in_course(request, course_id):
    if request.user.user_type != 'student':
        return Response({'error': 'Only students can enroll in courses'}, status=status.HTTP_403_FORBIDDEN)
    
    course = get_object_or_404(Course, id=course_id, is_active=True)
    enrollment, created = Enrollment.objects.get_or_create(
        student=request.user,
        course=course,
        defaults={'is_active': True}
    )
    
    if not created and not enrollment.is_active:
        enrollment.is_active = True
        enrollment.save()
    
    return Response({'message': 'Successfully enrolled in course'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_progress(request, lesson_id):
    if request.user.user_type != 'student':
        return Response({'error': 'Only students can update progress'}, status=status.HTTP_403_FORBIDDEN)
    
    lesson = get_object_or_404(Lesson, id=lesson_id)
    
    # Check if student is enrolled in the course
    enrollment = Enrollment.objects.filter(
        student=request.user, course=lesson.course, is_active=True
    ).first()
    
    if not enrollment:
        return Response({'error': 'Not enrolled in this course'}, status=status.HTTP_403_FORBIDDEN)
    
    progress, created = Progress.objects.get_or_create(
        student=request.user,
        lesson=lesson
    )
    
    completion_percentage = request.data.get('completion_percentage', 0)
    time_spent = request.data.get('time_spent', 0)
    
    progress.completion_percentage = completion_percentage
    progress.time_spent += time_spent
    
    if completion_percentage >= 100 and not progress.is_completed:
        progress.is_completed = True
        progress.completed_at = timezone.now()
    
    progress.save()
    
    return Response(ProgressSerializer(progress).data, status=status.HTTP_200_OK)
