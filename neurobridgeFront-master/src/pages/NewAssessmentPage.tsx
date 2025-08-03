import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { assessmentAPI } from '../services/assessmentAPI';
import { apiService } from '../services/api';
import { 
  AssessmentSession, 
  Question,
  TaskCategory,
  StudentResponse
} from '../types/assessment';

// Import category components
import PhonologicalAwareness from '../components/Assessment/categories/PhonologicalAwareness';
import ReadingComprehension from '../components/Assessment/categories/ReadingComprehension';
import Sequencing from '../components/Assessment/categories/Sequencing';
import SoundLetterMapping from '../components/Assessment/categories/SoundLetterMapping';
import VisualProcessing from '../components/Assessment/categories/VisualProcessing';
import WordRecognition from '../components/Assessment/categories/WordRecognition';
import WorkingMemory from '../components/Assessment/categories/WorkingMemory';

interface NewAssessmentPageProps {}

const CATEGORIES = [
  'Phonological Awareness',
  'Reading Comprehension', 
  'Sequencing',
  'Sound-Letter Mapping',
  'Visual Processing',
  'Word Recognition',
  'Working Memory'
];

const NewAssessmentPage: React.FC<NewAssessmentPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, updateAssessmentStatus } = useAuth();

  // Get assessment type from navigation state or localStorage
  const assessmentType = location.state?.assessmentType || localStorage.getItem('assessmentType') || 'dyslexia';
  const isComprehensive = location.state?.isComprehensive || localStorage.getItem('comprehensiveAssessment') === 'true';

  // State management
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [categoryQuestions, setCategoryQuestions] = useState<Question[]>([]);
  const [allResponses, setAllResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);

  // Timing
  const [assessmentStartTime, setAssessmentStartTime] = useState<number>(0);
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number>(0);
  const [displayTime, setDisplayTime] = useState<string>('00:00');

  // Initialize assessment
  useEffect(() => {
    initializeAssessment();
  }, []);

  // Timer effect
  useEffect(() => {
    if (assessmentStartTime > 0) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - assessmentStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setDisplayTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [assessmentStartTime]);

  const initializeAssessment = async () => {
    try {
      setLoading(true);
      setAssessmentStartTime(Date.now());

      // Get student age from pre-assessment data or default
      const preAssessmentData = await getPreAssessmentData();
      const studentAge = preAssessmentData?.age || 12;

      // Start assessment session
      const response = await apiService.startAssessment({
        student_age: studentAge,
        pre_assessment_data: preAssessmentData
      });

      setSessionId(response.session_id);
      
      // Load questions for first category
      await loadCategoryQuestions(0, response.questions);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize assessment:', error);
      setError('Failed to start assessment. Please try again.');
      setLoading(false);
    }
  };

  const getPreAssessmentData = async () => {
    try {
      const profileResponse = await apiService.getPreAssessmentData();
      if (profileResponse && profileResponse.data) {
        return profileResponse.data;
      }
    } catch (error) {
      console.error('Error getting pre-assessment data:', error);
    }
    
    // Fallback to localStorage or defaults
    const stored = localStorage.getItem('preAssessmentData');
    if (stored) {
      return JSON.parse(stored);
    }
    
    return {
      age: 12,
      grade: '6th',
      reading_level: 'grade_level',
      primary_language: 'English',
      has_reading_difficulty: false,
      needs_assistance: false,
      previous_assessment: false
    };
  };

  const loadCategoryQuestions = async (categoryIndex: number, allQuestions: Question[]) => {
    const categoryName = CATEGORIES[categoryIndex];
    
    // Filter questions by category
    const questions = allQuestions.filter(question => 
      question.category.name.toLowerCase() === categoryName.toLowerCase()
    );
    
    setCategoryQuestions(questions);
    setCurrentQuestionIndex(0);
    setCurrentQuestionStartTime(Date.now());
  };

  const handleQuestionAnswer = async (questionId: string, answer: any) => {
    if (!sessionId) return;

    const timeTaken = Date.now() - currentQuestionStartTime;

    try {
      // Store response locally (don't submit to backend yet)
      setAllResponses(prev => [...prev, {
        questionId,
        categoryName: CATEGORIES[currentCategoryIndex],
        answer,
        timeTaken,
        timestamp: Date.now(),
        questionIndex: currentQuestionIndex,
        categoryIndex: currentCategoryIndex
      }]);

      // Move to next question
      handleNextQuestion();

    } catch (error) {
      console.error('Failed to store response:', error);
      setError('Failed to save answer. Please try again.');
    }
  };

  const handleNextQuestion = async () => {
    const nextQuestionIndex = currentQuestionIndex + 1;

    if (nextQuestionIndex >= categoryQuestions.length) {
      // Move to next category
      const nextCategoryIndex = currentCategoryIndex + 1;
      
      if (nextCategoryIndex >= CATEGORIES.length) {
        // Assessment complete
        await completeAssessment();
      } else {
        setCurrentCategoryIndex(nextCategoryIndex);
        // Load questions for next category would need to get all questions again
        // For now, we'll complete the assessment
        await completeAssessment();
      }
    } else {
      setCurrentQuestionIndex(nextQuestionIndex);
      setCurrentQuestionStartTime(Date.now());
    }
  };

  const completeAssessment = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      
      // Prepare submission data with all responses
      const submissionData = {
        session_id: sessionId,
        responses: allResponses.map((resp, index) => ({
          question_id: resp.questionId,
          category_name: resp.categoryName,
          selected_option_id: typeof resp.answer === 'string' ? resp.answer : undefined,
          text_response: typeof resp.answer === 'string' ? undefined : JSON.stringify(resp.answer),
          response_data: typeof resp.answer === 'object' ? resp.answer : { answer: resp.answer },
          time_taken_seconds: Math.round(resp.timeTaken / 1000), // Convert to seconds
          question_index: resp.questionIndex || index,
          category_index: resp.categoryIndex || Math.floor(index / 5), // Estimate if not set
          timestamp: resp.timestamp || Date.now()
        })),
        total_time_seconds: Math.round((Date.now() - assessmentStartTime) / 1000),
        completed_categories: CATEGORIES.slice(0, currentCategoryIndex + 1),
        student_age: 12 // This should come from user profile
      };

      // Submit all responses at once using the new endpoint
      const result = await apiService.submitAllResponses(submissionData);

      setAssessmentResult(result);
      setAssessmentComplete(true);
      
      // Update assessment status
      updateAssessmentStatus(true);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to complete assessment:', error);
      setError('Failed to complete assessment. Please try again.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderCurrentQuestion = () => {
    if (categoryQuestions.length === 0) return null;

    const currentQuestion = categoryQuestions[currentQuestionIndex];
    const categoryName = CATEGORIES[currentCategoryIndex];

    // Create wrapper functions that match the expected interface
    const handleAnswer = (answer: string) => {
      handleQuestionAnswer(currentQuestion.id, answer);
    };

    const handleNext = () => {
      handleNextQuestion();
    };

    const commonProps = {
      question: currentQuestion,
      onAnswer: handleAnswer,
      onNext: handleNext,
      disabled: loading
    };

    switch (categoryName) {
      case 'Phonological Awareness':
        return <PhonologicalAwareness {...commonProps} />;
      case 'Reading Comprehension':
        return <ReadingComprehension {...commonProps} />;
      case 'Sequencing':
        return <Sequencing {...commonProps} />;
      case 'Sound-Letter Mapping':
        return <SoundLetterMapping {...commonProps} />;
      case 'Visual Processing':
        return <VisualProcessing {...commonProps} />;
      case 'Word Recognition':
        return <WordRecognition {...commonProps} />;
      case 'Working Memory':
        return <WorkingMemory {...commonProps} />;
      default:
        return <div>Unknown category: {categoryName}</div>;
    }
  };

  if (loading && !assessmentComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Assessment Error</h3>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (assessmentComplete && assessmentResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3 text-green-600">
              <CheckCircle className="w-12 h-12" />
              <h2 className="text-2xl font-bold">Assessment Complete!</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold text-blue-600">{assessmentResult.summary.total_questions}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Correct Answers</p>
                <p className="text-2xl font-bold text-green-600">{assessmentResult.summary.correct_answers}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold text-purple-600">{assessmentResult.summary.accuracy_percentage}%</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate('/student/dashboard')}
                className="bg-blue-500 text-white py-3 px-8 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Dyslexia Assessment - {CATEGORIES[currentCategoryIndex]}
              </h1>
              {assessmentType === 'both' && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Comprehensive
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{displayTime}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Category {currentCategoryIndex + 1} of {CATEGORIES.length}
            </span>
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {categoryQuestions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((currentCategoryIndex * 100) + ((currentQuestionIndex + 1) / categoryQuestions.length * 100)) / CATEGORIES.length}%` 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentQuestion()}
      </main>
    </div>
  );
};

export default NewAssessmentPage;
