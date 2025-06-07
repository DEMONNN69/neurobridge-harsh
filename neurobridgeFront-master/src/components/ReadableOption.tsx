import React, { useRef, useCallback } from 'react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

export interface ReadableOptionProps {
  optionText: string;
  optionLabel: string;
  isSelected: boolean;
  onClick: () => void;
  hoverDelay?: number;
  className?: string;
  children: React.ReactNode;
}

export const ReadableOption: React.FC<ReadableOptionProps> = ({
  optionText,
  optionLabel,
  isSelected,
  onClick,
  hoverDelay = 800,
  className = '',
  children
}) => {
  const { speakOption, stop, isSupported } = useTextToSpeech();
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasReadRef = useRef(false);

  const handleMouseEnter = useCallback(() => {
    if (!isSupported) return;

    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set timeout to read after delay
    hoverTimeoutRef.current = setTimeout(() => {
      if (!hasReadRef.current) {
        speakOption(optionText, optionLabel);
        hasReadRef.current = true;
      }
    }, hoverDelay);
  }, [speakOption, optionText, optionLabel, hoverDelay, isSupported]);

  const handleMouseLeave = useCallback(() => {
    // Clear timeout if user moves away before delay
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Reset read flag after a short delay
    setTimeout(() => {
      hasReadRef.current = false;
    }, 200);
  }, []);

  const handleClick = useCallback(() => {
    // Stop any current speech when clicking
    stop();
    
    // Clear hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    onClick();
  }, [onClick, stop]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      title={isSupported ? `Hover to hear: ${optionLabel} - ${optionText}` : undefined}
    >
      {children}
    </button>
  );
};
