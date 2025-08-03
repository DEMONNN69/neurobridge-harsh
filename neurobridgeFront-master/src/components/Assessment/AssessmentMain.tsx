import React, { useState, useEffect } from 'react';
import { AlertCircle, Volume2, Mic, CheckCircle } from 'lucide-react';
import PhonologicalAwareness from './categories/PhonologicalAwareness';
import ReadingComprehension from './categories/ReadingComprehension';
import Sequencing from './categories/Sequencing';
import SoundLetterMapping from './categories/SoundLetterMapping';
import VisualProcessing from './categories/VisualProcessing';
import WordRecognition from './categories/WordRecognition';
import WorkingMemory from './categories/WorkingMemory';
import CategoryIntro from './CategoryIntro';
import BreakScreen from './BreakScreen';
import { assessmentAPI } from '../../services/assessmentAPI';
import { AssessmentSession, Question, TaskCategory } from '../../types/assessment';

interface AssessmentMainProps {
  userId: string;
  onComplete: (sessionId: string) => void;
}

const CATEGORIES = [
  'Phonological Awareness',
  'Reading Comprehension', 
  'Sequencing',
  'Sound-Letter Mapping',
  'Visual Processing',
  'Word Recognition',
  'Working Memory'
];

const AssessmentMain: React.FC<AssessmentMainProps> = ({ userId, onComplete }) => {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [showBreak, setShowBreak] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Store all responses locally until submission
  const [allResponses, setAllResponses] = useState<Array<{
    questionId: string;
    categoryName: string;
    response: any;
    timeTaken: number;
    timestamp: number;
    questionIndex: number;
    categoryIndex: number;
  }>>([]);
  
  // Track assessment start time for total duration
  const [assessmentStartTime, setAssessmentStartTime] = useState<number>(Date.now());

  // Initialize assessment session
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      // Create new assessment session
      const session = await assessmentAPI.createSession(userId);
      setSessionId(session.id);
      
      // Load questions for first category
      await loadCategoryQuestions(0);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setError('Failed to start assessment. Please try again.');
      setIsLoading(false);
    }
  };

  const loadCategoryQuestions = async (categoryIndex: number) => {
    try {
      const categoryName = CATEGORIES[categoryIndex];
      const categoryQuestions = await assessmentAPI.getQuestionsByCategory(categoryName);
      setQuestions(categoryQuestions);
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error('Failed to load questions:', error);
      setError('Failed to load questions. Please try again.');
    }
  };

  const handleCategoryComplete = async () => {
    const nextCategoryIndex = currentCategoryIndex + 1;
    
    if (nextCategoryIndex >= CATEGORIES.length) {
      // Assessment complete - submit all responses
      if (sessionId) {
        await submitAllResponses();
        onComplete(sessionId);
      }
      return;
    }

    // Show break screen between categories
    setShowBreak(true);
    setTimeout(() => {
      setShowBreak(false);
      setCurrentCategoryIndex(nextCategoryIndex);
      setShowIntro(true);
      loadCategoryQuestions(nextCategoryIndex);
    }, 5000); // 5-second break
  };

  const handleQuestionComplete = async (questionId: string, response: any, timeTaken: number) => {
    if (!sessionId) return;

    try {
      // Store response locally instead of sending immediately
      const responseData = {
        questionId,
        categoryName: CATEGORIES[currentCategoryIndex],
        response,
        timeTaken,
        timestamp: Date.now(),
        questionIndex: currentQuestionIndex,
        categoryIndex: currentCategoryIndex
      };
      
      setAllResponses(prev => [...prev, responseData]);
      
      const nextQuestionIndex = currentQuestionIndex + 1;
      if (nextQuestionIndex >= questions.length) {
        // Category complete
        handleCategoryComplete();
      } else {
        setCurrentQuestionIndex(nextQuestionIndex);
      }
    } catch (error) {
      console.error('Failed to store response:', error);
      setError('Failed to save your answer. Please try again.');
    }
  };

  const submitAllResponses = async () => {
    if (!sessionId || allResponses.length === 0) return;

    try {
      setIsLoading(true);
      
      // Calculate total assessment time
      const totalTime = Date.now() - assessmentStartTime;
      
      // Prepare submission data
      const submissionData = {
        session_id: sessionId,
        responses: allResponses.map(resp => ({
          question_id: resp.questionId,
          category_name: resp.categoryName,
          selected_option_id: typeof resp.response === 'string' ? resp.response : undefined,
          text_response: typeof resp.response === 'string' ? undefined : JSON.stringify(resp.response),
          response_data: typeof resp.response === 'object' ? resp.response : { answer: resp.response },
          time_taken_seconds: Math.round(resp.timeTaken / 1000), // Convert to seconds
          question_index: resp.questionIndex,
          category_index: resp.categoryIndex,
          timestamp: resp.timestamp
        })),
        total_time_seconds: Math.round(totalTime / 1000),
        completed_categories: CATEGORIES.slice(0, currentCategoryIndex + 1),
        student_age: 12 // This should come from user profile
      };

      // Submit all responses at once
      const result = await assessmentAPI.submitAllResponses(submissionData);
      console.log('Assessment submitted successfully:', result);
      
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      setError('Failed to submit assessment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentCategoryComponent = () => {
    if (showIntro) {
      return (
        <CategoryIntro
          categoryName={CATEGORIES[currentCategoryIndex]}
          onStart={() => setShowIntro(false)}
        />
      );
    }

    if (showBreak) {
      return <BreakScreen />;
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;

    const componentProps = {
      question: currentQuestion,
      questionIndex: currentQuestionIndex + 1,
      totalQuestions: questions.length,
      onComplete: handleQuestionComplete
    };

    switch (CATEGORIES[currentCategoryIndex]) {
      case 'Phonological Awareness':
        return <PhonologicalAwareness {...componentProps} />;
      case 'Reading Comprehension':
        return <ReadingComprehension {...componentProps} />;
      case 'Sequencing':
        return <Sequencing {...componentProps} />;
      case 'Sound-Letter Mapping':
        return <SoundLetterMapping {...componentProps} />;
      case 'Visual Processing':
        return <VisualProcessing {...componentProps} />;
      case 'Word Recognition':
        return <WordRecognition {...componentProps} />;
      case 'Working Memory':
        return <WorkingMemory {...componentProps} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Starting your assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Assessment Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={initializeSession}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold text-gray-900">
              Dyslexia Assessment
            </h1>
            <span className="text-sm text-gray-500">
              Category {currentCategoryIndex + 1} of {CATEGORIES.length}
            </span>
          </div>
          
          {/* Overall Progress */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((currentCategoryIndex) / CATEGORIES.length) * 100}%` 
              }}
            ></div>
          </div>
          
          {/* Category Progress */}
          {!showIntro && !showBreak && questions.length > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-400 h-1 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(currentQuestionIndex / questions.length) * 100}%` 
                }}
              ></div>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-1">
            {CATEGORIES[currentCategoryIndex]}
            {!showIntro && !showBreak && (
              <span> - Question {currentQuestionIndex + 1} of {questions.length}</span>
            )}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {getCurrentCategoryComponent()}
      </div>
    </div>
  );
};

export default AssessmentMain;
