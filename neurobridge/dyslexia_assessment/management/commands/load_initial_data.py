from django.core.management.base import BaseCommand
from dyslexia_assessment.models import TaskCategory, AgeRange, DifficultyLevel


class Command(BaseCommand):
    help = 'Load initial data for dyslexia assessment'

    def handle(self, *args, **options):
        self.stdout.write('Loading initial data for dyslexia assessment...')
        
        # Create Task Categories
        categories = [
            {
                'name': 'Phonological Awareness',
                'description': 'Tasks that assess the ability to recognize and manipulate sounds in spoken language',
                'clinical_significance': 'Core deficit in dyslexia; measures ability to process phonemes, rhyming, and sound patterns',
                'weight': 2.0
            },
            {
                'name': 'Reading Comprehension',
                'description': 'Understanding and interpreting written text',
                'clinical_significance': 'Assesses higher-level reading skills and meaning extraction',
                'weight': 1.5
            },
            {
                'name': 'Word Recognition',
                'description': 'Ability to identify and read individual words',
                'clinical_significance': 'Measures sight word vocabulary and decoding skills',
                'weight': 1.8
            },
            {
                'name': 'Visual Processing',
                'description': 'Processing and interpreting visual information',
                'clinical_significance': 'Some dyslexic students have visual processing difficulties',
                'weight': 1.0
            },
            {
                'name': 'Sound-Letter Mapping',
                'description': 'Connecting sounds (phonemes) to letters (graphemes)',
                'clinical_significance': 'Fundamental skill for reading; often impaired in dyslexia',
                'weight': 1.8
            },
            {
                'name': 'Working Memory',
                'description': 'Holding and manipulating information in mind',
                'clinical_significance': 'Often impaired in dyslexia; affects reading fluency and comprehension',
                'weight': 1.3
            },
            {
                'name': 'Sequencing',
                'description': 'Understanding and remembering order of information',
                'clinical_significance': 'Difficulty with sequencing is common in dyslexia',
                'weight': 1.2
            },
        ]
        
        for cat_data in categories:
            category, created = TaskCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            if created:
                self.stdout.write(f'  Created category: {category.name}')
            else:
                self.stdout.write(f'  Category already exists: {category.name}')
        
        # Create Age Ranges
        age_ranges = [
            {'name': '5-6 years', 'min_age': 5, 'max_age': 6, 'description': 'Pre-kindergarten to Kindergarten'},
            {'name': '6-8 years', 'min_age': 6, 'max_age': 8, 'description': 'Kindergarten to 2nd grade'},
            {'name': '9-11 years', 'min_age': 9, 'max_age': 11, 'description': '3rd to 5th grade'},
            {'name': '12-14 years', 'min_age': 12, 'max_age': 14, 'description': '6th to 8th grade'},
            {'name': '15-18 years', 'min_age': 15, 'max_age': 18, 'description': 'High school'},
        ]
        
        for age_data in age_ranges:
            age_range, created = AgeRange.objects.get_or_create(
                name=age_data['name'],
                defaults=age_data
            )
            if created:
                self.stdout.write(f'  Created age range: {age_range.name}')
            else:
                self.stdout.write(f'  Age range already exists: {age_range.name}')
        
        # Create Difficulty Levels
        difficulty_levels = [
            {'name': 'beginner', 'description': 'Basic level tasks', 'order': 1},
            {'name': 'intermediate', 'description': 'Moderate difficulty tasks', 'order': 2},
            {'name': 'advanced', 'description': 'Complex, challenging tasks', 'order': 3},
        ]
        
        for diff_data in difficulty_levels:
            difficulty, created = DifficultyLevel.objects.get_or_create(
                name=diff_data['name'],
                defaults=diff_data
            )
            if created:
                self.stdout.write(f'  Created difficulty level: {difficulty.get_name_display()}')
            else:
                self.stdout.write(f'  Difficulty level already exists: {difficulty.get_name_display()}')
        
        self.stdout.write(
            self.style.SUCCESS('Successfully loaded initial data for dyslexia assessment!')
        )
