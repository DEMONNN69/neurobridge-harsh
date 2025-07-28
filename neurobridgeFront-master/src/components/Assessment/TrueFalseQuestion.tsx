import React from 'react';
import type { QuestionComponentProps } from '../../types/assessment';
import { CheckCircle, XCircle } from 'lucide-react';

interface TrueFalseQuestionProps extends QuestionComponentProps {
  response: boolean | null;
  onResponseChange: (response: boolean) => void;
}

const TrueFalseQuestion: React.FC<TrueFalseQuestionProps> = ({
  question,
  response,
  onResponseChange,
  disabled = false
}) => {
  const handleOptionSelect = (value: boolean) => {
    if (disabled) return;
    onResponseChange(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600 mb-4">
        Select True or False:
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* True Option */}
        <button
          onClick={() => handleOptionSelect(true)}
          disabled={disabled}
          className={`p-6 rounded-lg border-2 transition-all ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : response === true
              ? 'border-green-500 bg-green-50 text-green-900'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center">
            <CheckCircle className={`h-8 w-8 mr-3 ${
              response === true ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div>
              <div className="text-xl font-semibold">True</div>
              <div className="text-sm text-gray-600">This statement is correct</div>
            </div>
          </div>
        </button>

        {/* False Option */}
        <button
          onClick={() => handleOptionSelect(false)}
          disabled={disabled}
          className={`p-6 rounded-lg border-2 transition-all ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : response === false
              ? 'border-red-500 bg-red-50 text-red-900'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center">
            <XCircle className={`h-8 w-8 mr-3 ${
              response === false ? 'text-red-600' : 'text-gray-400'
            }`} />
            <div>
              <div className="text-xl font-semibold">False</div>
              <div className="text-sm text-gray-600">This statement is incorrect</div>
            </div>
          </div>
        </button>
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

export default TrueFalseQuestion;
