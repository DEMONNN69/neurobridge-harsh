import React, { useState, useEffect } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { Question } from '../../../types/assessment';

interface ReadingComprehensionProps {
  question: Question;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  disabled?: boolean;
}

const ReadingComprehension: React.FC<ReadingComprehensionProps> = ({
  question,
  onAnswer,
  onNext,
  disabled = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [storyPlayed, setStoryPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Get story text from additional_data or use default
  const storyText = (question.additional_data as any)?.story_text || 
                   "A big frog sat on a green log. He can hop."; // Default story

  // Text-to-speech function
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.7; // Slower for comprehension
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        setStoryPlayed(true);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Play story
  const playStory = () => {
    speakText(storyText);
  };

  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    if (!storyPlayed || disabled) return;
    
    setSelectedOption(optionId);
    onAnswer(optionId);
  };

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setStoryPlayed(false);
    setIsPlaying(false);
  }, [question.id]);

  if (!question.options || question.options.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">No options available for this question.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Reading Comprehension
        </h2>
        <div className="text-lg text-gray-600">
          Listen to the story, then answer the question
        </div>
      </div>

      {/* Story Playback Section */}
      <div className="bg-blue-50 rounded-lg p-8 text-center space-y-6">
        <h3 className="text-xl font-medium text-blue-800 mb-4">
          Story
        </h3>
        
        {/* Large Play Button */}
        <button
          onClick={playStory}
          disabled={isPlaying || disabled}
          className={`w-24 h-24 rounded-full border-4 flex items-center justify-center mx-auto transition-all duration-200 ${
            isPlaying
              ? 'bg-orange-100 border-orange-400 text-orange-600 cursor-not-allowed'
              : storyPlayed
              ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200'
              : 'bg-blue-100 border-blue-500 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {isPlaying ? (
            <div className="animate-pulse">
              <Play size={40} fill="currentColor" />
            </div>
          ) : (
            <Play size={40} fill="currentColor" />
          )}
        </button>

        <div className="space-y-2">
          <p className="text-blue-700 font-medium">
            {isPlaying ? 'Playing story...' : 
             storyPlayed ? 'Story complete - Click to replay' : 
             'Click to listen to the story'}
          </p>
          
          {storyPlayed && (
            <button
              onClick={playStory}
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <RotateCcw size={16} />
              <span>Replay Story</span>
            </button>
          )}
        </div>
      </div>

      {/* Question Section */}
      {storyPlayed && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Question:
            </h3>
            <p className="text-gray-700 text-lg">
              {question.question_text}
            </p>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-700 mb-3">
              Choose your answer:
            </h4>
            {question.options.map((option, index) => {
              const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
              const isSelected = selectedOption === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  disabled={disabled}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-500 border-blue-600 text-white shadow-lg'
                      : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold ${
                      isSelected 
                        ? 'bg-white text-blue-500 border-white' 
                        : 'border-gray-400 text-gray-600'
                    }`}>
                      {optionLabel}
                    </div>
                    <span className="text-lg">
                      {option.option_text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {!storyPlayed && (
        <div className="text-center text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
          Please listen to the story before answering the question
        </div>
      )}

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

export default ReadingComprehension;
