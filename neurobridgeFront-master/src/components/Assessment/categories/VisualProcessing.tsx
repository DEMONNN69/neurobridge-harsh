import React, { useState, useEffect } from 'react';
import { Question } from '../../../types/assessment';

interface VisualProcessingProps {
  question: Question;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  disabled?: boolean;
}

const VisualProcessing: React.FC<VisualProcessingProps> = ({
  question,
  onAnswer,
  onNext,
  disabled = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    if (disabled) return;
    
    setSelectedOption(optionId);
    onAnswer(optionId);
  };

  // Show options after a brief delay to allow visual processing
  useEffect(() => {
    setSelectedOption(null);
    setShowOptions(false);
    
    const timer = setTimeout(() => {
      setShowOptions(true);
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, [question.id]);

  if (!question.options || question.options.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">No options available for this question.</p>
      </div>
    );
  }

  const additional_data = question.additional_data as any;
  const visualType = additional_data?.visual_type || 'pattern';
  const targetImage = additional_data?.target_image;
  const showInstructions = additional_data?.show_instructions !== false;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Visual Processing
        </h2>
        {showInstructions && (
          <div className="text-lg text-gray-600 bg-blue-50 p-4 rounded-lg">
            {question.instructions || "Look carefully and choose the correct answer"}
          </div>
        )}
      </div>

      {/* Question/Visual Content */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center space-y-6">
        <h3 className="text-xl font-medium text-gray-800">
          {question.question_text}
        </h3>

        {/* Target Image or Visual Pattern */}
        {targetImage && (
          <div className="flex justify-center">
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 inline-block">
              <div className="text-6xl font-mono tracking-wider">
                {targetImage}
              </div>
            </div>
          </div>
        )}

        {/* Visual pattern display for letter/shape recognition */}
        {visualType === 'pattern' && !targetImage && (
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 rounded-lg border-2 border-gray-300">
              {/* Example pattern - this would be dynamic based on question data */}
              <div className="w-12 h-12 bg-blue-500 rounded"></div>
              <div className="w-12 h-12 bg-red-500 rounded-full"></div>
              <div className="w-12 h-12 bg-green-500"></div>
              <div className="w-12 h-12 bg-yellow-500 rounded-full"></div>
              <div className="w-12 h-12 bg-purple-500"></div>
              <div className="w-12 h-12 bg-pink-500 rounded"></div>
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      {showOptions ? (
        <div className="space-y-6">
          <h4 className="text-center text-lg font-medium text-gray-700">
            Choose your answer:
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {question.options.map((option, index) => {
              const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
              const isSelected = selectedOption === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  disabled={disabled}
                  className={`p-6 rounded-lg border-3 transition-all duration-200 min-h-[120px] ${
                    disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-500 border-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer hover:transform hover:scale-102'
                  }`}
                >
                  <div className="text-center space-y-3">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold mx-auto ${
                      isSelected 
                        ? 'bg-white text-blue-500 border-white' 
                        : 'border-gray-400 text-gray-600'
                    }`}>
                      {optionLabel}
                    </div>
                    
                    {/* Visual option content */}
                    <div className={`text-3xl font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                      {option.option_text}
                    </div>
                    
                    {/* Additional visual representation if needed */}
                    {visualType === 'shape' && (
                      <div className="flex justify-center">
                        <div className={`w-8 h-8 ${
                          option.option_text.toLowerCase().includes('circle') ? 'rounded-full bg-blue-400' :
                          option.option_text.toLowerCase().includes('square') ? 'bg-red-400' :
                          option.option_text.toLowerCase().includes('triangle') ? 'bg-green-400 transform rotate-45' :
                          'bg-gray-400'
                        }`}></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Processing visual information...</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-gray-500">
        {showOptions 
          ? "Look carefully at the visual content and select the best answer"
          : "Take a moment to observe the visual pattern"
        }
      </div>

      {/* Next Button */}
      {selectedOption && (
        <div className="text-center">
          <button
            onClick={onNext}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default VisualProcessing;
