from rest_framework import serializers
from .models import Course, Lesson, Assignment, Submission, Enrollment, Progress

class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    lesson_count = serializers.SerializerMethodField()
    enrolled_students = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def get_teacher_name(self, obj):
        return f"{obj.teacher.first_name} {obj.teacher.last_name}"

    def get_lesson_count(self, obj):
        return obj.lessons.count()

    def get_enrolled_students(self, obj):
        return obj.enrollments.filter(is_active=True).count()

class LessonSerializer(serializers.ModelSerializer):
    course_title = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = '__all__'
        read_only_fields = ('created_at',)

    def get_course_title(self, obj):
        return obj.course.title

class AssignmentSerializer(serializers.ModelSerializer):
    course_title = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()
    submission_count = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = '__all__'
        read_only_fields = ('created_at',)

    def get_course_title(self, obj):
        return obj.course.title

    def get_teacher_name(self, obj):
        return f"{obj.teacher.first_name} {obj.teacher.last_name}"

    def get_submission_count(self, obj):
        return obj.submissions.count()

class SubmissionSerializer(serializers.ModelSerializer):
    assignment_title = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    graded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = '__all__'
        read_only_fields = ('submitted_at', 'graded_at')

    def get_assignment_title(self, obj):
        return obj.assignment.title

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def get_graded_by_name(self, obj):
        if obj.graded_by:
            return f"{obj.graded_by.first_name} {obj.graded_by.last_name}"
        return None

class EnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = '__all__'
        read_only_fields = ('enrolled_at',)

    def get_course_title(self, obj):
        return obj.course.title

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

class ProgressSerializer(serializers.ModelSerializer):
    lesson_title = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()

    class Meta:
        model = Progress
        fields = '__all__'
        read_only_fields = ('created_at', 'completed_at')

    def get_lesson_title(self, obj):
        return obj.lesson.title

    def get_course_title(self, obj):
        return obj.lesson.course.title
