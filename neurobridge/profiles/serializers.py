from rest_framework import serializers
from .models import UserProfile, StudentProfile, TeacherProfile, Achievement

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = '__all__'
        read_only_fields = ('user', 'enrollment_date', 'dyslexia_prediction_level', 'dyslexia_prediction_confidence', 'dyslexia_prediction_date')

class TeacherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherProfile
        fields = '__all__'
        read_only_fields = ('user', 'hire_date')

class AchievementSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    awarded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Achievement
        fields = '__all__'
        read_only_fields = ('earned_date',)

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def get_awarded_by_name(self, obj):
        if obj.awarded_by:
            return f"{obj.awarded_by.first_name} {obj.awarded_by.last_name}"
        return None
