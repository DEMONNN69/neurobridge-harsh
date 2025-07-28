import React from 'react';
import type { QuestionComponentProps } from '../../types/assessment';
import { ReadableOption } from '../ReadableOption';

interface MultipleChoiceQuestionProps extends QuestionComponentProps {
  response: string | null;
  onResponseChange: (response: string) => void;
}

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  response,
  onResponseChange,
  disabled = false
}) => {
  const handleOptionSelect = (optionId: string) => {
    if (disabled) return;
    onResponseChange(optionId);
  };

  // Ensure we have options
  if (!question.options || question.options.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">No options available for this question.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Select the best answer:
      </div>
      
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
          const isSelected = response === option.id;
          
          return (
            <ReadableOption
              key={option.id}
              optionLabel={optionLabel}
              optionText={option.option_text}
              isSelected={isSelected}
              onClick={() => handleOptionSelect(option.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer ${
                disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 text-sm font-medium flex-shrink-0 ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {optionLabel}
                </span>
                <div className="flex-grow">
                  <div className="text-gray-900 leading-relaxed">
                    {option.option_text}
                  </div>
                  
                  {/* Option Image Placeholder */}
                  {option.option_image && (
                    <div className="mt-3 p-3 bg-gray-100 border border-dashed border-gray-300 rounded text-center">
                      <div className="text-gray-500 text-sm">
                        🖼️ Option Image Placeholder
                      </div>
                    </div>
                  )}
                  
                  {/* Option Audio Placeholder */}
                  {option.option_audio && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                      <div className="text-blue-700 text-sm flex items-center">
                        🔊 Audio option available
                      </div>
                    </div>
                  )}
                  
                  {/* Explanation (shown only if this is for review) */}
                  {option.explanation && disabled && (
                    <div className="mt-2 p-2 bg-gray-50 border-l-4 border-gray-300 rounded">
                      <div className="text-gray-700 text-sm">
                        <strong>Explanation:</strong> {option.explanation}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ReadableOption>
          );
        })}
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

export default MultipleChoiceQuestion;
