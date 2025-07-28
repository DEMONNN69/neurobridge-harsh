import React, { useState, useEffect } from 'react';
import type { QuestionComponentProps } from '../../types/assessment';
import { ArrowRight, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface MatchingQuestionProps extends QuestionComponentProps {
  response: Record<string, string> | null;
  onResponseChange: (response: Record<string, string>) => void;
}

interface MatchItem {
  id: string;
  text: string;
  type: 'left' | 'right';
}



const MatchingQuestion: React.FC<MatchingQuestionProps> = ({
  question,
  response,
  onResponseChange,
  disabled = false
}) => {
  const [leftItems, setLeftItems] = useState<MatchItem[]>([]);
  const [rightItems, setRightItems] = useState<MatchItem[]>([]);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  useEffect(() => {
    // Initialize items from question data
    if (question.additional_data?.match_items) {
      const allItems = question.additional_data.match_items as MatchItem[];
      const left = allItems.filter(item => item.type === 'left');
      const right = allItems.filter(item => item.type === 'right');
      
      setLeftItems(left);
      // Shuffle right items to make matching more challenging
      setRightItems([...right].sort(() => Math.random() - 0.5));
    }
  }, [question.additional_data]);

  useEffect(() => {
    // Restore previous matches
    if (response) {
      setMatches(response);
    }
  }, [response]);

  useEffect(() => {
    // Update parent with current matches
    if (Object.keys(matches).length >= 0) {
      onResponseChange(matches);
    }
  }, [matches, onResponseChange]);

  const handleLeftItemClick = (leftId: string) => {
    if (disabled) return;
    
    if (selectedLeft === leftId) {
      // Deselect if clicking the same item
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftId);
    }
  };

  const handleRightItemClick = (rightId: string) => {
    if (disabled || !selectedLeft) return;

    // Create new match
    const newMatches = { ...matches };
    
    // Remove any existing match for the selected left item
    delete newMatches[selectedLeft];
    
    // Remove any existing match that used this right item
    Object.keys(newMatches).forEach(leftId => {
      if (newMatches[leftId] === rightId) {
        delete newMatches[leftId];
      }
    });
    
    // Add new match
    newMatches[selectedLeft] = rightId;
    
    setMatches(newMatches);
    setSelectedLeft(null);
  };

  const handleRemoveMatch = (leftId: string) => {
    if (disabled) return;
    
    const newMatches = { ...matches };
    delete newMatches[leftId];
    setMatches(newMatches);
  };

  const handleReset = () => {
    if (disabled) return;
    setMatches({});
    setSelectedLeft(null);
  };

  const getMatchedRightId = (leftId: string) => matches[leftId];
  const isRightItemMatched = (rightId: string) => Object.values(matches).includes(rightId);
  const completedMatches = Object.keys(matches).length;
  const totalPossibleMatches = Math.min(leftItems.length, rightItems.length);

  if (!question.additional_data?.match_items) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">No matching items available for this question.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Click items on the left, then click their matches on the right:
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            {completedMatches} / {totalPossibleMatches} matched
          </div>
          <button
            onClick={handleReset}
            disabled={disabled}
            className={`flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
              disabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 text-center pb-2 border-b">
            Match These
          </h4>
          {leftItems.map((item) => {
            const isSelected = selectedLeft === item.id;
            const isMatched = getMatchedRightId(item.id);
            
            return (
              <button
                key={item.id}
                onClick={() => handleLeftItemClick(item.id)}
                disabled={disabled}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  disabled
                    ? 'border-gray-200 opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : isMatched
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{item.text}</span>
                  {isMatched && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMatch(item.id);
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                      title="Remove match"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Center Column - Connection Indicators */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-8">
          {leftItems.map((leftItem) => {
            const matchedRightId = getMatchedRightId(leftItem.id);
            const matchedRightItem = rightItems.find(item => item.id === matchedRightId);
            
            return (
              <div key={leftItem.id} className="flex items-center">
                {matchedRightItem ? (
                  <div className="flex items-center text-green-600">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="flex items-center text-gray-300">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Right Column */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 text-center pb-2 border-b">
            With These
          </h4>
          {rightItems.map((item) => {
            const isMatched = isRightItemMatched(item.id);
            const canSelect = selectedLeft && !isMatched;
            
            return (
              <button
                key={item.id}
                onClick={() => handleRightItemClick(item.id)}
                disabled={disabled || (!selectedLeft && !isMatched)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  disabled
                    ? 'border-gray-200 opacity-50 cursor-not-allowed'
                    : canSelect
                    ? 'border-blue-300 bg-blue-25 hover:border-blue-500 hover:bg-blue-50'
                    : isMatched
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                }`}
              >
                <span className="text-sm">{item.text}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Current Selection Indicator */}
      {selectedLeft && !disabled && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center text-blue-800">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="text-sm">
              Selected: "{leftItems.find(item => item.id === selectedLeft)?.text}" - 
              Click an item on the right to match it.
            </span>
          </div>
        </div>
      )}
      
      {/* Completion Status */}
      {completedMatches === totalPossibleMatches && totalPossibleMatches > 0 && (
        <div className="flex items-center justify-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm text-green-800">
            All items matched successfully!
          </span>
        </div>
      )}
      
      {/* Current Matches Display */}
      {Object.keys(matches).length > 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-3">Current Matches:</h5>
          <div className="space-y-2">
            {Object.entries(matches).map(([leftId, rightId]) => {
              const leftItem = leftItems.find(item => item.id === leftId);
              const rightItem = rightItems.find(item => item.id === rightId);
              
              return (
                <div key={leftId} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    "{leftItem?.text}" ↔ "{rightItem?.text}"
                  </span>
                  {!disabled && (
                    <button
                      onClick={() => handleRemoveMatch(leftId)}
                      className="text-red-500 hover:text-red-700 text-xs"
                      title="Remove this match"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>Instructions:</strong>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Click an item on the left to select it</li>
            <li>Click an item on the right to match it</li>
            <li>Matched items will turn green</li>
            <li>Click "Remove" or "✕" to unmatch items</li>
          </ul>
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

export default MatchingQuestion;
