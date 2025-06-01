from django.db import models
from django.conf import settings

class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}'s Profile"

class StudentProfile(models.Model):
    DYSLEXIA_TYPE_CHOICES = [
        ('phonological', 'Phonological Dyslexia'),
        ('surface', 'Surface Dyslexia'),
        ('visual', 'Visual Dyslexia'),
        ('mixed', 'Mixed Type'),
        ('none', 'No Dyslexia'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=20, unique=True)
    grade_level = models.CharField(max_length=20, blank=True, null=True)
    dyslexia_type = models.CharField(max_length=20, choices=DYSLEXIA_TYPE_CHOICES, default='none')
    learning_goals = models.TextField(blank=True, null=True)
    accommodation_notes = models.TextField(blank=True, null=True)
    parent_contact = models.EmailField(blank=True, null=True)
    enrollment_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Student: {self.user.first_name} {self.user.last_name}"

class TeacherProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='teacher_profile')
    employee_id = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    specialization = models.CharField(max_length=200, blank=True, null=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    qualifications = models.TextField(blank=True, null=True)
    hire_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Teacher: {self.user.first_name} {self.user.last_name}"

class Achievement(models.Model):
    ACHIEVEMENT_TYPES = [
        ('academic', 'Academic Achievement'),
        ('milestone', 'Learning Milestone'),
        ('participation', 'Participation Award'),
        ('improvement', 'Improvement Recognition'),
    ]
    
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='achievements')
    title = models.CharField(max_length=200)
    description = models.TextField()
    achievement_type = models.CharField(max_length=20, choices=ACHIEVEMENT_TYPES)
    points = models.PositiveIntegerField(default=0)
    badge_icon = models.CharField(max_length=50, blank=True, null=True)
    earned_date = models.DateTimeField(auto_now_add=True)
    awarded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='awarded_achievements')

    def __str__(self):
        return f"{self.title} - {self.student.first_name} {self.student.last_name}"
