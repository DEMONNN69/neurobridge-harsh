# quiz_generator/autism_predictor.py
import joblib
import pandas as pd
from collections import Counter
import os
from django.conf import settings

class AutismLevelPredictor:
    def __init__(self):
        # Use the same model files as dyslexia for now - can be separated later if needed
        # For autism, we can either:
        # 1. Use the same dyslexia model (current approach)
        # 2. Create separate autism_level_predictor.joblib and autism_difficulty_encoder.joblib files
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
            print(f"Autism model files not found: {e}")
            self.model = None
            self.encoder = None
        except Exception as e:
            print(f"Error loading autism model: {e}")
            self.model = None
            self.encoder = None

    def predict_autism_level(self, autism_responses):
        """
        Predict autism level based on responses to autism questions only.
        Uses the same XGBoost model structure as dyslexia prediction.
        
        Args:
            autism_responses: List of dicts containing:
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
        if not autism_responses:
            return {
                'predicted_level': 'no',
                'confidence': 0.0,
                'confidence_scores': [],
                'question_count': 0
            }
        
        # Check if model is available
        if self.model is None or self.encoder is None:
            print("Autism model not available, returning default prediction")
            return {
                'predicted_level': 'low',  # Default fallback
                'confidence': 0.5,
                'confidence_scores': ['low'] * len(autism_responses),
                'question_count': len(autism_responses)
            }
        
        try:
            # Prepare new data from backend (same approach as dyslexia)
            new_data = pd.DataFrame(autism_responses)
            
            # Preprocess the data
            new_data['is_correct'] = new_data['is_correct'].astype(int)
            new_data['difficulty_level'] = self.encoder.transform(new_data[['difficulty_level']])
            
            # Predict using the same model
            predictions = self.model.predict(new_data)
            prediction_probabilities = self.model.predict_proba(new_data)
            
            # Map predictions to readable labels (same as dyslexia)
            prediction_map = {0: 'no', 1: 'low', 2: 'medium', 3: 'high'}
            my_list = [prediction_map[p] for p in predictions]
            
            # Determine final prediction based on most frequent result
            counts = Counter(my_list)
            most_frequent = counts.most_common(1)[0][0]
            
            # Calculate confidence as the average maximum probability across all predictions
            confidence = float(prediction_probabilities.max(axis=1).mean())
            
            print("Autism Predicted Levels:", my_list)
            print("Final autism answer: student is", most_frequent)
            
            return {
                'predicted_level': most_frequent,
                'confidence': confidence,
                'confidence_scores': my_list,
                'question_count': len(autism_responses)
            }
            
        except Exception as e:
            print(f"Error making autism prediction: {e}")
            return {
                'predicted_level': 'low',
                'confidence': 0.5,
                'confidence_scores': ['low'] * len(autism_responses),
                'question_count': len(autism_responses)
            }

# Global instance
autism_predictor = AutismLevelPredictor()

def run_autism_prediction_async(assessment_session_id):
    """
    Asynchronous function to run autism prediction for a completed assessment.
    Uses the same XGBoost model approach as dyslexia prediction.
    
    Args:
        assessment_session_id: ID of the completed assessment session
    """
    from .models import AssessmentSession
    from profiles.models import StudentProfile
    from django.utils import timezone
    
    try:
        # Get the assessment session
        session = AssessmentSession.objects.get(id=assessment_session_id)
        
        # Only run prediction if assessment includes autism questions
        if session.assessment_type not in ['autism', 'both']:
            return
        
        # Extract autism responses from the session
        autism_responses = []
        for response in session.responses.all():
            if response.question.condition_type == 'autism':
                autism_responses.append({
                    'difficulty_level': response.question.difficulty_level,
                    'response_time': response.response_time or 30.0,  # Default if not recorded
                    'is_correct': response.is_correct
                })
        
        if autism_responses:
            # Run prediction using the same model approach as dyslexia
            prediction_result = autism_predictor.predict_autism_level(autism_responses)
            
            # Update student profile with prediction results
            student_profile, created = StudentProfile.objects.get_or_create(
                user=session.user,
                defaults={'student_id': f'STU{session.user.id:06d}'}
            )
            student_profile.autism_prediction_level = prediction_result['predicted_level']
            student_profile.autism_prediction_confidence = prediction_result['confidence']
            student_profile.autism_prediction_date = timezone.now()
            student_profile.save()
            
    except Exception as e:
        # Log error but don't raise to avoid breaking the main flow
        print(f"Error in autism prediction: {e}")
        pass
