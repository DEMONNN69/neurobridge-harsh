from django.contrib import admin
from .models import Classroom, ClassroomMembership


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ['name', 'teacher', 'join_code', 'created_at', 'student_count']
    list_filter = ['created_at', 'teacher']
    search_fields = ['name', 'description', 'join_code', 'teacher__user__username']
    readonly_fields = ['join_code', 'created_at', 'updated_at']
    
    def student_count(self, obj):
        return obj.memberships.filter(is_active=True).count()
    student_count.short_description = 'Active Students'


@admin.register(ClassroomMembership)
class ClassroomMembershipAdmin(admin.ModelAdmin):
    list_display = ['classroom', 'student', 'joined_at', 'is_active']
    list_filter = ['joined_at', 'is_active', 'classroom']
    search_fields = ['classroom__name', 'student__user__username', 'student__user__email']
    readonly_fields = ['joined_at']
