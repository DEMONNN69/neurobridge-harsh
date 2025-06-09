from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, PermissionDenied
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
from .models import Classroom, ClassroomMembership
from .serializers import (
    ClassroomSerializer, ClassroomMembershipSerializer, 
    JoinClassroomSerializer, ClassroomRosterSerializer
)
from profiles.models import StudentProfile, TeacherProfile


# Teacher Views
class TeacherClassroomListView(generics.ListAPIView):
    """List classrooms for the authenticated teacher"""
    serializer_class = ClassroomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.user_type != 'teacher':
            raise PermissionDenied("Only teachers can access this endpoint.")
        
        try:
            teacher_profile = self.request.user.teacher_profile
            return Classroom.objects.filter(teacher=teacher_profile, is_archived=False)
        except TeacherProfile.DoesNotExist:
            return Classroom.objects.none()


class ClassroomCreateView(generics.CreateAPIView):
    """Create a new classroom (teachers only)"""
    serializer_class = ClassroomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.user_type != 'teacher':
            raise PermissionDenied("Only teachers can create classrooms.")
        
        try:
            teacher_profile = self.request.user.teacher_profile
            serializer.save(teacher=teacher_profile)
        except TeacherProfile.DoesNotExist:
            raise PermissionDenied("Teacher profile not found. Please complete your profile setup.")


class ClassroomUpdateView(generics.UpdateAPIView):
    """Update a classroom (teachers only)"""
    serializer_class = ClassroomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type != 'teacher':
            raise PermissionDenied("Only teachers can update classrooms.")
        
        try:
            teacher_profile = self.request.user.teacher_profile
            return Classroom.objects.filter(teacher=teacher_profile)
        except TeacherProfile.DoesNotExist:
            return Classroom.objects.none()


class ClassroomDeleteView(generics.DestroyAPIView):
    """Delete/archive a classroom (teachers only)"""
    serializer_class = ClassroomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type != 'teacher':
            raise PermissionDenied("Only teachers can delete classrooms.")
        
        try:
            teacher_profile = self.request.user.teacher_profile
            return Classroom.objects.filter(teacher=teacher_profile)
        except TeacherProfile.DoesNotExist:
            return Classroom.objects.none()

    def destroy(self, request, *args, **kwargs):
        # Instead of deleting, we archive the classroom
        classroom = self.get_object()
        classroom.is_archived = True
        classroom.save()
        return Response({'message': 'Classroom successfully deleted.'}, status=status.HTTP_200_OK)


class ClassroomStudentsView(generics.ListAPIView):
    """Get students in a classroom (teachers only)"""
    serializer_class = ClassroomRosterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        if self.request.user.user_type != 'teacher':
            raise PermissionDenied("Only teachers can view classroom students.")
        
        try:
            teacher_profile = self.request.user.teacher_profile
            classroom_id = self.kwargs['pk']
            return get_object_or_404(Classroom, id=classroom_id, teacher=teacher_profile)
        except TeacherProfile.DoesNotExist:
            raise PermissionDenied("Teacher profile not found.")

    def list(self, request, *args, **kwargs):
        classroom = self.get_object()
        memberships = ClassroomMembership.objects.filter(
            classroom=classroom, is_active=True
        ).select_related('student__user')
        
        students_data = []
        for membership in memberships:
            student_data = {
                'id': membership.student.id,
                'student_id': membership.student.student_id,
                'student_name': f"{membership.student.user.first_name} {membership.student.user.last_name}",
                'email': membership.student.user.email,
                'joined_at': membership.joined_at,
                'is_active': membership.is_active,
                'assessment_score': membership.student.assessment_score,
                'dyslexia_type': membership.student.dyslexia_type,
                'autism_score': membership.student.autism_score,
            }
            students_data.append(student_data)
        
        return Response(students_data)


# Student Views
class StudentClassroomListView(generics.ListAPIView):
    """List classrooms for the authenticated student"""
    serializer_class = ClassroomMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type != 'student':
            raise PermissionDenied("Only students can access this endpoint.")
        
        try:
            student_profile = self.request.user.student_profile
            return ClassroomMembership.objects.filter(
                student=student_profile, is_active=True
            ).select_related('classroom__teacher__user')
        except StudentProfile.DoesNotExist:
            return ClassroomMembership.objects.none()


# Shared Views
class ClassroomDetailView(generics.RetrieveAPIView):
    """Retrieve details of a specific classroom"""
    serializer_class = ClassroomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'teacher':
            try:
                teacher_profile = self.request.user.teacher_profile
                return Classroom.objects.filter(teacher=teacher_profile)
            except TeacherProfile.DoesNotExist:
                return Classroom.objects.none()
        elif self.request.user.user_type == 'student':
            # Students can view classrooms they're in
            try:
                student_profile = self.request.user.student_profile
                classroom_ids = ClassroomMembership.objects.filter(
                    student=student_profile, is_active=True
                ).values_list('classroom_id', flat=True)
                return Classroom.objects.filter(id__in=classroom_ids)
            except StudentProfile.DoesNotExist:
                return Classroom.objects.none()
        return Classroom.objects.none()


class ClassroomMembersView(generics.ListAPIView):
    """Get all members of a classroom (students and teacher can access)"""
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        classroom_id = self.kwargs['pk']
        classroom = get_object_or_404(Classroom, id=classroom_id)
        
        # Check if user has access to this classroom
        if self.request.user.user_type == 'teacher':
            try:
                teacher_profile = self.request.user.teacher_profile
                if classroom.teacher != teacher_profile:
                    raise PermissionDenied("You don't have access to this classroom.")
            except TeacherProfile.DoesNotExist:
                raise PermissionDenied("Teacher profile not found.")
        elif self.request.user.user_type == 'student':
            try:
                student_profile = self.request.user.student_profile
                if not ClassroomMembership.objects.filter(
                    classroom=classroom, student=student_profile, is_active=True
                ).exists():
                    raise PermissionDenied("You are not a member of this classroom.")
            except StudentProfile.DoesNotExist:
                raise PermissionDenied("Student profile not found.")
        else:
            raise PermissionDenied("Invalid user type.")
        
        return classroom

    def list(self, request, *args, **kwargs):
        classroom = self.get_object()
        memberships = ClassroomMembership.objects.filter(
            classroom=classroom, is_active=True
        ).select_related('student__user')
        
        members_data = []
        for membership in memberships:
            member_data = {
                'id': membership.student.id,
                'student_id': membership.student.student_id,
                'student_name': f"{membership.student.user.first_name} {membership.student.user.last_name}",
                'email': membership.student.user.email,
                'joined_at': membership.joined_at,
                'is_active': membership.is_active,
                'assessment_score': membership.student.assessment_score,
                'dyslexia_type': membership.student.dyslexia_type,
                'autism_score': membership.student.autism_score,            }
            members_data.append(member_data)
        
        return Response(members_data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_classroom(request):
    """Allow a student to join a classroom using a join code"""
    if request.user.user_type != 'student':
        return Response(
            {'error': 'Only students can join classrooms.'}, 
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        student_profile = request.user.student_profile
    except StudentProfile.DoesNotExist:
        return Response(
            {'error': 'Student profile not found. Please complete your profile setup.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = JoinClassroomSerializer(data=request.data)
    if serializer.is_valid():
        join_code = serializer.validated_data['join_code']
        
        try:
            classroom = Classroom.objects.get(join_code=join_code)
              # Check if student is already in this classroom
            existing_membership = ClassroomMembership.objects.filter(
                classroom=classroom, student=student_profile
            ).first()
            
            if existing_membership:
                if existing_membership.is_active:
                    return Response(
                        {'error': 'You are already a member of this classroom.'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                else:
                    # Reactivate membership
                    existing_membership.is_active = True
                    existing_membership.save()
                    return Response({
                        'message': 'Successfully rejoined classroom.',
                        'classroom': ClassroomSerializer(classroom).data,
                        'membership': ClassroomMembershipSerializer(existing_membership).data
                    })
            else:
                # Create new membership
                new_membership = ClassroomMembership.objects.create(
                    classroom=classroom,
                    student=student_profile,
                    is_active=True
                )
                return Response({
                    'message': 'Successfully joined classroom.',
                    'classroom': ClassroomSerializer(classroom).data,
                    'membership': ClassroomMembershipSerializer(new_membership).data
                })
                
        except Classroom.DoesNotExist:
            return Response(
                {'error': 'Invalid join code.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def leave_classroom(request, classroom_id):
    """Allow a student to leave a classroom"""
    if request.user.user_type != 'student':
        return Response(
            {'error': 'Only students can leave classrooms.'}, 
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        student_profile = request.user.student_profile
        classroom = get_object_or_404(Classroom, id=classroom_id)
        
        membership = ClassroomMembership.objects.filter(
            classroom=classroom, student=student_profile, is_active=True
        ).first()
        
        if not membership:
            return Response(
                {'error': 'You are not a member of this classroom.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Deactivate membership instead of deleting
        membership.is_active = False
        membership.save()
        
        return Response({'message': 'Successfully left classroom.'})
        
    except StudentProfile.DoesNotExist:
        return Response(
            {'error': 'Student profile not found.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def remove_student(request, classroom_id, student_id):
    """Allow a teacher to remove a student from their classroom"""
    if request.user.user_type != 'teacher':
        return Response(
            {'error': 'Only teachers can remove students from classrooms.'}, 
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        teacher_profile = request.user.teacher_profile
        classroom = get_object_or_404(Classroom, id=classroom_id, teacher=teacher_profile)
        student_profile = get_object_or_404(StudentProfile, id=student_id)
        
        membership = ClassroomMembership.objects.filter(
            classroom=classroom, student=student_profile, is_active=True
        ).first()
        
        if not membership:
            return Response(
                {'error': 'Student is not a member of this classroom.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Deactivate membership
        membership.is_active = False
        membership.save()
        
        return Response({'message': 'Student successfully removed from classroom.'})
        
    except TeacherProfile.DoesNotExist:
        return Response(
            {'error': 'Teacher profile not found.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def classroom_stats(request, classroom_id):
    """Get statistics for a classroom (teachers only)"""
    if request.user.user_type != 'teacher':
        return Response(
            {'error': 'Only teachers can view classroom statistics.'}, 
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        teacher_profile = request.user.teacher_profile
        classroom = get_object_or_404(Classroom, id=classroom_id, teacher=teacher_profile)
        
        # Get basic stats
        total_students = classroom.get_active_students_count()
        completed_assessments = ClassroomMembership.objects.filter(
            classroom=classroom, 
            is_active=True,
            student__pre_assessment_completed=True
        ).count()
        
        stats = {
            'classroom_name': classroom.name,
            'total_students': total_students,
            'completed_assessments': completed_assessments,
            'pending_assessments': total_students - completed_assessments,
            'join_code': classroom.join_code,
            'created_at': classroom.created_at,
        }
        
        return Response(stats)
        
    except TeacherProfile.DoesNotExist:
        return Response(
            {'error': 'Teacher profile not found.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
