from django.contrib import admin
from .models import UserProfile, StudentProfile, TeacherProfile, Achievement

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
    search_fields = ('user__username', 'user__email')

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'student_id', 'grade_level', 'dyslexia_type', 'assessment_score', 'enrollment_date')
    list_filter = ('grade_level', 'dyslexia_type')
    search_fields = ('user__username', 'student_id')

@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'employee_id', 'department', 'years_of_experience', 'hire_date', 'classroom_count')
    list_filter = ('department', 'years_of_experience')
    search_fields = ('user__username', 'employee_id')
    
    def classroom_count(self, obj):
        return obj.classrooms.count()
    classroom_count.short_description = 'Total Classrooms'

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('title', 'student', 'achievement_type', 'points', 'earned_date')
    list_filter = ('achievement_type', 'earned_date')
    search_fields = ('title', 'student__username')
