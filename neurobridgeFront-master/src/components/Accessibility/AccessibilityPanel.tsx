import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Settings, Type, Contrast, Layout, RotateCcw, BookOpen } from 'lucide-react';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ isOpen, onClose }) => {
  const { 
    theme, 
    fontSize, 
    textSpacing,
    dyslexiaMode, 
    setTheme, 
    setFontSize, 
    setTextSpacing,
    setDyslexiaMode, 
    resetSettings 
  } = useAccessibility();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 h-full shadow-lg overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <Settings className="mr-2" /> 
              Accessibility Settings
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
            >
              <span className="sr-only">Close</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-8">
            {/* Dyslexia Mode Settings */}
            <div>
              <h3 className="text-lg font-medium flex items-center mb-4">
                <BookOpen className="mr-2" />
                Dyslexia Mode
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setDyslexiaMode('none')}
                  className={`p-4 border rounded-lg flex items-center ${
                    dyslexiaMode === 'none' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <span className="font-medium">Standard Mode</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Default reading experience</p>
                  </div>
                </button>

                <button
                  onClick={() => setDyslexiaMode('phonological')}
                  className={`p-4 border rounded-lg flex items-center ${
                    dyslexiaMode === 'phonological' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <span className="font-medium">Phonological Mode</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Highlights syllables and provides audio support</p>
                  </div>
                </button>

                <button
                  onClick={() => setDyslexiaMode('surface')}
                  className={`p-4 border rounded-lg flex items-center ${
                    dyslexiaMode === 'surface' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <span className="font-medium">Surface Mode</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Emphasizes whole words with visual cues</p>
                  </div>
                </button>

                <button
                  onClick={() => setDyslexiaMode('visual')}
                  className={`p-4 border rounded-lg flex items-center ${
                    dyslexiaMode === 'visual' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <span className="font-medium">Visual Mode</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enhanced visual clarity with line guides</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Theme Settings */}
            <div>
              <h3 className="text-lg font-medium flex items-center mb-4">
                <Contrast className="mr-2" /> 
                Display Theme
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setTheme('default')}
                  className={`p-4 border rounded-lg flex items-center ${
                    theme === 'default' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="w-6 h-6 bg-white border border-gray-300 rounded mr-3"></div>
                  <span>Default</span>
                </button>
                
                <button
                  onClick={() => setTheme('high-contrast')}
                  className={`p-4 border rounded-lg flex items-center ${
                    theme === 'high-contrast' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="w-6 h-6 bg-black border border-gray-300 rounded mr-3"></div>
                  <span>High Contrast</span>
                </button>
                
                <button
                  onClick={() => setTheme('dyslexia-friendly')}
                  className={`p-4 border rounded-lg flex items-center ${
                    theme === 'dyslexia-friendly' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="w-6 h-6 bg-cream border border-gray-300 rounded mr-3"></div>
                  <span>Dyslexia Friendly</span>
                </button>
              </div>
            </div>

            {/* Font Size Settings */}
            <div>
              <h3 className="text-lg font-medium flex items-center mb-4">
                <Type className="mr-2" /> 
                Font Size
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setFontSize('small')}
                  className={`px-4 py-2 border rounded-lg text-sm ${
                    fontSize === 'small' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  Small
                </button>
                
                <button
                  onClick={() => setFontSize('medium')}
                  className={`px-4 py-2 border rounded-lg text-base ${
                    fontSize === 'medium' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  Medium
                </button>
                
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-4 py-2 border rounded-lg text-lg ${
                    fontSize === 'large' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  Large
                </button>
              </div>
            </div>

            {/* Text Spacing Settings */}
            <div>
              <h3 className="text-lg font-medium flex items-center mb-4">
                <Layout className="mr-2" /> 
                Text Spacing
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setTextSpacing('normal')}
                  className={`p-4 border rounded-lg flex flex-col items-start ${
                    textSpacing === 'normal' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="font-medium">Normal</span>
                  <span className="text-sm leading-normal tracking-normal">Standard text spacing</span>
                </button>
                
                <button
                  onClick={() => setTextSpacing('wide')}
                  className={`p-4 border rounded-lg flex flex-col items-start ${
                    textSpacing === 'wide' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="font-medium">Wide</span>
                  <span className="text-sm leading-relaxed tracking-wide">Increased line height and letter spacing</span>
                </button>
                
                <button
                  onClick={() => setTextSpacing('wider')}
                  className={`p-4 border rounded-lg flex flex-col items-start ${
                    textSpacing === 'wider' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="font-medium">Wider</span>
                  <span className="text-sm leading-loose tracking-wider">Maximum line height and letter spacing</span>
                </button>
              </div>
            </div>

            {/* Reset Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={resetSettings}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Default Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPanel;