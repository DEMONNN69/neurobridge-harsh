from rest_framework import serializers
from .models import Classroom, ClassroomMembership
from profiles.models import StudentProfile, TeacherProfile


class ClassroomSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Classroom
        fields = [
            'id', 'name', 'description', 'teacher', 'teacher_name', 
            'join_code', 'grade_level', 'subject', 'is_archived', 
            'student_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ('teacher', 'join_code', 'created_at', 'updated_at')

    def get_teacher_name(self, obj):
        return f"{obj.teacher.user.first_name} {obj.teacher.user.last_name}"

    def get_student_count(self, obj):
        return obj.get_active_students_count()


class ClassroomMembershipSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_username = serializers.SerializerMethodField()
    classroom_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ClassroomMembership
        fields = [
            'id', 'classroom', 'student', 'student_name', 'student_username',
            'classroom_name', 'joined_at', 'is_active'
        ]
        read_only_fields = ('joined_at',)

    def get_student_name(self, obj):
        return f"{obj.student.user.first_name} {obj.student.user.last_name}"
    
    def get_student_username(self, obj):
        return obj.student.user.username
    
    def get_classroom_name(self, obj):
        return obj.classroom.name


class JoinClassroomSerializer(serializers.Serializer):
    join_code = serializers.CharField(max_length=6)
    
    def validate_join_code(self, value):
        """Validate that the join code exists and classroom is not archived"""
        try:
            classroom = Classroom.objects.get(join_code=value.upper())
            if classroom.is_archived:
                raise serializers.ValidationError("This classroom is no longer active.")
            return value.upper()
        except Classroom.DoesNotExist:
            raise serializers.ValidationError("Invalid join code.")


class ClassroomRosterSerializer(serializers.ModelSerializer):
    """Serializer for classroom roster with detailed student information"""
    students = serializers.SerializerMethodField()
    
    class Meta:
        model = Classroom
        fields = [
            'id', 'name', 'description', 'grade_level', 'subject', 
            'join_code', 'created_at', 'students'
        ]
    
    def get_students(self, obj):
        active_memberships = obj.memberships.filter(is_active=True).select_related('student__user')
        return [{
            'id': membership.student.id,
            'name': f"{membership.student.user.first_name} {membership.student.user.last_name}",
            'username': membership.student.user.username,
            'student_id': membership.student.student_id,
            'grade_level': membership.student.grade_level,
            'joined_at': membership.joined_at,
            'pre_assessment_completed': membership.student.pre_assessment_completed,
        } for membership in active_memberships]
