import React, { useState, useEffect } from 'react';
import { Volume2, Play } from 'lucide-react';
import { Question } from '../../../types/assessment';

interface PhonologicalAwarenessProps {
  question: Question;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  disabled?: boolean;
}

const PhonologicalAwareness: React.FC<PhonologicalAwarenessProps> = ({
  question,
  onAnswer,
  onNext,
  disabled = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [playedAudios, setPlayedAudios] = useState<Set<string>>(new Set());
  const [allAudiosPlayed, setAllAudiosPlayed] = useState(false);

  // Text-to-speech function
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Play audio for option
  const playOptionAudio = (optionId: string, text: string) => {
    speakText(text);
    const newPlayedAudios = new Set(playedAudios);
    newPlayedAudios.add(optionId);
    setPlayedAudios(newPlayedAudios);
    
    // Check if all audios have been played
    if (newPlayedAudios.size === question.options?.length) {
      setAllAudiosPlayed(true);
    }
  };

  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    if (!allAudiosPlayed || disabled) return;
    
    setSelectedOption(optionId);
    onAnswer(optionId);
  };

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setPlayedAudios(new Set());
    setAllAudiosPlayed(false);
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
      {/* Instructions */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Phonological Awareness
        </h2>
        <div className="text-lg text-gray-600 bg-blue-50 p-4 rounded-lg">
          {question.instructions || question.question_text}
        </div>
        {!allAudiosPlayed && (
          <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
            Please listen to all words before making your selection
          </div>
        )}
      </div>

      {/* Audio Options Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {question.options.map((option, index) => {
          const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
          const isPlayed = playedAudios.has(option.id);
          const isSelected = selectedOption === option.id;
          const canSelect = allAudiosPlayed && !disabled;

          return (
            <div
              key={option.id}
              className="flex flex-col items-center space-y-3"
            >
              {/* Audio Play Button */}
              <button
                onClick={() => playOptionAudio(option.id, option.option_text)}
                className={`w-20 h-20 rounded-full border-3 flex items-center justify-center transition-all duration-200 ${
                  isPlayed
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-blue-100 border-blue-500 text-blue-700 hover:bg-blue-200'
                }`}
                disabled={disabled}
              >
                {isPlayed ? (
                  <Volume2 size={32} />
                ) : (
                  <Play size={32} />
                )}
              </button>

              {/* Option Card */}
              <button
                onClick={() => handleOptionSelect(option.id)}
                disabled={!canSelect}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 min-h-[80px] ${
                  !canSelect
                    ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                    : isSelected
                    ? 'bg-blue-500 border-blue-600 text-white shadow-lg'
                    : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold text-lg mb-1">
                    {optionLabel}
                  </div>
                  <div className={`text-sm ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                    {option.option_text}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Progress Indicator */}
      <div className="text-center">
        <div className="text-sm text-gray-500">
          Audio Progress: {playedAudios.size} / {question.options.length} played
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(playedAudios.size / question.options.length) * 100}%` 
            }}
          />
        </div>
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

export default PhonologicalAwareness;
