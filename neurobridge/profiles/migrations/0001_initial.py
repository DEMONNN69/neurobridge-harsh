# Generated by Django 4.2.20 on 2025-05-31 11:29

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('bio', models.TextField(blank=True, null=True)),
                ('profile_picture', models.ImageField(blank=True, null=True, upload_to='profile_pics/')),
                ('phone', models.CharField(blank=True, max_length=15, null=True)),
                ('date_of_birth', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='TeacherProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('employee_id', models.CharField(max_length=20, unique=True)),
                ('department', models.CharField(blank=True, max_length=100, null=True)),
                ('specialization', models.CharField(blank=True, max_length=200, null=True)),
                ('years_of_experience', models.PositiveIntegerField(default=0)),
                ('qualifications', models.TextField(blank=True, null=True)),
                ('hire_date', models.DateField(auto_now_add=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='teacher_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='StudentProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('student_id', models.CharField(max_length=20, unique=True)),
                ('grade_level', models.CharField(blank=True, max_length=20, null=True)),
                ('dyslexia_type', models.CharField(choices=[('phonological', 'Phonological Dyslexia'), ('surface', 'Surface Dyslexia'), ('visual', 'Visual Dyslexia'), ('mixed', 'Mixed Type'), ('none', 'No Dyslexia')], default='none', max_length=20)),
                ('learning_goals', models.TextField(blank=True, null=True)),
                ('accommodation_notes', models.TextField(blank=True, null=True)),
                ('parent_contact', models.EmailField(blank=True, max_length=254, null=True)),
                ('enrollment_date', models.DateField(auto_now_add=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='student_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Achievement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('achievement_type', models.CharField(choices=[('academic', 'Academic Achievement'), ('milestone', 'Learning Milestone'), ('participation', 'Participation Award'), ('improvement', 'Improvement Recognition')], max_length=20)),
                ('points', models.PositiveIntegerField(default=0)),
                ('badge_icon', models.CharField(blank=True, max_length=50, null=True)),
                ('earned_date', models.DateTimeField(auto_now_add=True)),
                ('awarded_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='awarded_achievements', to=settings.AUTH_USER_MODEL)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='achievements', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
