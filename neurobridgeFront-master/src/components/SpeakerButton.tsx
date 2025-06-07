import React from 'react';
import { SpeakerIcon, VolumeOffIcon } from './SpeakerIcons';

export interface SpeakerButtonProps {
  onClick: () => void;
  isSpeaking?: boolean;
  isEnabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  title?: string;
  disabled?: boolean;
}

export const SpeakerButton: React.FC<SpeakerButtonProps> = ({
  onClick,
  isSpeaking = false,
  isEnabled = true,
  size = 'md',
  variant = 'ghost',
  className = '',
  title = 'Read aloud',
  disabled = false
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-1';
      case 'lg':
        return 'p-3';
      default:
        return 'p-2';
    }
  };

  const getVariantClasses = () => {
    if (!isEnabled || disabled) {
      return 'text-gray-300 cursor-not-allowed';
    }

    switch (variant) {
      case 'primary':
        return isSpeaking
          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
          : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50';
      case 'secondary':
        return isSpeaking
          ? 'text-green-600 bg-green-50 hover:bg-green-100'
          : 'text-gray-600 hover:text-green-600 hover:bg-green-50';
      default: // ghost
        return isSpeaking
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-6 w-6';
      default:
        return 'h-5 w-5';
    }
  };

  const handleClick = () => {
    if (isEnabled && !disabled) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isEnabled || disabled}
      title={title}
      className={`
        inline-flex items-center justify-center rounded-md transition-all duration-200
        ${getSizeClasses()}
        ${getVariantClasses()}
        ${className}
        ${isSpeaking ? 'ring-2 ring-blue-200' : ''}
      `}
    >
      {isEnabled ? (
        <SpeakerIcon 
          className={getIconSize()} 
          isSpeaking={isSpeaking} 
        />
      ) : (
        <VolumeOffIcon className={getIconSize()} />
      )}
    </button>
  );
};
