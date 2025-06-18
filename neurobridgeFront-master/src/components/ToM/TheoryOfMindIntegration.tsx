import React, { useState } from 'react';
import TheoryOfMindAssessment from './TheoryOfMindAssessment';

interface ToMIntegrationProps {
  onComplete: (results: any) => void;
  preAssessmentData?: any;
  assessmentType: 'autism' | 'both';
}

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

const TheoryOfMindIntegration: React.FC<ToMIntegrationProps> = ({
  onComplete,
  preAssessmentData,
  assessmentType
}) => {
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = () => {
    setIsStarted(true);
  };

  const handleToMComplete = (results: ToMResults) => {
    // Transform ToM results to match the existing assessment format
    const transformedResults = {
      session_id: `tom-${Date.now()}`,
      assessment_type: 'theory_of_mind',
      answers: results.responses.map((response) => ({
        question_id: response.questionId,
        selected_answer: response.selectedAnswer,
        is_correct: response.isCorrect,
        response_time: response.responseTime / 1000
      })),
      total_questions: results.responses.length,
      correct_answers: results.responses.filter(r => r.isCorrect).length,
      total_assessment_time: results.totalTime / 1000,
      tom_data: {
        scenario_id: results.scenarioId,
        accuracy: results.accuracy,
        response_times: results.responses.map(r => r.responseTime)
      }
    };

    onComplete(transformedResults);
  };

  if (!isStarted) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {/* Introduction */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Theory of Mind Assessment
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This assessment helps us understand how you think about other people's perspectives. 
            You'll watch a short story and answer questions about what the characters might think or do.
          </p>
          
          {/* Assessment info based on type */}
          {assessmentType === 'autism' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <p className="text-blue-800 dark:text-blue-200">
                This is part of your autism assessment. Theory of Mind skills help us understand 
                social communication patterns.
              </p>
            </div>
          )}
          
          {assessmentType === 'both' && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
              <p className="text-purple-800 dark:text-purple-200">
                This Theory of Mind assessment is included as part of your comprehensive evaluation 
                to better understand your social reasoning abilities.
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <strong className="text-gray-900 dark:text-white">Visual Story:</strong>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Watch animated characters in a social scenario
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <strong className="text-gray-900 dark:text-white">Audio Support:</strong>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Listen to narration and descriptions
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <strong className="text-gray-900 dark:text-white">No Time Pressure:</strong>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Take your time to think about your answers
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
            <div>
              <strong className="text-gray-900 dark:text-white">Simple Questions:</strong>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Easy-to-understand multiple choice format
              </p>
            </div>
          </div>
        </div>

        {/* Personalization based on pre-assessment */}
        {preAssessmentData && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Personalized for You:
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              {preAssessmentData.age && preAssessmentData.age < 10 && (
                <li>• Extra visual cues and slower narration for younger learners</li>
              )}
              {preAssessmentData.has_reading_difficulty && (
                <li>• Audio narration will be emphasized over text</li>
              )}
              {preAssessmentData.needs_assistance && (
                <li>• Clear, simple language and extra explanation time</li>
              )}
            </ul>
          </div>
        )}

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={handleStart}
            className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-medium transition-colors"
          >
            Start Theory of Mind Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <TheoryOfMindAssessment 
      onComplete={handleToMComplete}
      preAssessmentData={preAssessmentData}
      standalone={false}
    />
  );
};

export default TheoryOfMindIntegration;
