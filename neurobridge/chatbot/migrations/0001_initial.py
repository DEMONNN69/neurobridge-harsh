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
            name='BotPersonality',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('personality_type', models.CharField(choices=[('tutor', 'Academic Tutor'), ('companion', 'Learning Companion'), ('counselor', 'Academic Counselor'), ('motivator', 'Motivational Coach')], max_length=20)),
                ('description', models.TextField()),
                ('avatar_url', models.URLField(blank=True, null=True)),
                ('system_prompt', models.TextField()),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='UserPreference',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('communication_style', models.CharField(choices=[('formal', 'Formal'), ('casual', 'Casual'), ('encouraging', 'Encouraging'), ('direct', 'Direct')], default='encouraging', max_length=20)),
                ('enable_audio_response', models.BooleanField(default=False)),
                ('enable_speech_recognition', models.BooleanField(default=False)),
                ('response_speed', models.CharField(choices=[('slow', 'Slow'), ('normal', 'Normal'), ('fast', 'Fast')], default='normal', max_length=10)),
                ('language_preference', models.CharField(default='en', max_length=10)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('preferred_personality', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='chatbot.botpersonality')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='chat_preferences', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='ChatSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_id', models.CharField(max_length=100, unique=True)),
                ('title', models.CharField(blank=True, max_length=200, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chat_sessions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
        migrations.CreateModel(
            name='ChatMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message_type', models.CharField(choices=[('user', 'User Message'), ('bot', 'Bot Response'), ('system', 'System Message')], max_length=10)),
                ('content', models.TextField()),
                ('audio_url', models.URLField(blank=True, null=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='chatbot.chatsession')),
            ],
            options={
                'ordering': ['created_at'],
            },
        ),
        migrations.CreateModel(
            name='ChatFeedback',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('feedback_type', models.CharField(choices=[('helpful', 'Helpful'), ('not_helpful', 'Not Helpful'), ('inappropriate', 'Inappropriate'), ('error', 'Error')], max_length=20)),
                ('rating', models.PositiveIntegerField(blank=True, choices=[(1, 1), (2, 2), (3, 3), (4, 4), (5, 5)], null=True)),
                ('comment', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('message', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='feedback', to='chatbot.chatmessage')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chat_feedback', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
