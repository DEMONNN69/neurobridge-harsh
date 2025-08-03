import React from 'react';
import { Play, BookOpen } from 'lucide-react';

interface CategoryIntroProps {
  categoryName: string;
  onStart: () => void;
}

const CategoryIntro: React.FC<CategoryIntroProps> = ({ categoryName, onStart }) => {
  const getCategoryDescription = (category: string): string => {
    const descriptions: Record<string, string> = {
      'Phonological Awareness': 'We will test your ability to hear and work with sounds in spoken language.',
      'Reading Comprehension': 'You will listen to short stories and answer questions about them.',
      'Sequencing': 'We will check your ability to put letters and numbers in the correct order.',
      'Sound-Letter Mapping': 'You will match sounds to their corresponding letters.',
      'Visual Processing': 'We will test how well you can process visual information and patterns.',
      'Word Recognition': 'You will identify and recognize different words.',
      'Working Memory': 'We will test your ability to remember and work with information.'
    };
    return descriptions[category] || 'Get ready for the next assessment category.';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Phonological Awareness':
        return '🔊';
      case 'Reading Comprehension':
        return '📖';
      case 'Sequencing':
        return '🔢';
      case 'Sound-Letter Mapping':
        return '🅰️';
      case 'Visual Processing':
        return '👁️';
      case 'Word Recognition':
        return '📝';
      case 'Working Memory':
        return '🧠';
      default:
        return '📚';
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
      {/* Category Icon */}
      <div className="text-8xl mb-6">
        {getCategoryIcon(categoryName)}
      </div>

      {/* Category Title */}
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        {categoryName}
      </h2>

      {/* Description */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <p className="text-lg text-gray-700 leading-relaxed">
          {getCategoryDescription(categoryName)}
        </p>
      </div>

      {/* Instructions */}
      <div className="space-y-4 text-left bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Instructions:
        </h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
            Listen carefully to all instructions before answering
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
            Take your time - there's no rush
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
            If you need to hear something again, look for the replay button
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
            Do your best and don't worry about making mistakes
          </li>
        </ul>
      </div>

      {/* Start Button */}
      <button
        onClick={onStart}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 flex items-center gap-3 mx-auto"
      >
        <Play className="w-6 h-6" />
        Start {categoryName}
      </button>
    </div>
  );
};

export default CategoryIntro;
