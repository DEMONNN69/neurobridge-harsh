import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft, CheckCircle } from 'lucide-react';
import TheoryOfMindAssessment from '../components/ToM/TheoryOfMindAssessment';
import { apiService } from '../services/api';
import '../components/ToM/TheoryOfMindAssessment.css';

interface ToMResults {
  scenarioId: string;
  responses: Array<{
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
    responseTime: number;
  }>;
  totalTime: number;
  accuracy: number;
}

const TheoryOfMindPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<ToMResults | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssessmentComplete = async (assessmentResults: ToMResults) => {
    setResults(assessmentResults);
    setSaving(true);
    setError(null);

    try {
      // Save results using existing API pattern
      await apiService.submitAssessment({
        session_id: `tom-${Date.now()}`,
        assessment_type: 'theory_of_mind',        answers: assessmentResults.responses.map((response) => ({
          question_id: response.questionId,
          selected_answer: response.selectedAnswer,
          is_correct: response.isCorrect,
          response_time: response.responseTime / 1000 // convert to seconds
        })),
        total_questions: assessmentResults.responses.length,
        correct_answers: assessmentResults.responses.filter(r => r.isCorrect).length,
        total_assessment_time: assessmentResults.totalTime / 1000,        question_timings: assessmentResults.responses.map((response) => ({
          question_id: response.questionId,
          start_time: 0, // Since we don't track individual start times
          end_time: response.responseTime / 1000,
          response_time: response.responseTime / 1000
        }))
      });

      setIsCompleted(true);
    } catch (err) {
      console.error('Error saving Theory of Mind assessment:', err);
      setError(err instanceof Error ? err.message : 'Failed to save assessment results');
    } finally {
      setSaving(false);
    }
  };

  const handleReturnToDashboard = () => {
    navigate('/student');
  };

  const handleRetakeAssessment = () => {
    setIsCompleted(false);
    setResults(null);
    setError(null);
  };

  if (saving) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Saving your assessment results...</p>
        </div>
      </div>
    );
  }

  if (isCompleted && results) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={handleReturnToDashboard}
              className="mr-4 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Brain className="h-8 w-8 mr-3 text-purple-600" />
                Theory of Mind Assessment
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Assessment Complete
              </p>
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Assessment Completed Successfully!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your responses have been recorded and will help us understand your perspective-taking abilities.
              </p>
            </div>

            {/* Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {results.accuracy.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {results.responses.filter(r => r.isCorrect).length}/{results.responses.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Correct Answers</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(results.totalTime / 1000)}s
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Time</div>
              </div>
            </div>

            {/* Understanding Theory of Mind */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Understanding Theory of Mind
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Theory of Mind is the ability to understand that other people have thoughts, beliefs, and knowledge 
                that may be different from your own. This skill is important for social interactions and communication.
              </p>
              
              {results.accuracy >= 80 ? (
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <p className="text-green-800 dark:text-green-200">
                    <strong>Great job!</strong> Your responses show good understanding of different perspectives. 
                    You demonstrated that you can think about what others might know or believe, even when it's 
                    different from what you know.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-blue-800 dark:text-blue-200">
                    This assessment helps us understand how you think about other people's perspectives. 
                    Everyone develops these skills at their own pace, and there are many ways to continue 
                    practicing perspective-taking in daily life.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRetakeAssessment}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Take Assessment Again
              </button>
              <button
                onClick={handleReturnToDashboard}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300">
                <strong>Note:</strong> There was an issue saving your results: {error}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Your responses were recorded locally. Please contact your teacher if this issue persists.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Brain className="h-8 w-8 mr-3 text-purple-600" />
              Theory of Mind Assessment
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Understanding Different Perspectives - Sally and Anne Story
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Assessment Instructions
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              You'll watch a short story about two characters, Sally and Anne. Pay close attention to what happens!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <strong>Watch the story:</strong> Scenes will play automatically, showing what Sally and Anne do
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <strong>Listen carefully:</strong> Audio narration will explain what's happening
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <strong>Answer questions:</strong> At the end, you'll be asked about what you think will happen
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <strong>Take your time:</strong> There are no time limits, so think carefully about your answers
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Component */}
        <TheoryOfMindAssessment 
          onComplete={handleAssessmentComplete}
          standalone={true}
        />
      </div>
    </div>
  );
};

export default TheoryOfMindPage;
