import React, { useState, useEffect } from 'react';
import { AlertCircle, Brain, Zap, Target, CheckCircle, Clock } from 'lucide-react';
import PhonologicalAwareness from './categories/PhonologicalAwareness';
import ReadingComprehension from './categories/ReadingComprehension';
import Sequencing from './categories/Sequencing';
import SoundLetterMapping from './categories/SoundLetterMapping';
import VisualProcessing from './categories/VisualProcessing';
import WordRecognition from './categories/WordRecognition';
import WorkingMemory from './categories/WorkingMemory';
import CategoryIntro from './CategoryIntro';
import BreakScreen from './BreakScreen';
import { assessmentStorage } from '../../services/assessmentStorage';
import { apiService } from '../../services/api';

interface AssessmentMainProps {
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

const AssessmentMain: React.FC<AssessmentMainProps> = ({ onComplete }) => {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showBreak, setShowBreak] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Store all responses locally until submission (now managed by assessmentStorage)
  const [allResponses, setAllResponses] = useState<Array<{
    questionId: string;
    categoryName: string;
    response: any;
    timeTaken: number;
    timestamp: number;
    questionIndex: number;
    categoryIndex: number;
  }>>([]);

  // Track assessment start time for total duration (now managed by assessmentStorage)  
  const [assessmentStartTime] = useState<number>(Date.now());
  
  // Track current question timing and answer
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  // 🔥 REAL QUESTIONS FROM BACKEND 🔥
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [currentCategoryQuestions, setCurrentCategoryQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // 🚀 Initialize magical assessment session with REAL API
  useEffect(() => {
    initializeMagicalSession();
  }, []);

  const initializeMagicalSession = async () => {
    try {
      setIsLoading(true);
      console.log('🎯 Initializing NeuroBridge Assessment System with REAL API...');
      
      // Check for existing session or create new one
      let existingSession = assessmentStorage.getCurrentSession();
      
      if (existingSession && existingSession.responses.length > 0) {
        console.log('📖 Resuming existing session:', existingSession.sessionId);
        setSessionId(existingSession.sessionId);
        setCurrentCategoryIndex(existingSession.currentCategoryIndex);
        setAllResponses(existingSession.responses);
        
        // Use stored questions if available
        if (allQuestions.length === 0) {
          console.log('📥 Fetching fresh questions from API...');
          await fetchQuestionsFromAPI();
        }
        
        // Update current category questions
        updateCurrentCategoryQuestions();
        
        const health = assessmentStorage.healthCheck();
        console.log('🏥 Session health:', health.status, health.issues);
      } else {
        console.log('✨ Creating new assessment session with API...');
        await fetchQuestionsFromAPI();
        const newSessionId = assessmentStorage.createSession('dyslexia');
        setSessionId(newSessionId);
      }
      
      // Log storage analytics
      const progress = assessmentStorage.getProgress();
      const storageInfo = assessmentStorage.getStorageInfo();
      console.log('📊 Assessment Progress:', progress);
      console.log('💾 Storage Info:', storageInfo);
      
      setIsLoading(false);
      console.log('🎉 Assessment system ready with real questions!');
      
    } catch (error) {
      console.error('❌ Failed to initialize magical session:', error);
      setError('Failed to start assessment. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  // 🔥 FETCH REAL QUESTIONS FROM API 🔥
  const fetchQuestionsFromAPI = async () => {
    try {
      console.log('🌐 Fetching questions from backend API...');
      
      // Get student age from localStorage or default
      const preAssessmentData = getPreAssessmentData();
      const studentAge = preAssessmentData?.age || 12;
      
      // Call the real API
      const response = await apiService.startAssessment({
        student_age: studentAge,
        pre_assessment_data: preAssessmentData
      });
      
      console.log('✅ API Response received:', response);
      console.log(`📚 Total questions fetched: ${response.questions.length}`);
      
      // Store all questions
      setAllQuestions(response.questions);
      
      // Log questions by category
      const questionsByCategory = response.questions.reduce((acc: any, question: any) => {
        const categoryName = question.category.name;
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(question);
        return acc;
      }, {});
      
      console.log('📋 Questions by category:', questionsByCategory);
      
      // Set up first category questions
      updateCurrentCategoryQuestions(response.questions);
      
      return response;
      
    } catch (error) {
      console.error('❌ Failed to fetch questions from API:', error);
      throw new Error('Failed to load assessment questions. Please try again.');
    }
  };

  // 🎯 Get pre-assessment data
  const getPreAssessmentData = () => {
    try {
      const stored = localStorage.getItem('preAssessmentData');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error getting pre-assessment data:', error);
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

  // 📚 Update current category questions
  const updateCurrentCategoryQuestions = (questions = allQuestions) => {
    const categoryName = CATEGORIES[currentCategoryIndex];
    const categoryQuestions = questions.filter((question: any) => 
      question.category.name.toLowerCase() === categoryName.toLowerCase()
    );
    
    console.log(`🎯 Found ${categoryQuestions.length} questions for ${categoryName}`);
    setCurrentCategoryQuestions(categoryQuestions);
    setCurrentQuestionIndex(0);
    
    if (categoryQuestions.length === 0) {
      console.warn(`⚠️ No questions found for category: ${categoryName}`);
    }
  };

  const handleCategoryComplete = () => {
    const nextCategoryIndex = currentCategoryIndex + 1;
    
    console.log(`🎯 Category ${currentCategoryIndex + 1} completed!`);
    
    // Get latest progress
    const progress = assessmentStorage.getProgress();
    console.log('📈 Current progress:', progress);
    
    if (nextCategoryIndex >= CATEGORIES.length) {
      // 🏁 ALL categories complete - finalize assessment!
      console.log('🎉 ALL CATEGORIES COMPLETED! Finalizing assessment...');
      submitAllResponses();
      return;
    }

    // Move to next category - now with real question updates
    setShowBreak(true);
    setTimeout(() => {
      setShowBreak(false);
      setCurrentCategoryIndex(nextCategoryIndex);
      setShowIntro(true);
      
      // 📚 Update questions for new category
      updateCurrentCategoryQuestions();
      
      // Reset timing for new category
      setQuestionStartTime(Date.now());
      setSelectedAnswer(null);
    }, 5000); // 5-second break
  };

  const handleQuestionComplete = (questionId: string, response: any, timeTaken: number) => {
    if (!sessionId) {
      console.error('❌ No active session!');
      return;
    }

    // 🎯 Create magical response data
    const responseData = {
      questionId: questionId || `${CATEGORIES[currentCategoryIndex]}_q${currentQuestionIndex + 1}`,
      categoryName: CATEGORIES[currentCategoryIndex],
      response,
      timeTaken,
      timestamp: Date.now(),
      questionIndex: currentQuestionIndex,
      categoryIndex: currentCategoryIndex
    };
    
    console.log('💾 Storing response using magical storage:', responseData);
    
    // ✨ Use our magical storage service
    const success = assessmentStorage.addResponse(responseData);
    
    if (success) {
      // Update local state to trigger re-renders
      setAllResponses(assessmentStorage.getAllResponses());
      
      // Show progress update
      const progress = assessmentStorage.getProgress();
      console.log('� Updated progress:', progress);
      
      // Move to next question or category
      handleNextQuestion();
    } else {
      console.error('❌ Failed to store response');
      setError('Failed to save answer. Please try again.');
    }
  };

  // 🔄 Handle moving to next question
  const handleNextQuestion = () => {
    const nextQuestionIndex = currentQuestionIndex + 1;
    
    if (nextQuestionIndex >= currentCategoryQuestions.length) {
      // Move to next category
      console.log(`📋 All questions completed for ${CATEGORIES[currentCategoryIndex]}`);
      handleCategoryComplete();
    } else {
      // Move to next question in same category
      console.log(`➡️ Moving to question ${nextQuestionIndex + 1} of ${currentCategoryQuestions.length}`);
      setCurrentQuestionIndex(nextQuestionIndex);
      setQuestionStartTime(Date.now());
      setSelectedAnswer(null);
    }
  };

  const submitAllResponses = async () => {
    console.log('🎯 Starting assessment finalization...');
    
    try {
      setIsLoading(true);
      
      // 🏁 Complete assessment using magical storage
      const completionData = assessmentStorage.completeAssessment();
      
      if (completionData) {
        console.log('🎉 Assessment completed successfully!', completionData);
        
        // Call onComplete callback with the magical completion data
        if (onComplete && sessionId) {
          onComplete(sessionId);
        }
      } else {
        console.error('❌ No completion data available');
        if (onComplete && sessionId) {
          onComplete(sessionId); // Still call onComplete to show results
        }
      }
      
    } catch (error) {
      console.error('❌ Assessment finalization error:', error);
      setError('Unable to finalize assessment. Your progress has been saved locally.');
      
      // Still call onComplete even if there's an error
      if (onComplete && sessionId) {
        onComplete(sessionId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentCategoryComponent = () => {
    if (showIntro) {
      return (
        <CategoryIntro
          categoryName={CATEGORIES[currentCategoryIndex]}
          onStart={() => {
            setShowIntro(false);
            // Start timing when the category actually begins
            setQuestionStartTime(Date.now());
          }}
        />
      );
    }

    if (showBreak) {
      return <BreakScreen />;
    }

    // 🔥 USE REAL QUESTIONS FROM API 🔥
    if (currentCategoryQuestions.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              No Questions Available
            </h3>
            <p className="text-yellow-700 mb-4">
              No questions found for {CATEGORIES[currentCategoryIndex]}. This might be due to:
            </p>
            <ul className="text-left text-yellow-700 space-y-1 max-w-md mx-auto">
              <li>• Network connection issues</li>
              <li>• No questions configured for this category</li>
              <li>• API server temporarily unavailable</li>
            </ul>
            <button
              onClick={() => {
                console.log('🔄 Retrying question fetch...');
                fetchQuestionsFromAPI();
              }}
              className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              🔄 Retry Loading Questions
            </button>
          </div>
        </div>
      );
    }

    // Get current question
    const currentQuestion = currentCategoryQuestions[currentQuestionIndex];
    
    if (!currentQuestion) {
      return (
        <div className="p-8 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Question Not Found
            </h3>
            <p className="text-red-700">
              Question {currentQuestionIndex + 1} not found in {CATEGORIES[currentCategoryIndex]}
            </p>
          </div>
        </div>
      );
    }

    console.log('🎯 Rendering question:', currentQuestion.id, 'for', CATEGORIES[currentCategoryIndex]);
    console.log('📋 Question data:', currentQuestion);

    const componentProps = {
      question: currentQuestion,
      onAnswer: (answer: string) => {
        // Store the selected answer
        setSelectedAnswer(answer);
        console.log('✅ Answer selected:', answer, 'for question:', currentQuestion.id);
      },
      onNext: () => {
        // Calculate time taken for this question
        const timeTaken = Date.now() - questionStartTime;
        
        // Use the stored answer or a default value
        const answerToSubmit = selectedAnswer || 'completed';
        
        console.log('➡️ Moving to next question - storing locally only');
        console.log('📊 Answer:', answerToSubmit, 'Time:', timeTaken, 'ms');
        
        // Handle moving to next question and store response locally only
        handleQuestionComplete(currentQuestion.id, answerToSubmit, timeTaken);
        
        // Reset for next question
        setQuestionStartTime(Date.now());
        setSelectedAnswer(null);
      }
    };

    // Show question progress
    console.log(`📍 Current progress: Question ${currentQuestionIndex + 1}/${currentCategoryQuestions.length} in ${CATEGORIES[currentCategoryIndex]}`);

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
        return (
          <div className="p-8 text-center">
            <p className="text-gray-600">Unknown category: {CATEGORIES[currentCategoryIndex]}</p>
          </div>
        );
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
            onClick={initializeMagicalSession}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* ✨ MAGICAL PROGRESS HEADER ✨ */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  NeuroBridge Assessment
                </h1>
                <p className="text-sm text-gray-600">Cognitive Assessment in Progress</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">
                  {currentCategoryIndex + 1} of {CATEGORIES.length} Categories
                </div>
                <div className="text-xs text-gray-500">
                  {currentCategoryQuestions.length > 0 && !showIntro && !showBreak && (
                    <>Question {currentQuestionIndex + 1} of {currentCategoryQuestions.length} • </>
                  )}
                  {Math.round(((currentCategoryIndex + 1) / CATEGORIES.length) * 100)}% Complete
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {CATEGORIES.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-500 ${
                      index < currentCategoryIndex 
                        ? 'bg-green-500 scale-110 shadow-lg shadow-green-200' 
                        : index === currentCategoryIndex
                        ? 'bg-blue-500 scale-125 shadow-lg shadow-blue-200 animate-pulse'
                        : 'bg-gray-200'
                    }`}
                  >
                    {index < currentCategoryIndex && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                    {index === currentCategoryIndex && !showIntro && !showBreak && (
                      <Zap className="w-3 h-3 text-white animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* ⚡ ENHANCED PROGRESS BAR WITH QUESTION TRACKING ⚡ */}
          <div className="relative">
            <div className="w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className="h-3 rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 shadow-lg relative overflow-hidden"
                style={{ 
                  width: `${((currentCategoryIndex + (currentCategoryQuestions.length > 0 ? (currentQuestionIndex + 1) / currentCategoryQuestions.length : 0)) / CATEGORIES.length) * 100}%` 
                }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </div>
            </div>
            
            {/* Question-level progress bar for current category */}
            {currentCategoryQuestions.length > 0 && !showIntro && !showBreak && (
              <div className="mt-1">
                <div className="w-full bg-blue-100 rounded-full h-1">
                  <div 
                    className="h-1 rounded-full transition-all duration-300 bg-blue-400"
                    style={{ 
                      width: `${((currentQuestionIndex + 1) / currentCategoryQuestions.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Progress labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span className="flex items-center space-x-1">
                <Target className="w-3 h-3" />
                <span>Start</span>
              </span>
              <span className="font-medium text-blue-600">
                {CATEGORIES[currentCategoryIndex]}
                {currentCategoryQuestions.length > 0 && !showIntro && !showBreak && (
                  <span className="text-gray-500 font-normal"> • Q{currentQuestionIndex + 1}/{currentCategoryQuestions.length}</span>
                )}
              </span>
              <span className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>Complete</span>
              </span>
            </div>
          </div>

          {/* 🚀 ASSESSMENT STATUS INDICATOR 🚀 */}
          <div className="mt-3 flex items-center justify-center">
            <div className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              showIntro 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : showBreak 
                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                : 'bg-green-100 text-green-700 border border-green-200 animate-pulse'
            }`}>
              {showIntro && (
                <>
                  <Brain className="w-4 h-4 inline mr-2" />
                  Preparing {CATEGORIES[currentCategoryIndex]} Assessment
                </>
              )}
              {showBreak && (
                <>
                  <Clock className="w-4 h-4 inline mr-2" />
                  Take a moment to rest - Next: {CATEGORIES[currentCategoryIndex + 1] || 'Final Results'}
                </>
              )}
              {!showIntro && !showBreak && (
                <>
                  <Zap className="w-4 h-4 inline mr-2 animate-pulse" />
                  Active: {CATEGORIES[currentCategoryIndex]} Assessment
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🎯 MAIN ASSESSMENT CONTENT 🎯 */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          {getCurrentCategoryComponent()}
        </div>
      </div>
    </div>
  );
};

export default AssessmentMain;
