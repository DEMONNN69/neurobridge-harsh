import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, LogOut, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { SpeakerButton } from '../components/SpeakerButton';

// Question type components
import MultipleChoiceQuestion from '../components/Assessment/MultipleChoiceQuestion';
import TrueFalseQuestion from '../components/Assessment/TrueFalseQuestion';
import TextResponseQuestion from '../components/Assessment/TextResponseQuestion';
import SequencingQuestion from '../components/Assessment/SequencingQuestion';
import MatchingQuestion from '../components/Assessment/MatchingQuestion';
import AudioResponseQuestion from '../components/Assessment/AudioResponseQuestion';

// Assessment Types
import type {
  ManualAssessmentResponse,
  ManualAssessmentSession,
  ManualAssessmentSubmission
} from '../types/assessment';

const ManualAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, updateAssessmentStatus } = useAuth();
  
  // State management
  const [session, setSession] = useState<ManualAssessmentSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<ManualAssessmentResponse[]>([]);
  const [currentResponse, setCurrentResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [isComprehensive, setIsComprehensive] = useState(false);
  
  // Timing states
  const [assessmentStartTime, setAssessmentStartTime] = useState<number>(0);
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number>(0);
  const [displayTime, setDisplayTime] = useState<string>('00:00');
  
  // TTS configuration
  const { 
    speakQuestion, 
    stop: stopSpeech, 
    isSupported: isTTSSupported,
    setEnabled: setTTSEnabled 
  } = useTextToSpeech();
  
  const [isTTSCurrentlyEnabled, setIsTTSCurrentlyEnabled] = useState<boolean>(true);
  const hasAutoReadRef = useRef<boolean>(false);
  const isInitializingRef = useRef(false);

  // Toggle TTS on/off
  const toggleTTS = () => {
    const newState = !isTTSCurrentlyEnabled;
    setIsTTSCurrentlyEnabled(newState);
    setTTSEnabled(newState);
    if (!newState) {
      stopSpeech();
    }
  };

  // Handle manual question reading
  const handleReadQuestion = () => {
    if (session && session.questions.length > 0 && currentQuestionIndex >= 0) {
      const currentQuestion = session.questions[currentQuestionIndex];
      const questionText = `${currentQuestion.instructions || ''} ${currentQuestion.question_text}`;
      speakQuestion(questionText, currentQuestionIndex + 1);
    }
  };

  // Auto-read question when it changes
  useEffect(() => {
    if (session && session.questions.length > 0 && currentQuestionIndex >= 0 && 
        isTTSSupported && isTTSCurrentlyEnabled && !hasAutoReadRef.current && !loading) {
      const currentQuestion = session.questions[currentQuestionIndex];
      if (currentQuestion) {
        const timer = setTimeout(() => {
          const questionText = `${currentQuestion.instructions || ''} ${currentQuestion.question_text}`;
          speakQuestion(questionText, currentQuestionIndex + 1);
          hasAutoReadRef.current = true;
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [currentQuestionIndex, session, speakQuestion, isTTSSupported, isTTSCurrentlyEnabled, loading]);

  // Reset auto-read flag when question changes
  useEffect(() => {
    hasAutoReadRef.current = false;
  }, [currentQuestionIndex]);

  // Timer effect for assessment display
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (assessmentStartTime > 0 && !assessmentComplete && !loading) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - assessmentStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setDisplayTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [assessmentStartTime, assessmentComplete, loading]);

  // Initialize assessment on mount
  useEffect(() => {
    if (!assessmentComplete && !session && !isInitializingRef.current) {
      // Check if this is part of a comprehensive assessment
      const comprehensive = localStorage.getItem('comprehensiveAssessment') === 'true';
      setIsComprehensive(comprehensive);
      
      initializeAssessment();
    }
  }, []);

  // Start timing when session is loaded
  useEffect(() => {
    if (session && assessmentStartTime === 0) {
      const startTime = Date.now();
      setAssessmentStartTime(startTime);
      setCurrentQuestionStartTime(startTime);
      console.log('Manual assessment timer started at:', new Date(startTime).toISOString());
    }
  }, [session, assessmentStartTime]);

  // Reset question timer when question changes
  useEffect(() => {
    if (assessmentStartTime > 0 && currentQuestionIndex >= 0) {
      const questionStart = Date.now();
      setCurrentQuestionStartTime(questionStart);
      console.log(`Manual question ${currentQuestionIndex + 1} timer started at:`, new Date(questionStart).toISOString());
    }
  }, [currentQuestionIndex, assessmentStartTime]);

  const initializeAssessment = async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    try {
      setLoading(true);
      setError(null);
      
      // Get student age from profile or pre-assessment
      const preAssessmentData = await getPreAssessmentData();
      const studentAge = preAssessmentData?.age || 12; // Default age if not found
      
      console.log('Initializing manual assessment for age:', studentAge);
      
      // Fetch age-appropriate questions from backend
      const response = await apiService.startManualAssessment(studentAge);
      
      setSession(response);
      
      // Initialize responses array
      setResponses(new Array(response.questions.length).fill(null));
      
      console.log('Manual assessment initialized:', {
        sessionId: response.session_id,
        questionCount: response.questions.length,
        studentAge: response.student_age
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize manual assessment');
    } finally {
      setLoading(false);
      isInitializingRef.current = false;
    }
  };

  const getPreAssessmentData = async () => {
    try {
      const profileResponse = await apiService.getPreAssessmentData();
      if (profileResponse && profileResponse.data) {
        return profileResponse.data;
      }
    } catch (error) {
      console.warn('Failed to fetch pre-assessment data from profile:', error);
    }
    
    // Fallback to localStorage
    const preAssessmentDataStr = localStorage.getItem('preAssessmentData');
    if (preAssessmentDataStr) {
      try {
        return JSON.parse(preAssessmentDataStr);
      } catch (parseError) {
        console.warn('Failed to parse localStorage pre-assessment data:', parseError);
      }
    }
    
    return null;
  };

  const handleResponseChange = (responseData: any) => {
    setCurrentResponse(responseData);
  };

  const handleNext = () => {
    if (!currentResponse || !session) return;

    // Calculate response time
    const questionEndTime = Date.now();
    const responseTime = (questionEndTime - currentQuestionStartTime) / 1000;

    // Create response object
    const newResponse: ManualAssessmentResponse = {
      question_id: session.questions[currentQuestionIndex].id,
      response_data: currentResponse,
      response_time: responseTime,
      start_time: currentQuestionStartTime,
      end_time: questionEndTime
    };

    // Update responses array
    const updatedResponses = [...responses];
    updatedResponses[currentQuestionIndex] = newResponse;
    setResponses(updatedResponses);

    console.log('Manual question response:', {
      questionIndex: currentQuestionIndex,
      questionId: newResponse.question_id,
      responseTime: responseTime.toFixed(2) + ' seconds',
      responseData: currentResponse
    });

    // Reset current response
    setCurrentResponse(null);

    // Check if assessment is complete
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitAssessment(updatedResponses);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Load previous response if exists
      const previousResponse = responses[currentQuestionIndex - 1];
      if (previousResponse) {
        setCurrentResponse(previousResponse.response_data);
      }
    }
  };

  const submitAssessment = async (finalResponses: ManualAssessmentResponse[]) => {
    if (!session) return;

    try {
      setSubmitting(true);
      
      const totalTime = Math.floor((Date.now() - assessmentStartTime) / 1000);
      
      const submission: ManualAssessmentSubmission = {
        session_id: session.session_id,
        responses: finalResponses,
        total_time: totalTime,
        student_age: session.student_age,
        completion_status: 'completed'
      };

      console.log('Submitting manual assessment:', {
        sessionId: submission.session_id,
        responseCount: finalResponses.length,
        totalTime: totalTime + ' seconds',
        studentAge: submission.student_age
      });

      const result = await apiService.submitManualAssessment(submission);
      setAssessmentResult(result);
      setAssessmentComplete(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit manual assessment');
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleCompleteAssessment = () => {
    if (isComprehensive) {
      // Store dyslexia results for later combination
      localStorage.setItem('dyslexiaAssessmentResult', JSON.stringify(assessmentResult));
      localStorage.setItem('dyslexiaAssessmentResponses', JSON.stringify(responses));
      
      // Clear comprehensive flag and navigate to autism assessment
      localStorage.removeItem('comprehensiveAssessment');
      localStorage.setItem('autismAfterDyslexia', 'true');
      
      navigate('/student/assessment', { 
        state: { assessmentType: 'autism', fromManualDyslexia: true },
        replace: true 
      });
    } else {
      // Single dyslexia assessment - proceed to dashboard
      updateAssessmentStatus(true);
      navigate('/student/dashboard?manual_assessment_completed=true', { replace: true });
    }
  };

  // Render question based on type
  const renderQuestion = () => {
    if (!session || !session.questions[currentQuestionIndex]) return null;

    const question = session.questions[currentQuestionIndex];
    const commonProps = {
      question,
      response: currentResponse,
      onResponseChange: handleResponseChange,
      disabled: submitting
    };

    switch (question.question_type) {
      case 'multiple_choice':
        return <MultipleChoiceQuestion {...commonProps} />;
      case 'true_false':
        return <TrueFalseQuestion {...commonProps} />;
      case 'text_response':
        return <TextResponseQuestion {...commonProps} />;
      case 'sequencing':
        return <SequencingQuestion {...commonProps} />;
      case 'matching':
        return <MatchingQuestion {...commonProps} />;
      case 'audio_response':
        return <AudioResponseQuestion {...commonProps} />;
      default:
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">Unsupported question type: {question.question_type}</p>
          </div>
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your personalized assessment...</p>
          <p className="text-sm text-gray-500">Selecting age-appropriate questions</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Assessment Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={initializeAssessment}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Completion state
  if (assessmentComplete && assessmentResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-green-600 mb-4">
            <CheckCircle className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {isComprehensive ? 'Dyslexia Assessment Complete!' : 'Assessment Complete!'}
          </h2>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Questions Completed</p>
                <p className="font-semibold text-lg">{session?.questions.length || 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Time</p>
                <p className="font-semibold text-lg">{displayTime}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              {isComprehensive 
                ? 'Your dyslexia assessment responses have been recorded. Next, you will complete the autism assessment.'
                : 'Your responses have been analyzed for dyslexia assessment.'
              }
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                {isComprehensive
                  ? 'After completing both assessments, results will be combined for comprehensive analysis.'
                  : 'Results will be combined with your previous assessments for comprehensive analysis.'
                }
              </p>
            </div>
          </div>

          <button
            onClick={handleCompleteAssessment}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            {isComprehensive ? 'Continue to Autism Assessment' : 'Continue to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  // Submitting state
  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Analyzing your responses...</p>
          <p className="text-sm text-gray-500">Processing dyslexia assessment data</p>
        </div>
      </div>
    );
  }

  if (!session || session.questions.length === 0) {
    return null;
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b-2 border-blue-100">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              {isComprehensive 
                ? 'Comprehensive Assessment - Dyslexia Phase' 
                : 'Dyslexia Assessment - Manual Questions'
              }
            </h1>
            
            <div className="flex items-center space-x-4">
              {/* Assessment Timer */}
              <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg">
                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Time: {displayTime}</span>
              </div>
              
              {/* Question Counter */}
              <div className="flex items-center text-sm text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">
                  Question {currentQuestionIndex + 1} of {session.questions.length}
                </span>
              </div>
              
              {/* Age Badge */}
              <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Age: {session.student_age} years
              </div>
              
              {/* Logout Button */}
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
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Question Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {currentQuestion.difficulty_level.name}
                </span>
                <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                  {currentQuestion.category.name}
                </span>
                <span className="text-sm text-gray-600">
                  {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                </span>
              </div>
              
              {/* TTS Controls */}
              <div className="flex items-center space-x-2">
                {isTTSSupported && (
                  <>
                    <button
                      onClick={toggleTTS}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        isTTSCurrentlyEnabled 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={`Turn ${isTTSCurrentlyEnabled ? 'off' : 'on'} text-to-speech`}
                    >
                      TTS {isTTSCurrentlyEnabled ? 'ON' : 'OFF'}
                    </button>
                    <SpeakerButton
                      onClick={handleReadQuestion}
                      disabled={!isTTSCurrentlyEnabled}
                      size="sm"
                      variant="secondary"
                    />
                  </>
                )}
              </div>
            </div>
            
            {/* Question Title */}
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {currentQuestion.title}
            </h2>
            
            {/* Instructions */}
            {currentQuestion.instructions && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Instructions:</strong> {currentQuestion.instructions}
                </p>
              </div>
            )}
            
            {/* Question Text */}
            <div className="text-lg text-gray-800 leading-relaxed">
              {currentQuestion.question_text}
            </div>
            
            {/* Media Placeholders */}
            {currentQuestion.image && (
              <div className="mt-4 p-6 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <div className="text-gray-500">
                  📷 Image Content Placeholder
                </div>
                <p className="text-sm text-gray-400 mt-1">Image will be displayed here</p>
              </div>
            )}
            
            {currentQuestion.audio_file && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-blue-800">
                  🔊 Audio Content Available
                </div>
                <p className="text-sm text-blue-600 mt-1">Audio player will be implemented here</p>
              </div>
            )}
          </div>

          {/* Question Component */}
          <div className="p-6">
            {renderQuestion()}
          </div>

          {/* Navigation */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                currentQuestionIndex === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Previous
            </button>

            <div className="text-sm text-gray-500">
              {currentQuestion.time_limit && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                  Time Limit: {currentQuestion.time_limit}s
                </span>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={!currentResponse}
              className={`flex items-center px-6 py-2 rounded-md transition-colors ${
                currentResponse
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {currentQuestionIndex === session.questions.length - 1 ? 'Complete Assessment' : 'Next Question'}
              {currentQuestionIndex < session.questions.length - 1 && (
                <ChevronRight className="h-5 w-5 ml-1" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualAssessmentPage;
