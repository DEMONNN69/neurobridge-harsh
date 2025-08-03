import React, { useState, useEffect } from 'react';
import { Coffee } from 'lucide-react';

const BreakScreen: React.FC = () => {
  const [countdown, setCountdown] = useState(5);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    // Show tips after 2 seconds
    const tipsTimer = setTimeout(() => {
      setShowTips(true);
    }, 2000);
    return () => clearTimeout(tipsTimer);
  }, []);

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-16">
      {/* Break Icon */}
      <div className="text-8xl mb-6">
        ⏸️
      </div>

      {/* Break Title */}
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        Take a Short Break
      </h2>

      {/* Countdown */}
      <div className="bg-blue-50 rounded-lg p-8 mb-8">
        <div className="text-6xl font-bold text-blue-600 mb-2">
          {countdown}
        </div>
        <p className="text-lg text-gray-700">
          {countdown > 0 ? 'seconds until next category' : 'Get ready...'}
        </p>
      </div>

      {/* Break Tips */}
      {showTips && (
        <div className="space-y-6 text-left bg-gray-50 rounded-lg p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 justify-center">
            <Coffee className="w-5 h-5" />
            Quick Break Tips:
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="text-2xl">💧</div>
              <p className="text-sm text-gray-600">Take a sip of water</p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-2xl">🌬️</div>
              <p className="text-sm text-gray-600">Take a deep breath</p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-2xl">🤸</div>
              <p className="text-sm text-gray-600">Stretch your arms</p>
            </div>
          </div>
        </div>
      )}

      {/* Encouragement */}
      <div className="bg-green-50 rounded-lg p-6">
        <p className="text-lg text-green-800 font-medium">
          Great job so far! 🎉
        </p>
        <p className="text-green-700 mt-2">
          You're doing wonderful. Keep up the excellent work!
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
      </div>
    </div>
  );
};

export default BreakScreen;
