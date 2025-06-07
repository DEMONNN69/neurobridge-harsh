import { useEffect, useRef, useCallback } from 'react';
import { textToSpeechService, TextToSpeechOptions } from '../services/textToSpeech';

export interface UseTextToSpeechReturn {
  speak: (text: string, options?: Partial<TextToSpeechOptions>) => Promise<void>;
  speakQuestion: (questionText: string, questionNumber?: number) => Promise<void>;
  speakOption: (optionText: string, optionLabel: string) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const speakingRef = useRef(false);
  const pausedRef = useRef(false);

  // Update refs when speech state changes
  useEffect(() => {
    const updateSpeakingState = () => {
      speakingRef.current = textToSpeechService.isSpeaking();
      pausedRef.current = textToSpeechService.isPaused();
    };

    const interval = setInterval(updateSpeakingState, 100);
    return () => clearInterval(interval);
  }, []);

  const speak = useCallback(async (text: string, options?: Partial<TextToSpeechOptions>) => {
    try {
      await textToSpeechService.speak(text, options);
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  }, []);

  const speakQuestion = useCallback(async (questionText: string, questionNumber?: number) => {
    try {
      await textToSpeechService.speakQuestion(questionText, questionNumber);
    } catch (error) {
      console.error('Question speech error:', error);
    }
  }, []);

  const speakOption = useCallback(async (optionText: string, optionLabel: string) => {
    try {
      await textToSpeechService.speakOption(optionText, optionLabel);
    } catch (error) {
      console.error('Option speech error:', error);
    }
  }, []);

  const stop = useCallback(() => {
    textToSpeechService.stop();
  }, []);

  const pause = useCallback(() => {
    textToSpeechService.pause();
  }, []);

  const resume = useCallback(() => {
    textToSpeechService.resume();
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    textToSpeechService.setEnabled(enabled);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      textToSpeechService.stop();
    };
  }, []);

  return {
    speak,
    speakQuestion,
    speakOption,
    stop,
    pause,
    resume,
    isSpeaking: speakingRef.current,
    isPaused: pausedRef.current,
    isSupported: textToSpeechService.isSupported(),
    setEnabled
  };
};
