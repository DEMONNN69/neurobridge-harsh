import random
import string
from django.db import models
from django.conf import settings


def generate_join_code():
    """Generate a random 6-character join code (e.g., ABC123)"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


class Classroom(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(
        'profiles.TeacherProfile',
        on_delete=models.CASCADE,
        related_name='classrooms'
    )
    join_code = models.CharField(
        max_length=6, 
        unique=True, 
        default=generate_join_code
    )
    grade_level = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=50, blank=True)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.join_code})"

    def get_active_students_count(self):
        """Get count of active students in this classroom"""
        return self.memberships.filter(is_active=True).count()

    def save(self, *args, **kwargs):
        # Ensure unique join code
        while not self.join_code or Classroom.objects.filter(join_code=self.join_code).exclude(pk=self.pk).exists():
            self.join_code = generate_join_code()
        super().save(*args, **kwargs)


class ClassroomMembership(models.Model):
    classroom = models.ForeignKey(
        Classroom, 
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    student = models.ForeignKey(
        'profiles.StudentProfile',
        on_delete=models.CASCADE,
        related_name='classroom_memberships'
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('classroom', 'student')
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.student.user.get_full_name()} in {self.classroom.name}"
