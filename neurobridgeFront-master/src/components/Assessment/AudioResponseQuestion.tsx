import React, { useState, useRef } from 'react';
import type { QuestionComponentProps } from '../../types/assessment';
import { Mic, Square, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';

interface AudioResponseQuestionProps extends QuestionComponentProps {
  response: string | null; // Base64 encoded audio data
  onResponseChange: (response: string) => void;
}

const AudioResponseQuestion: React.FC<AudioResponseQuestionProps> = ({
  question,
  response,
  onResponseChange,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get time limits from question data
  const minSeconds = question.additional_data?.min_duration || 5;
  const maxSeconds = question.additional_data?.max_duration || 60;

  const startRecording = async () => {
    if (disabled) return;

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        
        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onResponseChange(base64data);
        };
        reader.readAsDataURL(audioBlob);

        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop at max duration
          if (newTime >= maxSeconds) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (err) {
      setError('Could not access microphone. Please check your permissions.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (!response) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(response);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsPlaying(false);
      setError('Could not play recording');
    };

    audio.play().catch(() => {
      setError('Could not play recording');
      setIsPlaying(false);
    });
  };

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (disabled) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    onResponseChange('');
    setIsPlaying(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canRecord = !disabled && !isRecording;
  const hasRecording = response && response.length > 0;
  const recordingTooShort = recordingTime > 0 && recordingTime < minSeconds;
  const recordingTimeWarning = recordingTime >= maxSeconds - 10 && recordingTime < maxSeconds;

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600 mb-4">
        Record your spoken response to the question above:
      </div>
      
      {/* Recording Controls */}
      <div className="bg-gray-50 p-6 rounded-lg border">
        <div className="flex flex-col items-center space-y-4">
          {/* Recording Button */}
          {!hasRecording ? (
            <div className="flex items-center space-x-4">
              <button
                onClick={canRecord ? startRecording : stopRecording}
                disabled={disabled}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  disabled
                    ? 'bg-gray-300 cursor-not-allowed'
                    : isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                }`}
              >
                {isRecording ? (
                  <Square className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </button>
              
              <div className="text-center">
                <div className="text-lg font-medium text-gray-900">
                  {isRecording ? 'Recording...' : 'Click to Record'}
                </div>
                <div className="text-sm text-gray-500">
                  Duration: {minSeconds}-{maxSeconds} seconds
                </div>
              </div>
            </div>
          ) : (
            /* Playback Controls */
            <div className="flex items-center space-x-4">
              <button
                onClick={isPlaying ? pausePlayback : playRecording}
                disabled={disabled}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  disabled
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-1" />
                )}
              </button>
              
              <div className="text-center">
                <div className="text-lg font-medium text-gray-900">
                  {isPlaying ? 'Playing...' : 'Recording Ready'}
                </div>
                <div className="text-sm text-gray-500">
                  Click play to review
                </div>
              </div>
              
              <button
                onClick={deleteRecording}
                disabled={disabled}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  disabled
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title="Delete recording"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>
          )}
          
          {/* Recording Timer */}
          {isRecording && (
            <div className={`text-2xl font-mono ${
              recordingTimeWarning ? 'text-orange-600' : 'text-blue-600'
            }`}>
              {formatTime(recordingTime)} / {formatTime(maxSeconds)}
            </div>
          )}
        </div>
      </div>
      
      {/* Status Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-800">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
      
      {recordingTooShort && !isRecording && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center text-amber-800">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">
              Recording is too short. Please record for at least {minSeconds} seconds.
            </span>
          </div>
        </div>
      )}
      
      {recordingTimeWarning && isRecording && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center text-orange-800">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">
              Recording will stop automatically in {maxSeconds - recordingTime} seconds.
            </span>
          </div>
        </div>
      )}
      
      {hasRecording && recordingTime >= minSeconds && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-green-800">
            <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm">
              Recording completed successfully! Duration: {formatTime(recordingTime)}
            </span>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>Recording Tips:</strong>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Speak clearly and at a normal pace</li>
            <li>Find a quiet location to minimize background noise</li>
            <li>Hold the device at a comfortable distance</li>
            <li>You can re-record if needed by clicking the reset button</li>
          </ul>
        </div>
      </div>
      
      {/* Browser Compatibility Note */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-xs text-gray-600">
          <strong>Note:</strong> Audio recording requires microphone permissions. 
          This feature works best in modern browsers like Chrome, Firefox, and Safari.
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

export default AudioResponseQuestion;
