from django.core.management.base import BaseCommand
from dyslexia_assessment.models import (
    TaskCategory, AgeRange, DifficultyLevel, Question, QuestionOption
)


class Command(BaseCommand):
    help = 'Load sample questions for dyslexia assessment'

    def handle(self, *args, **options):
        self.stdout.write('Loading sample questions...')
        
        # Get required objects
        working_memory_category = TaskCategory.objects.get(name='Working Memory')
        
        # Age ranges
        age_6_8 = AgeRange.objects.get(name='6-8 years')
        # Get or create 5-7 years age range
        age_5_7, created = AgeRange.objects.get_or_create(
            name='5-7 years',
            defaults={
                'min_age': 5,
                'max_age': 7,
                'description': 'Early elementary age group for foundational working memory tasks'
            }
        )
        if created:
            self.stdout.write(f'  Created age range: {age_5_7.name}')
        
        # Difficulty levels
        beginner_level = DifficultyLevel.objects.get(name='beginner')
        
        # WORKING MEMORY QUESTIONS FOR 5-7 YEARS AGE GROUP (Audio/Video-based with voice input)
        working_memory_questions = [
            {
                'title': 'Working Memory: Repeat Word Sequence',
                'question_text': 'Listen carefully: "Apple, Banana". Now, say those back to me.',
                'instructions': 'Listen to the words and repeat them back in the same order. Use your voice to answer.',
                'audio_prompt': 'Apple, Banana',
                'expected_response': 'Apple, Banana',
                'assessment_type': 'audio_sequence_recall',
                'options': [
                    {'text': 'Banana, Apple', 'correct': False},
                    {'text': 'Apple, Banana', 'correct': True},
                    {'text': 'Apple, Orange', 'correct': False},
                ]
            },
            {
                'title': 'Working Memory: Repeat Sentence',
                'question_text': 'Repeat this sentence exactly: "My cat is black."',
                'instructions': 'Listen to the sentence and repeat it back exactly as you heard it.',
                'audio_prompt': 'My cat is black.',
                'expected_response': 'My cat is black.',
                'assessment_type': 'sentence_repetition',
                'options': [
                    {'text': '"My cat black."', 'correct': False},
                    {'text': '"The cat is black."', 'correct': False},
                    {'text': '"My cat is black."', 'correct': True},
                ]
            },
            {
                'title': 'Working Memory: Color Memory with Delay',
                'question_text': 'Remember this color: Blue. I will ask you what it was later. (A minute later...) What was the color I told you to remember?',
                'instructions': 'Remember the color and answer after the delay. This tests your ability to hold information in memory.',
                'audio_prompt': 'Blue',
                'expected_response': 'Blue',
                'assessment_type': 'delayed_recall',
                'delay_duration': 60,
                'options': [
                    {'text': 'Red', 'correct': False},
                    {'text': 'Green', 'correct': False},
                    {'text': 'Blue', 'correct': True},
                ]
            },
            {
                'title': 'Working Memory: Sequential Instructions',
                'question_text': 'Listen to these instructions: "First, clap your hands. Then, touch your head." What do you do FIRST?',
                'instructions': 'Listen to the instructions and identify what you should do first.',
                'audio_prompt': 'First, clap your hands. Then, touch your head.',
                'expected_response': 'Clap your hands',
                'assessment_type': 'instruction_sequence',
                'options': [
                    {'text': 'Touch your head', 'correct': False},
                    {'text': 'Clap your hands', 'correct': True},
                    {'text': 'Stomp your feet', 'correct': False},
                ]
            },
            {
                'title': 'Working Memory: Last Word Recall',
                'question_text': 'What was the last word I said in this list? "Ball, Doll, Car".',
                'instructions': 'Listen to the list of words and identify the last word.',
                'audio_prompt': 'Ball, Doll, Car',
                'expected_response': 'Car',
                'assessment_type': 'last_item_recall',
                'options': [
                    {'text': 'Ball', 'correct': False},
                    {'text': 'Doll', 'correct': False},
                    {'text': 'Car', 'correct': True},
                ]
            },
            {
                'title': 'Working Memory: Visual Memory',
                'question_text': 'Look at this picture of a star [★]. Now I\'ll hide it. What was the picture of?',
                'instructions': 'Look at the image, remember what you saw, then answer what it was.',
                'visual_stimulus': '★',
                'visual_stimulus_type': 'image',
                'expected_response': 'star',
                'assessment_type': 'visual_recall',
                'options': [
                    {'text': 'A circle', 'correct': False},
                    {'text': 'A star', 'correct': True},
                    {'text': 'A square', 'correct': False},
                ]
            },
            {
                'title': 'Working Memory: Backward Number Sequence',
                'question_text': 'Listen to these numbers: "4, 2". Now say them backward.',
                'instructions': 'Listen to the numbers and repeat them in reverse order.',
                'audio_prompt': '4, 2',
                'expected_response': '2, 4',
                'assessment_type': 'backward_sequence',
                'options': [
                    {'text': '4, 2', 'correct': False},
                    {'text': '2, 4', 'correct': True},
                    {'text': '4, 4', 'correct': False},
                ]
            },
            {
                'title': 'Working Memory: Multi-Step Task',
                'question_text': 'I am going to say three things. I want you to point to them in the same order I say them: "Book, crayon, door."',
                'instructions': 'Listen to the items and point to them in the exact order mentioned. This is a task-based assessment.',
                'audio_prompt': 'Book, crayon, door',
                'expected_response': 'Point to book, then crayon, then door',
                'assessment_type': 'sequential_pointing_task',
                'task_items': ['book', 'crayon', 'door'],
                'options': [
                    {'text': 'Task-based assessment - no text options', 'correct': True},
                ]
            },
            {
                'title': 'Working Memory: Sentence Word Count',
                'question_text': 'How many words were in this sentence? "Birds can fly."',
                'instructions': 'Listen to the sentence and count how many words it contains.',
                'audio_prompt': 'Birds can fly.',
                'expected_response': 'Three',
                'assessment_type': 'word_counting',
                'options': [
                    {'text': 'Two', 'correct': False},
                    {'text': 'Three', 'correct': True},
                    {'text': 'Four', 'correct': False},
                ]
            },
            {
                'title': 'Working Memory: Memory with Processing',
                'question_text': 'Remember these two animals: "Lion, Mouse". Which one is bigger in real life?',
                'instructions': 'Remember the animals and use your knowledge to answer which one is bigger. This adds processing to memory.',
                'audio_prompt': 'Lion, Mouse',
                'expected_response': 'Lion',
                'assessment_type': 'memory_with_processing',
                'processing_task': 'size_comparison',
                'options': [
                    {'text': 'Lion', 'correct': True},
                    {'text': 'Mouse', 'correct': False},
                ]
            },
        ]
        
        # Create the working memory questions for 5-7 years
        for q_data in working_memory_questions:
            # Create base question data
            question_defaults = {
                'question_text': q_data['question_text'],
                'question_type': 'multiple_choice',
                'category': working_memory_category,
                'difficulty_level': beginner_level,
                'grade_levels': 'K-2',
                'instructions': q_data['instructions'],
                'points': 1,
                'is_published': True,
            }
            
            # Store working memory specific fields in additional_data JSON field
            additional_data = {}
            if 'audio_prompt' in q_data:
                additional_data['audio_prompt'] = q_data['audio_prompt']
            if 'expected_response' in q_data:
                additional_data['expected_response'] = q_data['expected_response']
            if 'assessment_type' in q_data:
                additional_data['assessment_type'] = q_data['assessment_type']
            if 'visual_stimulus' in q_data:
                additional_data['visual_stimulus'] = q_data['visual_stimulus']
            if 'visual_stimulus_type' in q_data:
                additional_data['visual_stimulus_type'] = q_data['visual_stimulus_type']
            if 'delay_duration' in q_data:
                additional_data['delay_duration'] = q_data['delay_duration']
            if 'task_items' in q_data:
                additional_data['task_items'] = q_data['task_items']
            if 'processing_task' in q_data:
                additional_data['processing_task'] = q_data['processing_task']
            
            # Add the additional_data to defaults
            question_defaults['additional_data'] = additional_data
            
            question, created = Question.objects.get_or_create(
                title=q_data['title'],
                defaults=question_defaults
            )
            
            if created:
                # Add age range (5-7 years)
                question.age_ranges.add(age_5_7)
                
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
        
        self.stdout.write(
            self.style.SUCCESS('Successfully loaded sample questions!')
        )
