import React, { useState, useEffect } from 'react';
import type { QuestionComponentProps } from '../../types/assessment';
import { GripVertical, RotateCcw, CheckCircle2 } from 'lucide-react';

interface SequencingQuestionProps extends QuestionComponentProps {
  response: string[] | null;
  onResponseChange: (response: string[]) => void;
}

interface SequenceItem {
  id: string;
  text: string;
  original_order?: number;
}

const SequencingQuestion: React.FC<SequencingQuestionProps> = ({
  question,
  response,
  onResponseChange,
  disabled = false
}) => {
  const [items, setItems] = useState<SequenceItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    // Initialize items from question data
    if (question.additional_data?.sequence_items) {
      const sequenceItems = question.additional_data.sequence_items as SequenceItem[];
      
      if (response && response.length > 0) {
        // Restore previous order
        const orderedItems = response.map(id => 
          sequenceItems.find(item => item.id === id)
        ).filter(Boolean) as SequenceItem[];
        setItems(orderedItems);
      } else {
        // Shuffle items for initial presentation
        const shuffled = [...sequenceItems].sort(() => Math.random() - 0.5);
        setItems(shuffled);
      }
    }
  }, [question.additional_data, response]);

  useEffect(() => {
    // Update parent with current order
    const currentOrder = items.map(item => item.id);
    if (currentOrder.length > 0 && JSON.stringify(currentOrder) !== JSON.stringify(response)) {
      onResponseChange(currentOrder);
    }
  }, [items, onResponseChange, response]);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    if (disabled) return;
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem || disabled) return;

    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    if (draggedIndex === -1) return;

    const newItems = [...items];
    const [draggedElement] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedElement);

    setItems(newItems);
    setDraggedItem(null);
  };

  const handleMoveUp = (index: number) => {
    if (disabled || index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (disabled || index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setItems(newItems);
  };

  const handleReset = () => {
    if (disabled) return;
    const sequenceItems = question.additional_data?.sequence_items as SequenceItem[];
    if (sequenceItems) {
      const shuffled = [...sequenceItems].sort(() => Math.random() - 0.5);
      setItems(shuffled);
    }
  };

  if (!question.additional_data?.sequence_items) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">No sequence items available for this question.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Drag and drop the items below to put them in the correct order:
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
          Reset Order
        </button>
      </div>
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`group relative p-4 bg-white border-2 rounded-lg transition-all ${
              disabled
                ? 'border-gray-200 opacity-50'
                : draggedItem === item.id
                ? 'border-blue-500 shadow-lg transform rotate-2'
                : 'border-gray-200 hover:border-gray-300 cursor-move'
            }`}
          >
            <div className="flex items-center space-x-4">
              {/* Order Number */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                disabled
                  ? 'bg-gray-200 text-gray-600'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {index + 1}
              </div>
              
              {/* Drag Handle */}
              <div className={`flex-shrink-0 ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
                <GripVertical className="h-5 w-5" />
              </div>
              
              {/* Item Text */}
              <div className="flex-grow text-gray-900 leading-relaxed">
                {item.text}
              </div>
              
              {/* Move Buttons (for accessibility) */}
              {!disabled && (
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className={`p-1 text-xs rounded ${
                        index === 0
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === items.length - 1}
                      className={`p-1 text-xs rounded ${
                        index === items.length - 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Completion Indicator */}
      {items.length > 0 && (
        <div className="flex items-center justify-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm text-green-800">
            Items arranged in sequence (1 to {items.length})
          </span>
        </div>
      )}
      
      {/* Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>Instructions:</strong>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Drag items up or down to change their order</li>
            <li>Use the arrow buttons if drag-and-drop is difficult</li>
            <li>The numbers show the current sequence position</li>
            <li>Click "Reset Order" to scramble and try again</li>
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

export default SequencingQuestion;
