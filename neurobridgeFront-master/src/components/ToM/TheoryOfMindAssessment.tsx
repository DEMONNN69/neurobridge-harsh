import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw, Play, Pause } from 'lucide-react';
import './TheoryOfMindAssessment.css';

// Scene configuration types
interface SceneConfig {
  id: string;
  duration: number; // in milliseconds
  autoAdvance: boolean;
  narration: string;
  audioDescription: string;
  elements: {
    sally: { x: number; y: number; visible: boolean; animation?: string };
    anne: { x: number; y: number; visible: boolean; animation?: string };
    redBall: { x: number; y: number; visible: boolean; animation?: string };
    blueBox: { x: number; y: number; visible: boolean };
    redBox: { x: number; y: number; visible: boolean };
  };
}

interface ToMQuestion {
  id: string;
  question: string;
  audioDescription: string;
  options: Array<{
    id: string;
    text: string;
    correct: boolean;
    element?: string; // which visual element this refers to
  }>;
}

interface ToMAssessmentProps {
  onComplete?: (results: ToMResults) => void;
  standalone?: boolean;
  preAssessmentData?: any;
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

// Scene configurations for Sally-Anne false belief task
const SALLY_ANNE_SCENES: SceneConfig[] = [
  {
    id: 'introduction',
    duration: 6000,
    autoAdvance: true,
    narration: "Meet Sally and Anne. They are playing together in their room.",
    audioDescription: "Two girls, Sally and Anne, are standing in a room with two boxes - one blue and one red.",    elements: {
      sally: { x: 150, y: 280, visible: true },
      anne: { x: 500, y: 280, visible: true },
      redBall: { x: 325, y: 400, visible: true },
      blueBox: { x: 200, y: 380, visible: true },
      redBox: { x: 550, y: 380, visible: true }
    }
  },
  {
    id: 'sally-hides-ball',
    duration: 7000,
    autoAdvance: true,
    narration: "Sally takes her red ball and puts it in the blue box.",
    audioDescription: "Sally picks up the red ball and places it inside the blue box.",
    elements: {
      sally: { x: 150, y: 300, visible: true, animation: 'moveToBox' },
      anne: { x: 450, y: 300, visible: true },
      redBall: { x: 200, y: 350, visible: true, animation: 'moveToBluebox' },
      blueBox: { x: 200, y: 350, visible: true },
      redBox: { x: 500, y: 350, visible: true }
    }
  },
  {
    id: 'sally-leaves',
    duration: 6000,
    autoAdvance: true,
    narration: "Sally leaves the room to go outside and play.",
    audioDescription: "Sally walks away and exits the room, leaving Anne alone with the boxes.",
    elements: {
      sally: { x: -100, y: 300, visible: false, animation: 'exitLeft' },
      anne: { x: 450, y: 300, visible: true },
      redBall: { x: 200, y: 350, visible: false }, // ball is inside blue box
      blueBox: { x: 200, y: 350, visible: true },
      redBox: { x: 500, y: 350, visible: true }
    }
  },
  {
    id: 'anne-moves-ball',
    duration: 8000,
    autoAdvance: true,
    narration: "While Sally is away, Anne moves the red ball from the blue box to the red box.",
    audioDescription: "Anne opens the blue box, takes out the red ball, and puts it in the red box instead.",
    elements: {
      sally: { x: -100, y: 300, visible: false },
      anne: { x: 350, y: 300, visible: true, animation: 'moveToBoxes' },
      redBall: { x: 500, y: 350, visible: true, animation: 'moveToRedbox' },
      blueBox: { x: 200, y: 350, visible: true },
      redBox: { x: 500, y: 350, visible: true }
    }
  },
  {
    id: 'sally-returns',
    duration: 6000,
    autoAdvance: false,
    narration: "Sally comes back and wants to find her red ball.",
    audioDescription: "Sally returns to the room and looks at both boxes - the blue box and the red box.",
    elements: {
      sally: { x: 150, y: 300, visible: true, animation: 'enterLeft' },
      anne: { x: 450, y: 300, visible: true },
      redBall: { x: 500, y: 350, visible: false }, // ball is inside red box
      blueBox: { x: 200, y: 350, visible: true },
      redBox: { x: 500, y: 350, visible: true }
    }
  }
];

const SALLY_ANNE_QUESTIONS: ToMQuestion[] = [
  {
    id: 'false-belief-location',
    question: "Where will Sally look for her red ball?",
    audioDescription: "Sally doesn't know that Anne moved the ball. Where do you think Sally will look first?",
    options: [
      {
        id: 'blue-box',
        text: "In the blue box",
        correct: true,
        element: 'blueBox'
      },
      {
        id: 'red-box', 
        text: "In the red box",
        correct: false,
        element: 'redBox'
      }
    ]
  }
];

const TheoryOfMindAssessment: React.FC<ToMAssessmentProps> = ({
  onComplete,
  standalone = false,
  preAssessmentData
}) => {
  // State management
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showQuestion, setShowQuestion] = useState(false);
  const [responses, setResponses] = useState<ToMResults['responses']>([]);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  
  // Audio and accessibility
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isNarrating, setIsNarrating] = useState(false);
    const currentScene = SALLY_ANNE_SCENES[currentSceneIndex];

  // Text-to-speech functionality with personalization
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!audioEnabled || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Adjust speech rate based on pre-assessment data - slower for better comprehension
    utterance.rate = preAssessmentData?.has_reading_difficulty ? 0.5 : 0.6;
    utterance.pitch = preAssessmentData?.age && preAssessmentData.age < 10 ? 1.2 : 1.1;
    utterance.voice = window.speechSynthesis.getVoices().find(voice => 
      voice.lang.startsWith('en') && voice.name.includes('Female')
    ) || window.speechSynthesis.getVoices()[0];
    
    utterance.onstart = () => setIsNarrating(true);
    utterance.onend = () => {
      setIsNarrating(false);
      onEnd?.();
    };
    
    window.speechSynthesis.speak(utterance);
  }, [audioEnabled, preAssessmentData]);

  // Scene progression logic
  const advanceScene = useCallback(() => {
    if (currentSceneIndex < SALLY_ANNE_SCENES.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
    } else {
      // Last scene reached, show question
      setShowQuestion(true);
      setQuestionStartTime(Date.now());
      if (audioEnabled) {
        speak(SALLY_ANNE_QUESTIONS[0].question);
      }
    }
  }, [currentSceneIndex, audioEnabled, speak]);

  // Auto-advance logic with speech completion consideration
  useEffect(() => {
    if (!isPlaying || showQuestion) return;

    const timer = setTimeout(() => {
      if (currentScene.autoAdvance) {
        // Add extra delay after speech to ensure completion and comprehension
        if (isNarrating) {
          // If still speaking, wait longer
          setTimeout(advanceScene, 2000);
        } else {
          // Add a pause after speech completion for comprehension
          setTimeout(advanceScene, 1500);
        }
      }
    }, currentScene.duration);

    return () => clearTimeout(timer);
  }, [currentSceneIndex, isPlaying, showQuestion, currentScene, advanceScene, isNarrating]);

  // Narration on scene change with better timing control
  useEffect(() => {
    if (isPlaying && audioEnabled && currentScene) {
      // Add a small delay before starting speech to ensure scene is rendered
      setTimeout(() => {
        speak(currentScene.narration, () => {
          // Speech completed - add extra pause for comprehension
          console.log('Speech completed for scene:', currentScene.id);
        });
      }, 500);
    }
  }, [currentSceneIndex, audioEnabled, isPlaying, currentScene, speak]);

  // Handle question response
  const handleResponse = (optionId: string) => {
    if (!questionStartTime) return;
    
    const responseTime = Date.now() - questionStartTime;
    const selectedOption = SALLY_ANNE_QUESTIONS[0].options.find(opt => opt.id === optionId);
    
    if (selectedOption) {
      const newResponse = {
        questionId: SALLY_ANNE_QUESTIONS[0].id,
        selectedAnswer: optionId,
        isCorrect: selectedOption.correct,
        responseTime
      };
      
      const newResponses = [...responses, newResponse];
      setResponses(newResponses);
      
      // Calculate results and complete assessment
      const totalTime = Date.now() - startTime;
      const accuracy = (newResponses.filter(r => r.isCorrect).length / newResponses.length) * 100;
      
      const results: ToMResults = {
        scenarioId: 'sally-anne-false-belief',
        responses: newResponses,
        totalTime,
        accuracy
      };
      
      onComplete?.(results);
    }
  };

  // Control functions
  const togglePlay = () => setIsPlaying(!isPlaying);
  const resetAssessment = () => {
    setCurrentSceneIndex(0);
    setShowQuestion(false);
    setResponses([]);
    setQuestionStartTime(null);
    setIsPlaying(true);
  };
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Theory of Mind Assessment
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Sally and Anne Story - Understanding Different Perspectives
            {!standalone && " (Part of Assessment)"}
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex space-x-2">
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-lg ${
              audioEnabled 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
            }`}
            title={audioEnabled ? 'Turn off audio' : 'Turn on audio'}
          >
            {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
          
          {!showQuestion && (
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
          )}
          
          <button
            onClick={resetAssessment}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            title="Reset assessment"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>      {/* Scene Container */}
      <div className="relative w-full h-[500px] bg-gradient-to-b from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
        
        {/* Scene Elements */}
        {currentScene && (
          <>
            {/* Sally */}
            {currentScene.elements.sally.visible && (
              <div 
                className={`absolute transition-all duration-1000 ease-in-out ${
                  currentScene.elements.sally.animation === 'moveToBox' ? 'tom-move-to-box' :
                  currentScene.elements.sally.animation === 'exitLeft' ? 'tom-exit-left' :
                  currentScene.elements.sally.animation === 'enterLeft' ? 'tom-enter-left' : ''
                }`}
                style={{
                  left: `${currentScene.elements.sally.x}px`,
                  top: `${currentScene.elements.sally.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}              >                <img 
                  src="/tom1/salle.png" 
                  alt="Sally - a girl with brown hair"
                  className="w-40 h-52 object-contain drop-shadow-lg"
                  onError={(e) => {
                    // Fallback if image doesn't exist
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="w-40 h-52 bg-pink-200 rounded-lg flex items-center justify-center text-lg font-semibold">Sally</div>';
                  }}
                />
              </div>
            )}

            {/* Anne */}
            {currentScene.elements.anne.visible && (
              <div 
                className={`absolute transition-all duration-1000 ease-in-out ${
                  currentScene.elements.anne.animation === 'moveToBoxes' ? 'tom-move-to-boxes' : ''
                }`}
                style={{
                  left: `${currentScene.elements.anne.x}px`,
                  top: `${currentScene.elements.anne.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}              >                <img 
                  src="/tom1/anne.png" 
                  alt="Anne - a girl with blonde hair"
                  className="w-40 h-52 object-contain drop-shadow-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="w-40 h-52 bg-yellow-200 rounded-lg flex items-center justify-center text-lg font-semibold">Anne</div>';
                  }}
                />
              </div>
            )}

            {/* Red Ball */}
            {currentScene.elements.redBall.visible && (
              <div 
                className={`absolute transition-all duration-1000 ease-in-out ${
                  currentScene.elements.redBall.animation === 'moveToBluebox' ? 'tom-move-to-bluebox' :
                  currentScene.elements.redBall.animation === 'moveToRedbox' ? 'tom-move-to-redbox' : ''
                }`}
                style={{
                  left: `${currentScene.elements.redBall.x}px`,
                  top: `${currentScene.elements.redBall.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}              >                <img 
                  src="/tom1/red ball.png" 
                  alt="Red ball"
                  className="w-20 h-20 object-contain drop-shadow-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="w-20 h-20 bg-red-500 rounded-full shadow-md"></div>';
                  }}
                />
              </div>
            )}

            {/* Blue Box */}
            {currentScene.elements.blueBox.visible && (
              <div 
                className="absolute"
                style={{
                  left: `${currentScene.elements.blueBox.x}px`,
                  top: `${currentScene.elements.blueBox.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}              >                <img 
                  src="/tom1/blue box.png" 
                  alt="Blue box"
                  className="w-32 h-24 object-contain drop-shadow-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="w-32 h-24 bg-blue-400 border-2 border-blue-600 rounded shadow-md"></div>';
                  }}
                />
              </div>
            )}

            {/* Red Box */}
            {currentScene.elements.redBox.visible && (
              <div 
                className="absolute"
                style={{
                  left: `${currentScene.elements.redBox.x}px`,
                  top: `${currentScene.elements.redBox.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}              >                <img 
                  src="/tom1/red box.png" 
                  alt="Red box"
                  className="w-32 h-24 object-contain drop-shadow-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="w-32 h-24 bg-red-400 border-2 border-red-600 rounded shadow-md"></div>';
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Narration Text */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <p className={`text-lg text-gray-800 dark:text-gray-200 ${isNarrating ? 'font-semibold' : ''}`}>
            {showQuestion ? SALLY_ANNE_QUESTIONS[0].question : currentScene?.narration}
          </p>
          {isNarrating && (
            <div className="flex items-center text-blue-600 dark:text-blue-400">
              <Volume2 className="h-4 w-4 mr-1" />
              <span className="text-sm">Speaking...</span>
            </div>
          )}
        </div>
        
        {audioEnabled && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {showQuestion ? SALLY_ANNE_QUESTIONS[0].audioDescription : currentScene?.audioDescription}
          </p>
        )}
      </div>

      {/* Question Interface */}
      {showQuestion && (
        <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
          <div className="space-y-4">
            {SALLY_ANNE_QUESTIONS[0].options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleResponse(option.id)}
                className="w-full p-4 text-left bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  {option.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {!showQuestion && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Scene {currentSceneIndex + 1} of {SALLY_ANNE_SCENES.length}</span>
            <span>{Math.round(((currentSceneIndex + 1) / SALLY_ANNE_SCENES.length) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentSceneIndex + 1) / SALLY_ANNE_SCENES.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Manual Controls */}
      {!currentScene?.autoAdvance && !showQuestion && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={advanceScene}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
          >
            Continue Story
          </button>
        </div>
      )}
    </div>
  );
};

export default TheoryOfMindAssessment;
