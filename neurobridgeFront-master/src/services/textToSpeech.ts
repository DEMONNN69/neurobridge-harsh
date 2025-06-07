/**
 * Text-to-Speech Service for Assessment Accessibility
 * Provides read-aloud functionality for questions and options
 */

export interface TextToSpeechOptions {
  rate?: number;      // Speed of speech (0.1 to 10)
  pitch?: number;     // Pitch of voice (0 to 2)
  volume?: number;    // Volume (0 to 1)
  voice?: string;     // Voice name (optional)
  lang?: string;      // Language code
}

export class TextToSpeechService {
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isEnabled: boolean = true;
  private defaultOptions: TextToSpeechOptions = {
    rate: 0.9,
    pitch: 1,
    volume: 0.8,
    lang: 'en-US'
  };

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
    
    // Reload voices when they become available
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    this.voices = this.synthesis.getVoices();
  }

  /**
   * Check if text-to-speech is supported and enabled
   */
  public isSupported(): boolean {
    return 'speechSynthesis' in window && this.isEnabled;
  }

  /**
   * Enable or disable text-to-speech
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  /**
   * Get available voices
   */
  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Set default options for speech synthesis
   */
  public setDefaultOptions(options: Partial<TextToSpeechOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * Speak the given text
   */
  public speak(text: string, options?: Partial<TextToSpeechOptions>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        console.warn('Text-to-speech not supported or disabled');
        resolve();
        return;
      }

      // Stop any current speech
      this.stop();

      // Clean and prepare text
      const cleanText = this.cleanText(text);
      if (!cleanText.trim()) {
        resolve();
        return;
      }

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const finalOptions = { ...this.defaultOptions, ...options };

      // Set utterance properties
      utterance.rate = finalOptions.rate || 0.9;
      utterance.pitch = finalOptions.pitch || 1;
      utterance.volume = finalOptions.volume || 0.8;
      utterance.lang = finalOptions.lang || 'en-US';

      // Set voice if specified
      if (finalOptions.voice) {
        const voice = this.voices.find(v => v.name === finalOptions.voice);
        if (voice) {
          utterance.voice = voice;
        }
      } else {
        // Try to find a good default voice
        const preferredVoice = this.voices.find(v => 
          v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
        ) || this.voices.find(v => v.lang.startsWith('en'));
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      // Set event handlers
      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        console.error('Speech synthesis error:', event.error);
        reject(new Error(`Speech synthesis failed: ${event.error}`));
      };

      // Start speaking
      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  public stop(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    this.currentUtterance = null;
  }

  /**
   * Pause current speech
   */
  public pause(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  public resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  public isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  /**
   * Check if speech is paused
   */
  public isPaused(): boolean {
    return this.synthesis.paused;
  }

  /**
   * Speak question text with appropriate formatting
   */
  public async speakQuestion(questionText: string, questionNumber?: number): Promise<void> {
    let textToSpeak = questionText;
    
    if (questionNumber) {
      textToSpeak = `Question ${questionNumber}. ${questionText}`;
    }

    return this.speak(textToSpeak, {
      rate: 0.8, // Slightly slower for questions
      pitch: 1.1
    });
  }

  /**
   * Speak option text with option label
   */
  public async speakOption(optionText: string, optionLabel: string): Promise<void> {
    const textToSpeak = `Option ${optionLabel}. ${optionText}`;
    
    return this.speak(textToSpeak, {
      rate: 1.0,
      pitch: 0.9
    });
  }

  /**
   * Clean text for better speech synthesis
   */
  private cleanText(text: string): string {
    return text
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      // Add pauses for better readability
      .replace(/[.!?]/g, '$&...')
      .replace(/[,;:]/g, '$&..')
      // Trim whitespace
      .trim();
  }

  /**
   * Get user's preferred language from browser settings
   */
  public getUserLanguage(): string {
    return navigator.language || 'en-US';
  }

  /**
   * Set language for speech synthesis
   */
  public setLanguage(lang: string): void {
    this.defaultOptions.lang = lang;
  }

  /**
   * Quick method to speak text with hover delay
   */
  public speakWithDelay(text: string, delay: number = 500): void {
    setTimeout(() => {
      if (this.isSupported()) {
        this.speak(text);
      }
    }, delay);
  }

  /**
   * Dispose of the service and clean up
   */
  public dispose(): void {
    this.stop();
    this.currentUtterance = null;
  }
}

// Create singleton instance
export const textToSpeechService = new TextToSpeechService();

// Export default instance
export default textToSpeechService;
