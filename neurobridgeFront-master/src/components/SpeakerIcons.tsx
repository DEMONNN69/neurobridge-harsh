import React from 'react';

export interface SpeakerIconProps {
  className?: string;
  isSpeaking?: boolean;
}

export const SpeakerIcon: React.FC<SpeakerIconProps> = ({ 
  className = "h-5 w-5", 
  isSpeaking = false 
}) => {
  if (isSpeaking) {
    return (
      <svg 
        className={`${className} animate-pulse`} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12a3 3 0 106 0v-1a3 3 0 00-6 0v1z"
        />
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 6v6m0 0v6"
        />
      </svg>
    );
  }

  return (
    <svg 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12a3 3 0 106 0v-1a3 3 0 00-6 0v1z" 
      />
    </svg>
  );
};

export const VolumeOffIcon: React.FC<{ className?: string }> = ({ 
  className = "h-5 w-5" 
}) => (
  <svg 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" 
    />
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" 
    />
  </svg>
);

export const PlayIcon: React.FC<{ className?: string }> = ({ 
  className = "h-4 w-4" 
}) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 20 20"
  >
    <path 
      fillRule="evenodd" 
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" 
      clipRule="evenodd" 
    />
  </svg>
);

export const PauseIcon: React.FC<{ className?: string }> = ({ 
  className = "h-4 w-4" 
}) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 20 20"
  >
    <path 
      fillRule="evenodd" 
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" 
      clipRule="evenodd" 
    />
  </svg>
);
