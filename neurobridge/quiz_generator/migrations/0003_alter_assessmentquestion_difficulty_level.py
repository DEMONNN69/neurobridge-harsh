# Generated by Django 4.2.20 on 2025-06-03 09:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quiz_generator', '0002_assessmentsession_total_assessment_time_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='assessmentquestion',
            name='difficulty_level',
            field=models.CharField(choices=[('easy', 'Easy'), ('moderate', 'Moderate'), ('hard', 'Hard')], default='moderate', max_length=20),
        ),
    ]
