import React, { useState, useEffect } from 'react';
import type { QuestionComponentProps } from '../../types/assessment';
import { FileText, AlertCircle } from 'lucide-react';

interface TextResponseQuestionProps extends QuestionComponentProps {
  response: string | null;
  onResponseChange: (response: string) => void;
}

const TextResponseQuestion: React.FC<TextResponseQuestionProps> = ({
  question,
  response,
  onResponseChange,
  disabled = false
}) => {
  const [localResponse, setLocalResponse] = useState(response || '');
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (response !== null) {
      setLocalResponse(response);
    }
  }, [response]);

  useEffect(() => {
    const words = localResponse.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [localResponse]);

  const handleInputChange = (value: string) => {
    setLocalResponse(value);
    onResponseChange(value);
  };

  // Get expected response length from additional_data if available
  const minWords = question.additional_data?.min_words || 5;
  const maxWords = question.additional_data?.max_words || 200;

  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-3 mb-4">
        <FileText className="h-6 w-6 text-blue-600 mt-1" />
        <div>
          <div className="text-sm text-gray-600 mb-2">
            Provide a written response to the question above.
          </div>
          <div className="text-xs text-gray-500">
            Expected length: {minWords} - {maxWords} words
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <textarea
          value={localResponse}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={disabled}
          placeholder="Type your response here..."
          className={`w-full p-4 border-2 rounded-lg resize-none transition-colors ${
            disabled
              ? 'bg-gray-100 cursor-not-allowed opacity-50'
              : 'bg-white border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
          }`}
          rows={6}
          maxLength={maxWords * 10} // Rough character limit based on words
        />
        
        {/* Word Count and Validation */}
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center space-x-2 ${
            wordCount < minWords ? 'text-amber-600' : 'text-green-600'
          }`}>
            {wordCount < minWords ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-full"></div>
              </div>
            )}
            <span>
              {wordCount} word{wordCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="text-gray-500">
            {maxWords - wordCount} words remaining
          </div>
        </div>
        
        {/* Validation Messages */}
        {wordCount < minWords && localResponse.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-sm text-amber-800">
              Please provide at least {minWords} words for a complete response.
            </div>
          </div>
        )}
        
        {wordCount > maxWords && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-800">
              Response exceeds maximum length. Please shorten to {maxWords} words or less.
            </div>
          </div>
        )}
      </div>
      
      {/* Writing Guidelines */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>Writing Tips:</strong>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Write clearly and completely</li>
            <li>Use full sentences</li>
            <li>Check your spelling and grammar</li>
            <li>Take your time to think before writing</li>
          </ul>
        </div>
      </div>
      
      {/* Clinical Significance Note */}
      {question.category.clinical_significance && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Assesses:</strong> {question.category.clinical_significance}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextResponseQuestion;
