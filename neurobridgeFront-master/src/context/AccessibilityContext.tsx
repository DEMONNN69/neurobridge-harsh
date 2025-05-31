import React, { createContext, useState, useEffect } from 'react';

type Theme = 'default' | 'high-contrast' | 'dyslexia-friendly';
type FontSize = 'small' | 'medium' | 'large';
type TextSpacing = 'normal' | 'wide' | 'wider';
type DyslexiaMode = 'none' | 'phonological' | 'surface' | 'visual';

interface AccessibilityContextType {
  theme: Theme;
  fontSize: FontSize;
  textSpacing: TextSpacing;
  dyslexiaMode: DyslexiaMode;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setTextSpacing: (spacing: TextSpacing) => void;
  setDyslexiaMode: (mode: DyslexiaMode) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  theme: 'default' as Theme,
  fontSize: 'medium' as FontSize,
  textSpacing: 'normal' as TextSpacing,
  dyslexiaMode: 'none' as DyslexiaMode
};

export const AccessibilityContext = createContext<AccessibilityContextType>({
  ...defaultSettings,
  setTheme: () => {},
  setFontSize: () => {},
  setTextSpacing: () => {},
  setDyslexiaMode: () => {},
  resetSettings: () => {}
});

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(defaultSettings.theme);
  const [fontSize, setFontSize] = useState<FontSize>(defaultSettings.fontSize);
  const [textSpacing, setTextSpacing] = useState<TextSpacing>(defaultSettings.textSpacing);
  const [dyslexiaMode, setDyslexiaMode] = useState<DyslexiaMode>(defaultSettings.dyslexiaMode);

  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    
    if (savedSettings) {
      const { 
        theme: savedTheme, 
        fontSize: savedFontSize, 
        textSpacing: savedTextSpacing,
        dyslexiaMode: savedDyslexiaMode 
      } = JSON.parse(savedSettings);
      
      setTheme(savedTheme);
      setFontSize(savedFontSize);
      setTextSpacing(savedTextSpacing);
      setDyslexiaMode(savedDyslexiaMode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('accessibilitySettings', JSON.stringify({
      theme,
      fontSize,
      textSpacing,
      dyslexiaMode
    }));
    
    const body = document.body;
    
    body.classList.remove(
      'theme-default', 'theme-high-contrast', 'theme-dyslexia-friendly',
      'font-small', 'font-medium', 'font-large',
      'spacing-normal', 'spacing-wide', 'spacing-wider',
      'dyslexia-none', 'dyslexia-phonological', 'dyslexia-surface', 'dyslexia-visual'
    );
    
    body.classList.add(`theme-${theme}`);
    body.classList.add(`font-${fontSize}`);
    body.classList.add(`spacing-${textSpacing}`);
    body.classList.add(`dyslexia-${dyslexiaMode}`);
    
  }, [theme, fontSize, textSpacing, dyslexiaMode]);

  const resetSettings = () => {
    setTheme(defaultSettings.theme);
    setFontSize(defaultSettings.fontSize);
    setTextSpacing(defaultSettings.textSpacing);
    setDyslexiaMode(defaultSettings.dyslexiaMode);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        theme,
        fontSize,
        textSpacing,
        dyslexiaMode,
        setTheme,
        setFontSize,
        setTextSpacing,
        setDyslexiaMode,
        resetSettings
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};