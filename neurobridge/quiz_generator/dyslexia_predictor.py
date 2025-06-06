# quiz_generator/dyslexia_predictor.py
import joblib
import pandas as pd
from collections import Counter
import os
from django.conf import settings

class DyslexiaLevelPredictor:
    def __init__(self):
        # Paths to the model files
        model_path = os.path.join(settings.BASE_DIR, 'dyslexia_level_predictor.joblib')
        encoder_path = os.path.join(settings.BASE_DIR, 'difficulty_encoder.joblib')
        
        try:
            import warnings
            # Suppress sklearn version warnings
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", category=UserWarning)
                self.model = joblib.load(model_path)
                self.encoder = joblib.load(encoder_path)
        except FileNotFoundError as e:
            print(f"Model files not found: {e}")
            self.model = None
            self.encoder = None
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None
            self.encoder = None

    def predict_dyslexia_level(self, dyslexia_responses):
        """
        Predict dyslexia level based on responses to dyslexia questions only.
        
        Args:
            dyslexia_responses: List of dicts containing:
                - difficulty_level: 'easy', 'moderate', 'hard'
                - response_time: float (seconds)
                - is_correct: boolean
        
        Returns:
            dict: {
                'predicted_level': str,  # 'no', 'low', 'medium', 'high'
                'confidence': float,  # confidence score (0-1)
                'confidence_scores': list,  # individual predictions for each question
                'question_count': int  # number of questions used for prediction
            }
        """
        if not dyslexia_responses:
            return {
                'predicted_level': 'no',
                'confidence': 0.0,
                'confidence_scores': [],
                'question_count': 0
            }
        
        # Check if model is available
        if self.model is None or self.encoder is None:
            print("Model not available, returning default prediction")
            return {
                'predicted_level': 'low',  # Default fallback
                'confidence': 0.5,
                'confidence_scores': ['low'] * len(dyslexia_responses),
                'question_count': len(dyslexia_responses)
            }
        
        try:
            # Prepare new data from backend (instead of example)
            new_data = pd.DataFrame(dyslexia_responses)
            
            # Preprocess the data
            new_data['is_correct'] = new_data['is_correct'].astype(int)
            new_data['difficulty_level'] = self.encoder.transform(new_data[['difficulty_level']])
            
            # Predict
            predictions = self.model.predict(new_data)
            prediction_probabilities = self.model.predict_proba(new_data)
            
            # Map predictions to readable labels
            prediction_map = {0: 'no', 1: 'low', 2: 'medium', 3: 'high'}
            my_list = [prediction_map[p] for p in predictions]
            
            # Determine final prediction based on most frequent result
            counts = Counter(my_list)
            most_frequent = counts.most_common(1)[0][0]
            
            # Calculate confidence as the average maximum probability across all predictions
            confidence = float(prediction_probabilities.max(axis=1).mean())
            
            print("Predicted Levels:", my_list)
            print("Final answer: student is", most_frequent)
            
            return {
                'predicted_level': most_frequent,
                'confidence': confidence,
                'confidence_scores': my_list,
                'question_count': len(dyslexia_responses)
            }
            
        except Exception as e:
            print(f"Error making prediction: {e}")
            return {
                'predicted_level': 'low',
                'confidence': 0.5,
                'confidence_scores': ['low'] * len(dyslexia_responses),
                'question_count': len(dyslexia_responses)
            }

# Global instance
predictor = DyslexiaLevelPredictor()

def run_both_predictions_async(assessment_session_id):
    """
    Unified function to run both dyslexia and autism predictions for assessments that include both types.
    
    Args:
        assessment_session_id: ID of the completed assessment session
    """
    from .models import AssessmentSession
    from profiles.models import StudentProfile
    from django.utils import timezone
    
    # Import autism_predictor here to avoid circular import
    try:
        from .autism_predictor import autism_predictor
    except ImportError as e:
        print(f"Failed to import autism_predictor: {e}")
        autism_predictor = None
    
    try:
        # Get the assessment session
        session = AssessmentSession.objects.get(id=assessment_session_id)
        
        # Only run if assessment type is 'both'
        if session.assessment_type != 'both':
            return
        
        # Extract responses separated by condition type
        dyslexia_responses = []
        autism_responses = []
        
        for response in session.responses.all():
            response_data = {
                'difficulty_level': response.question.difficulty_level,
                'response_time': response.response_time or 30.0,  # Default if not recorded
                'is_correct': response.is_correct
            }
            
            if response.question.condition_type == 'dyslexia':
                dyslexia_responses.append(response_data)
            elif response.question.condition_type == 'autism':
                autism_responses.append(response_data)
        
        # Get or create student profile
        student_profile, created = StudentProfile.objects.get_or_create(
            user=session.user,
            defaults={'student_id': f'STU{session.user.id:06d}'}
        )
        
        # Run dyslexia prediction if we have dyslexia responses
        if dyslexia_responses:
            dyslexia_result = predictor.predict_dyslexia_level(dyslexia_responses)
            student_profile.dyslexia_prediction_level = dyslexia_result['predicted_level']
            student_profile.dyslexia_prediction_confidence = dyslexia_result['confidence']
            student_profile.dyslexia_prediction_date = timezone.now()
          # Run autism prediction if we have autism responses and autism_predictor is available
        if autism_responses and autism_predictor is not None:
            autism_result = autism_predictor.predict_autism_level(autism_responses)
            student_profile.autism_prediction_level = autism_result['predicted_level']
            student_profile.autism_prediction_confidence = autism_result['confidence']
            student_profile.autism_prediction_date = timezone.now()
        elif autism_responses and autism_predictor is None:
            print("Autism predictor not available, skipping autism prediction")
        
        # Save the updated profile
        student_profile.save()
        
        print(f"Both predictions completed for session {assessment_session_id}")
        if dyslexia_responses:
            print(f"Dyslexia: {student_profile.dyslexia_prediction_level} (confidence: {student_profile.dyslexia_prediction_confidence:.2f})")
        if autism_responses:
            print(f"Autism: {student_profile.autism_prediction_level} (confidence: {student_profile.autism_prediction_confidence:.2f})")
            
    except Exception as e:
        # Log error but don't raise to avoid breaking the main flow
        print(f"Error in dual prediction: {e}")
        pass

def run_dyslexia_prediction_async(assessment_session_id):
    """
    Asynchronous function to run dyslexia prediction for a completed assessment.
    
    Args:
        assessment_session_id: ID of the completed assessment session
    """
    from .models import AssessmentSession
    from profiles.models import StudentProfile
    from django.utils import timezone
    
    try:
        # Get the assessment session
        session = AssessmentSession.objects.get(id=assessment_session_id)
        
        # Only run prediction if assessment includes dyslexia questions
        if session.assessment_type not in ['dyslexia', 'both']:
            return
        
        # Extract dyslexia responses from the session
        dyslexia_responses = []
        for response in session.responses.all():
            if response.question.condition_type == 'dyslexia':
                dyslexia_responses.append({
                    'difficulty_level': response.question.difficulty_level,
                    'response_time': response.response_time or 30.0,  # Default if not recorded
                    'is_correct': response.is_correct
                })
        
        if dyslexia_responses:
            # Run prediction
            prediction_result = predictor.predict_dyslexia_level(dyslexia_responses)
            
            # Update student profile with prediction results
            student_profile, created = StudentProfile.objects.get_or_create(
                user=session.user,
                defaults={'student_id': f'STU{session.user.id:06d}'}
            )
            student_profile.dyslexia_prediction_level = prediction_result['predicted_level']
            student_profile.dyslexia_prediction_confidence = prediction_result['confidence']
            student_profile.dyslexia_prediction_date = timezone.now()
            student_profile.save()
            
    except Exception as e:
        # Log error but don't raise to avoid breaking the main flow
        print(f"Error in dyslexia prediction: {e}")
        pass
