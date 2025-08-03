import React, { useState, useEffect } from 'react';
import { Question } from '../../../types/assessment';

interface SequencingProps {
  question: Question;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  disabled?: boolean;
}

const Sequencing: React.FC<SequencingProps> = ({
  question,
  onAnswer,
  onNext,
  disabled = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    if (disabled) return;
    
    setSelectedOption(optionId);
    onAnswer(optionId);
  };

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
  }, [question.id]);

  if (!question.options || question.options.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">No options available for this question.</p>
      </div>
    );
  }

  // Show alphabet strip for letter sequencing questions
  const showAlphabetStrip = question.question_text.toLowerCase().includes('letter') || 
                           question.question_text.toLowerCase().includes('alphabet');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Sequencing
        </h2>
        <div className="text-lg text-gray-600 bg-blue-50 p-4 rounded-lg">
          {question.instructions || "Choose the correct answer"}
        </div>
      </div>

      {/* Alphabet Strip (if letter question) */}
      {showAlphabetStrip && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-center text-sm text-gray-600 mb-2">Reference:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: 26 }, (_, i) => {
              const letter = String.fromCharCode(65 + i);
              return (
                <span
                  key={letter}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded text-sm font-medium"
                >
                  {letter}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Question */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
        <h3 className="text-xl font-medium text-gray-800 mb-4">
          {question.question_text}
        </h3>
      </div>

      {/* Answer Options */}
      <div className="space-y-4">
        <h4 className="text-center text-lg font-medium text-gray-700">
          Choose your answer:
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {question.options.map((option, index) => {
            const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
            const isSelected = selectedOption === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                disabled={disabled}
                className={`p-6 rounded-lg border-3 transition-all duration-200 min-h-[100px] ${
                  disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'bg-blue-500 border-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer hover:transform hover:scale-102'
                }`}
              >
                <div className="text-center">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold mx-auto mb-3 ${
                    isSelected 
                      ? 'bg-white text-blue-500 border-white' 
                      : 'border-gray-400 text-gray-600'
                  }`}>
                    {optionLabel}
                  </div>
                  <div className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                    {option.option_text}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-gray-500">
        Select the option that best answers the question
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

export default Sequencing;
