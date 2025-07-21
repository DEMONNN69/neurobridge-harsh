from django.core.management.base import BaseCommand
from dyslexia_assessment.models import (
    TaskCategory, AgeRange, DifficultyLevel, Question, QuestionOption
)


class Command(BaseCommand):
    help = 'Load sample questions for dyslexia assessment'

    def handle(self, *args, **options):
        self.stdout.write('Loading sample questions...')
        
        # Get required objects
        phonological_category = TaskCategory.objects.get(name='Phonological Awareness')
        age_6_8 = AgeRange.objects.get(name='6-8 years')
        beginner_level = DifficultyLevel.objects.get(name='beginner')
        
        # Sample rhyming questions
        rhyming_questions = [
            {
                'title': 'Rhyming: Cat',
                'question_text': 'Which word rhymes with "cat"?',
                'instructions': 'Listen carefully and choose the word that sounds similar at the end.',
                'options': [
                    {'text': 'hat', 'correct': True},
                    {'text': 'dog', 'correct': False},
                    {'text': 'car', 'correct': False},
                    {'text': 'book', 'correct': False},
                ]
            },
            {
                'title': 'Rhyming: Sun',
                'question_text': 'Which word rhymes with "sun"?',
                'instructions': 'Choose the word that has the same ending sound as "sun".',
                'options': [
                    {'text': 'moon', 'correct': False},
                    {'text': 'run', 'correct': True},
                    {'text': 'star', 'correct': False},
                    {'text': 'tree', 'correct': False},
                ]
            },
            {
                'title': 'Rhyming: Ball',
                'question_text': 'Which word rhymes with "ball"?',
                'instructions': 'Pick the word that sounds like "ball" at the end.',
                'options': [
                    {'text': 'tall', 'correct': True},
                    {'text': 'small', 'correct': True},  # Multiple correct answers
                    {'text': 'big', 'correct': False},
                    {'text': 'round', 'correct': False},
                ]
            },
        ]
        
        for q_data in rhyming_questions:
            question, created = Question.objects.get_or_create(
                title=q_data['title'],
                defaults={
                    'question_text': q_data['question_text'],
                    'question_type': 'multiple_choice',
                    'category': phonological_category,
                    'difficulty_level': beginner_level,
                    'grade_levels': 'K-2',
                    'instructions': q_data['instructions'],
                    'points': 1,
                    'is_published': True,
                }
            )
            
            if created:
                # Add age range
                question.age_ranges.add(age_6_8)
                
                # Create options
                for i, option_data in enumerate(q_data['options'], 1):
                    QuestionOption.objects.create(
                        question=question,
                        option_text=option_data['text'],
                        is_correct=option_data['correct'],
                        order=i
                    )
                
                self.stdout.write(f'  Created question: {question.title}')
            else:
                self.stdout.write(f'  Question already exists: {question.title}')
        
        # Sample sound blending questions
        word_recognition = TaskCategory.objects.get(name='Word Recognition')
        
        word_questions = [
            {
                'title': 'Word Recognition: Simple Words',
                'question_text': 'Which is a real word?',
                'instructions': 'Choose the word that you can find in a dictionary.',
                'options': [
                    {'text': 'cat', 'correct': True},
                    {'text': 'zub', 'correct': False},
                    {'text': 'mip', 'correct': False},
                    {'text': 'gol', 'correct': False},
                ]
            },
        ]
        
        for q_data in word_questions:
            question, created = Question.objects.get_or_create(
                title=q_data['title'],
                defaults={
                    'question_text': q_data['question_text'],
                    'question_type': 'multiple_choice',
                    'category': word_recognition,
                    'difficulty_level': beginner_level,
                    'grade_levels': 'K-2',
                    'instructions': q_data['instructions'],
                    'points': 1,
                    'is_published': True,
                }
            )
            
            if created:
                question.age_ranges.add(age_6_8)
                
                for i, option_data in enumerate(q_data['options'], 1):
                    QuestionOption.objects.create(
                        question=question,
                        option_text=option_data['text'],
                        is_correct=option_data['correct'],
                        order=i
                    )
                
                self.stdout.write(f'  Created question: {question.title}')
            else:
                self.stdout.write(f'  Question already exists: {question.title}')
        
        self.stdout.write(
            self.style.SUCCESS('Successfully loaded sample questions!')
        )
