import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, QuizQuestion } from '../services/api';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AssessmentAnswer {
  question_id: string;  // Changed from question_index to question_id
  selected_answer: string;
  is_correct: boolean;
  response_time?: number;  // Added response time tracking
}

interface AssessmentSubmission {
  session_id?: string;  // Added session tracking
  answers: AssessmentAnswer[];
  total_questions: number;
  correct_answers: number;
}

const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, updateAssessmentStatus } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };
  useEffect(() => {
    // Only generate questions once on mount and if assessment is not already complete
    if (!assessmentComplete && questions.length === 0) {
      generateQuestions();
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // Reset timer when question changes
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);
  const generateQuestions = async () => {
    // Prevent regeneration if assessment is already complete
    if (assessmentComplete || questions.length > 0) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Generate mixed questions (5 dyslexia + 5 autism)
      const response = await apiService.generateQuiz({
        condition: 'mixed',
        num_easy: 2,
        num_moderate: 4,
        num_hard: 4
      });
      
      setQuestions(response.questions);
      setSessionId(response.session_id);
      
      // Initialize answers array
      setAnswers(new Array(response.questions.length).fill(null).map((_, index) => ({
        question_id: response.questions[index].question_id,
        selected_answer: '',
        is_correct: false,
        response_time: 0
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate assessment questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (option: string) => {
    setSelectedAnswer(option);
  };  const handleNext = () => {
    if (!selectedAnswer) return;

    // Calculate response time
    const responseTime = (Date.now() - questionStartTime) / 1000;

    // Update answers array
    const updatedAnswers = [...answers];
    const currentQuestion = questions[currentQuestionIndex];
    
    // Fix: Compare with the actual option text, not just the letter
    const selectedOptionText = currentQuestion.options[selectedAnswer.charCodeAt(0) - 65]; // Convert A,B,C,D to index
    const isCorrect = selectedOptionText === currentQuestion.correct_answer;
    
    // Debug logging
    console.log('Assessment Debug:', {
      questionIndex: currentQuestionIndex,
      selectedAnswer,
      selectedOptionText,
      correctAnswer: currentQuestion.correct_answer,
      isCorrect,
      options: currentQuestion.options
    });
    
    updatedAnswers[currentQuestionIndex] = {
      question_id: currentQuestion.question_id,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      response_time: responseTime
    };
    
    setAnswers(updatedAnswers);
    setSelectedAnswer('');

    // Move to next question or complete assessment
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitAssessment(updatedAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Load previous answer if exists
      const previousAnswer = answers[currentQuestionIndex - 1];
      if (previousAnswer) {
        setSelectedAnswer(previousAnswer.selected_answer);
      }
    }
  };
  const submitAssessment = async (finalAnswers: AssessmentAnswer[]) => {
    try {
      setSubmitting(true);
      // Calculate correct answers count
      const correctCount = finalAnswers.filter(a => a.is_correct).length;
      const submission: AssessmentSubmission = {
        session_id: sessionId,
        answers: finalAnswers,
        total_questions: questions.length,
        correct_answers: correctCount
      };
      const result = await apiService.submitAssessment(submission);
      setAssessmentResult(result);
      setAssessmentComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
      setSubmitting(false);
    }
  };  const handleCompleteAssessment = () => {
    // Update the user's assessment completion status
    updateAssessmentStatus(true);
    
    // Navigate immediately without clearing state to prevent regeneration
    // The replace: true ensures user can't navigate back to assessment
    navigate('/student/dashboard?assessment_completed=true', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Generating your personalized assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Assessment Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={generateQuestions}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (assessmentComplete && assessmentResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-green-600 mb-4">
            <CheckCircle className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Assessment Complete!</h2>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Accuracy</p>
                <p className="font-semibold text-lg">{assessmentResult.accuracy.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-500">Score</p>
                <p className="font-semibold text-lg">
                  {assessmentResult.correct_answers}/{assessmentResult.total_questions}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              Based on your responses, we've personalized your learning experience.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Learning profile configured for optimal accessibility features.
              </p>
            </div>
          </div>

          <button
            onClick={handleCompleteAssessment}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Analyzing your responses...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Learning Assessment</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Question */}          <div className="mb-8">
            <div className="flex items-center mb-4">
              <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
                {currentQuestion.difficulty}
              </span>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, index) => {
              const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
              const isSelected = selectedAnswer === optionLabel;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(optionLabel)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 text-sm font-medium ${
                      isSelected
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {optionLabel}
                    </span>
                    <span className="text-gray-900">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`flex items-center px-4 py-2 rounded-md ${
                currentQuestionIndex === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={!selectedAnswer}
              className={`flex items-center px-6 py-2 rounded-md ${
                selectedAnswer
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Complete Assessment' : 'Next'}
              {currentQuestionIndex < questions.length - 1 && (
                <ChevronRight className="h-5 w-5 ml-1" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
