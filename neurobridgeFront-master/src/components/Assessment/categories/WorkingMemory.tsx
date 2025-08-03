import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../../../types/assessment';

interface WorkingMemoryProps {
  question: Question;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  disabled?: boolean;
}

const WorkingMemory: React.FC<WorkingMemoryProps> = ({
  question,
  onAnswer,
  onNext,
  disabled = false
}) => {
  const [hasPlayedSentence, setHasPlayedSentence] = useState(false);
  const [isPlayingSentence, setIsPlayingSentence] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [recordingText, setRecordingText] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);

  // Play the sentence audio
  const playSentence = () => {
    if ('speechSynthesis' in window) {
      setIsPlayingSentence(true);
      const utterance = new SpeechSynthesisUtterance(question.question_text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onend = () => {
        setIsPlayingSentence(false);
        setHasPlayedSentence(true);
      };
      
      utterance.onerror = () => {
        setIsPlayingSentence(false);
        setHasPlayedSentence(true);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported');
      setHasPlayedSentence(true);
    }
  };

  // Start recording with speech recognition
  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup MediaRecorder for actual recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Setup Speech Recognition for live transcription
      if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setRecordingText(transcript);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };
        
        recognitionRef.current = recognition;
        recognition.start();
      }
      
      setIsRecording(true);
      mediaRecorder.start();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access to record your response.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsRecording(false);
    setHasRecorded(true);
    setShowTranscript(true);
    
    // Submit the recorded text as the answer
    onAnswer(recordingText || 'No speech detected');
  };

  // Reset state when question changes
  useEffect(() => {
    setHasPlayedSentence(false);
    setIsPlayingSentence(false);
    setIsRecording(false);
    setHasRecorded(false);
    setRecordingText('');
    setShowTranscript(false);
    
    // Stop any ongoing speech/recording
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [question.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Working Memory
        </h2>
        <div className="text-lg text-gray-600 bg-blue-50 p-4 rounded-lg">
          Listen to the sentence and repeat it back
        </div>
      </div>

      {/* Sentence Playback Section */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center space-y-6">
        <h3 className="text-lg font-medium text-gray-700">
          Step 1: Listen to the sentence
        </h3>
        
        {/* Play Sentence Button */}
        <button
          onClick={playSentence}
          disabled={isPlayingSentence || disabled}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 ${
            isPlayingSentence
              ? 'bg-blue-400 cursor-not-allowed'
              : hasPlayedSentence
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white shadow-lg hover:shadow-xl transform hover:scale-105 mx-auto`}
        >
          {isPlayingSentence ? (
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : hasPlayedSentence ? (
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
        
        {hasPlayedSentence && (
          <p className="text-sm text-green-600 font-medium">
            ✓ Sentence played. Now record your response below.
          </p>
        )}
      </div>

      {/* Recording Section */}
      {hasPlayedSentence && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center space-y-6">
          <h3 className="text-lg font-medium text-gray-700">
            Step 2: Record your response
          </h3>
          
          {/* Recording Button */}
          <div className="space-y-4">
            {!hasRecorded ? (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={disabled}
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white shadow-lg hover:shadow-xl transform hover:scale-105 mx-auto`}
              >
                <div className="space-y-2 text-center">
                  <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                  </svg>
                  <div className="text-sm">
                    {isRecording ? 'Recording...\nTap to Stop' : 'Tap to Record'}
                  </div>
                </div>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="w-32 h-32 rounded-full bg-green-500 flex items-center justify-center mx-auto">
                  <div className="space-y-2 text-center text-white">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="text-sm">Recorded!</div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setHasRecorded(false);
                    setRecordingText('');
                    setShowTranscript(false);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Record Again
                </button>
              </div>
            )}
          </div>

          {/* Live Transcript */}
          {isRecording && recordingText && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium mb-2">Live transcript:</p>
              <p className="text-gray-800">{recordingText}</p>
            </div>
          )}

          {/* Final Transcript */}
          {showTranscript && recordingText && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium mb-2">Your response:</p>
              <p className="text-gray-800 font-medium">{recordingText}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="text-center text-sm text-gray-500">
            {!isRecording && !hasRecorded && "Tap the microphone to start recording"}
            {isRecording && "Speak clearly and tap again when finished"}
            {hasRecorded && "Response recorded successfully"}
          </div>
        </div>
      )}

      {/* Browser Compatibility Notice */}
      <div className="text-center text-xs text-gray-400">
        Note: This feature requires microphone access and works best in Chrome/Edge browsers
      </div>

      {/* Next Button */}
      {hasRecorded && (
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

export default WorkingMemory;
