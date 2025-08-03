import React, { useState, useEffect } from 'react';
import { Question } from '../../../types/assessment';

interface WordRecognitionProps {
  question: Question;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  disabled?: boolean;
}

const WordRecognition: React.FC<WordRecognitionProps> = ({
  question,
  onAnswer,
  onNext,
  disabled = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasPlayedInstruction, setHasPlayedInstruction] = useState(false);
  const [isPlayingInstruction, setIsPlayingInstruction] = useState(false);

  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    if (disabled || !hasPlayedInstruction) return;
    
    setSelectedOption(optionId);
    onAnswer(optionId);
  };

  // Play the instruction audio
  const playInstruction = () => {
    if ('speechSynthesis' in window) {
      setIsPlayingInstruction(true);
      const utterance = new SpeechSynthesisUtterance(question.question_text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onend = () => {
        setIsPlayingInstruction(false);
        setHasPlayedInstruction(true);
      };
      
      utterance.onerror = () => {
        setIsPlayingInstruction(false);
        setHasPlayedInstruction(true);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported');
      setHasPlayedInstruction(true);
    }
  };

  // Play word from option
  const playWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.7;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setHasPlayedInstruction(false);
    setIsPlayingInstruction(false);
    
    // Stop any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [question.id]);

  if (!question.options || question.options.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">No options available for this question.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Word Recognition
        </h2>
        <div className="text-lg text-gray-600 bg-blue-50 p-4 rounded-lg">
          Listen to the instruction and select the correct word
        </div>
      </div>

      {/* Instruction Section */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center space-y-6">
        <h3 className="text-lg font-medium text-gray-700">
          Click to hear the instruction:
        </h3>
        
        {/* Play Instruction Button */}
        <button
          onClick={playInstruction}
          disabled={isPlayingInstruction || disabled}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 ${
            isPlayingInstruction
              ? 'bg-blue-400 cursor-not-allowed'
              : hasPlayedInstruction
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white shadow-lg hover:shadow-xl transform hover:scale-105 mx-auto`}
        >
          {isPlayingInstruction ? (
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : hasPlayedInstruction ? (
            <div className="space-y-1">
              <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="text-xs">Replay</div>
            </div>
          ) : (
            <div className="space-y-1">
              <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <div className="text-xs">Listen</div>
            </div>
          )}
        </button>
        
        {hasPlayedInstruction && (
          <p className="text-sm text-green-600 font-medium">
            ✓ Instruction played. Now choose the correct word.
          </p>
        )}
      </div>

      {/* Word Cards */}
      {hasPlayedInstruction && (
        <div className="space-y-6">
          <h4 className="text-center text-lg font-medium text-gray-700">
            Word Cards - Click to hear each word:
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {question.options.map((option, index) => {
              const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
              const isSelected = selectedOption === option.id;

              return (
                <div key={option.id} className="space-y-3">
                  {/* Word Card */}
                  <div className={`bg-white border-3 rounded-lg p-6 transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 shadow-lg transform scale-105'
                      : 'border-gray-300'
                  }`}>
                    <div className="text-center space-y-4">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold mx-auto ${
                        isSelected 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'border-gray-400 text-gray-600'
                      }`}>
                        {optionLabel}
                      </div>
                      
                      <div className="text-2xl font-bold text-gray-800 min-h-[2rem]">
                        {option.option_text}
                      </div>
                      
                      {/* Listen to Word Button */}
                      <button
                        onClick={() => playWord(option.option_text)}
                        disabled={disabled}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm flex items-center gap-2 mx-auto"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Listen
                      </button>
                    </div>
                  </div>
                  
                  {/* Select Button */}
                  <button
                    onClick={() => handleOptionSelect(option.id)}
                    disabled={disabled}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                      disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-700'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select This Word'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-gray-500">
        {!hasPlayedInstruction 
          ? "Click the play button to hear the instruction first"
          : "Listen to each word and select the one that matches the instruction"
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

export default WordRecognition;
