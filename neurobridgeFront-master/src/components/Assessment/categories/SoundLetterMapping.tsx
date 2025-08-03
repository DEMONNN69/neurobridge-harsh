import React, { useState, useEffect } from 'react';
import { Question } from '../../../types/assessment';

interface SoundLetterMappingProps {
  question: Question;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  disabled?: boolean;
}

const SoundLetterMapping: React.FC<SoundLetterMappingProps> = ({
  question,
  onAnswer,
  onNext,
  disabled = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    if (disabled || !hasPlayed) return;
    
    setSelectedOption(optionId);
    onAnswer(optionId);
  };

  // Play the instruction audio
  const playInstruction = () => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(question.question_text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onend = () => {
        setIsPlaying(false);
        setHasPlayed(true);
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
        setHasPlayed(true);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported');
      setHasPlayed(true);
    }
  };

  // Play example word if available
  const playExampleWord = () => {
    const additional_data = question.additional_data as any;
    const exampleWord = additional_data?.example_word;
    
    if (!exampleWord) return;
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(exampleWord);
      utterance.rate = 0.7;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setIsPlaying(false);
    setHasPlayed(false);
    
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

  const additional_data = question.additional_data as any;
  const exampleWord = additional_data?.example_word;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Sound-Letter Mapping
        </h2>
        <div className="text-lg text-gray-600 bg-blue-50 p-4 rounded-lg">
          Listen carefully and choose the correct letter
        </div>
      </div>

      {/* Audio Instruction Section */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">
            Listen to the instruction:
          </h3>
          
          {/* Play Instruction Button */}
          <button
            onClick={playInstruction}
            disabled={isPlaying || disabled}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
              isPlaying
                ? 'bg-blue-400 cursor-not-allowed'
                : hasPlayed
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white shadow-lg hover:shadow-xl transform hover:scale-105`}
          >
            {isPlaying ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : hasPlayed ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          
          {hasPlayed && (
            <p className="text-sm text-green-600 font-medium">
              ✓ Instruction played
            </p>
          )}
        </div>

        {/* Example Word Section */}
        {exampleWord && hasPlayed && (
          <div className="border-t pt-6 space-y-4">
            <h4 className="text-lg font-medium text-gray-700">
              Example word: <span className="text-blue-600">{exampleWord}</span>
            </h4>
            <button
              onClick={playExampleWord}
              disabled={disabled}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Play Example
            </button>
          </div>
        )}
      </div>

      {/* Letter Options */}
      {hasPlayed && (
        <div className="space-y-6">
          <h4 className="text-center text-lg font-medium text-gray-700">
            Choose the correct letter:
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {question.options.map((option) => {
              const isSelected = selectedOption === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  disabled={disabled || !hasPlayed}
                  className={`aspect-square rounded-lg border-3 transition-all duration-200 min-h-[100px] ${
                    disabled || !hasPlayed
                      ? 'opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-500 border-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer hover:transform hover:scale-102'
                  }`}
                >
                  <div className="text-4xl font-bold">
                    {option.option_text}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-gray-500">
        {!hasPlayed 
          ? "Click the play button to hear the instruction first"
          : "Select the letter that matches the sound you heard"
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

export default SoundLetterMapping;
