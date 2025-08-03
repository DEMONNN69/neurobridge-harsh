import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Users, Zap, ArrowRight, CheckCircle } from 'lucide-react';

type AssessmentType = 'dyslexia' | 'autism' | 'both';

interface AssessmentOption {
  type: AssessmentType;
  title: string;
  description: string;
  features: string[];
  icon: React.ComponentType<any>;
  color: string;
  duration: string;
}

const AssessmentTypeSelection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<AssessmentType | null>(null);

  const assessmentOptions: AssessmentOption[] = [
    {
      type: 'dyslexia',
      title: 'Dyslexia Assessment',
      description: 'Comprehensive manual assessment with clinically-designed questions',
      features: [
        'Age-appropriate question selection',
        'Multiple question types (MCQ, text, sequencing)',
        'Clinical significance tracking',
        'Real-time response monitoring'
      ],
      icon: Brain,
      color: 'blue',
      duration: '~10 minutes'
    },
    {
      type: 'autism',
      title: 'Autism Assessment',
      description: 'Focus on social understanding, communication, and behavioral patterns',
      features: [
        'Social cue recognition',
        'Emotional understanding',
        'Communication patterns',
        'Behavioral preferences'
      ],
      icon: Users,
      color: 'green',
      duration: '~8 minutes'
    },
    {
      type: 'both',
      title: 'Comprehensive Assessment',
      description: 'Complete evaluation: manual dyslexia assessment + AI-generated autism questions',
      features: [
        'Manual dyslexia evaluation',
        'AI-generated autism assessment',
        'Separate scores for each area',
        'Comprehensive analysis'
      ],
      icon: Zap,
      color: 'purple',
      duration: '~18 minutes'
    }
  ];

  const handleAssessmentSelect = (type: AssessmentType) => {
    setSelectedType(type);
  };

  const handleStartAssessment = () => {
    if (!selectedType) return;
    
    // Store the selected assessment type in localStorage for the assessment page to use
    localStorage.setItem('assessmentType', selectedType);
    
    // Navigate based on assessment type
    if (selectedType === 'dyslexia') {
      // Use new assessment system for dyslexia only
      navigate('/student/new-assessment', { 
        state: { assessmentType: selectedType },
        replace: true 
      });
    } else if (selectedType === 'both') {
      // For comprehensive assessment, start with new dyslexia assessment
      localStorage.setItem('comprehensiveAssessment', 'true');
      navigate('/student/new-assessment', { 
        state: { assessmentType: 'dyslexia', isComprehensive: true },
        replace: true 
      });
    } else {
      // Use quiz generator for autism-only assessments
      navigate('/student/assessment', { 
        state: { assessmentType: selectedType },
        replace: true 
      });
    }
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colorMap = {
      blue: {
        border: isSelected ? 'border-blue-500' : 'border-gray-200',
        bg: isSelected ? 'bg-blue-50' : 'bg-white',
        icon: isSelected ? 'text-blue-600' : 'text-blue-500',
        text: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      green: {
        border: isSelected ? 'border-green-500' : 'border-gray-200',
        bg: isSelected ? 'bg-green-50' : 'bg-white',
        icon: isSelected ? 'text-green-600' : 'text-green-500',
        text: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700'
      },
      purple: {
        border: isSelected ? 'border-purple-500' : 'border-gray-200',
        bg: isSelected ? 'bg-purple-50' : 'bg-white',
        icon: isSelected ? 'text-purple-600' : 'text-purple-500',
        text: 'text-purple-600',
        button: 'bg-purple-600 hover:bg-purple-700'
      }
    };
    return colorMap[color as keyof typeof colorMap];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Assessment Type
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select the type of assessment you'd like to take. Each assessment is designed to provide 
            accurate insights into specific learning characteristics.
          </p>
        </div>

        {/* Assessment Options */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {assessmentOptions.map((option) => {
            const isSelected = selectedType === option.type;
            const colors = getColorClasses(option.color, isSelected);
            const Icon = option.icon;

            return (
              <div
                key={option.type}
                className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  isSelected ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                }`}
                onClick={() => handleAssessmentSelect(option.type)}
              >
                <div className={`p-8 rounded-xl border-2 h-full ${colors.border} ${colors.bg} hover:shadow-lg transition-all duration-300`}>
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2">
                      <CheckCircle className="h-6 w-6 text-indigo-600 bg-white rounded-full" />
                    </div>
                  )}

                  {/* Icon and Duration */}
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`h-12 w-12 ${colors.icon}`} />
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${colors.text} bg-white`}>
                      {option.duration}
                    </span>
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {option.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {option.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 mb-3">Assessment includes:</h4>
                    {option.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle className={`h-4 w-4 ${colors.text} flex-shrink-0`} />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Start Assessment Button */}
        <div className="text-center">
          <button
            onClick={handleStartAssessment}
            disabled={!selectedType}
            className={`inline-flex items-center px-8 py-4 rounded-lg text-white font-semibold text-lg transition-all duration-300 ${
              selectedType
                ? 'bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {selectedType ? 'Start Assessment' : 'Select an Assessment Type'}
            {selectedType && <ArrowRight className="ml-2 h-5 w-5" />}
          </button>
          
          {selectedType && (
            <p className="mt-4 text-gray-600">
              Ready to begin your {assessmentOptions.find(opt => opt.type === selectedType)?.title.toLowerCase()}
            </p>
          )}
        </div>

        {/* Information Footer */}
        <div className="mt-16 bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              About Our Assessments
            </h3>
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Scientifically Based</h4>
                <p className="text-gray-600 text-sm">
                  Our assessments are based on established research and clinical guidelines for identifying learning differences.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Adaptive & Personalized</h4>
                <p className="text-gray-600 text-sm">
                  Questions adapt to your responses to provide the most accurate assessment of your learning profile.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Privacy & Security</h4>
                <p className="text-gray-600 text-sm">
                  Your assessment data is secure and confidential. Results are only shared with you and authorized educators.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentTypeSelection;
