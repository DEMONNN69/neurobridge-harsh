import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, GraduationCap, Languages, Users, ChevronRight, ChevronLeft, Check, ArrowRight } from 'lucide-react';

interface PreAssessmentData {
  age: number;
  birthdate: string;
  grade: string;
  readingLevel: string;
  primaryLanguage: string;
  hasReadingDifficulty: boolean;
  needsAssistance: boolean;
  previousAssessment: boolean;
}

const PreAssessmentForm: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState<PreAssessmentData>({
    age: 0,
    birthdate: '',
    grade: '',
    readingLevel: '',
    primaryLanguage: 'English',
    hasReadingDifficulty: false,
    needsAssistance: false,
    previousAssessment: false
  });
  const [errors, setErrors] = useState<Partial<PreAssessmentData>>({});
  
  // Form navigation state
  const [currentSection, setCurrentSection] = useState(0);
  const sections = [
    { id: 'basic', title: 'About You', description: 'Tell us your basic information', icon: User },
    { id: 'academic', title: 'Your Learning', description: 'Your grade and reading skills', icon: GraduationCap },
    { id: 'support', title: 'Support Needs', description: 'How we can help you', icon: Users }
  ];

  // Calculate age from birthdate
  const calculateAge = (birthdate: string): number => {
    if (!birthdate) return 0;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Grade options grouped for easier selection
  const gradeGroups = {
    'Early Years': ['Pre-K', 'Kindergarten'],
    'Elementary': ['1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade'],
    'Middle School': ['6th Grade', '7th Grade', '8th Grade'],
    'High School': ['9th Grade', '10th Grade', '11th Grade', '12th Grade'],
    'Adult Learning': ['College/University', 'Adult Education']
  };

  // Reading levels with visual indicators
  const readingLevels = [
    { value: 'Cannot read yet', emoji: '🌱', description: 'Just starting to learn' },
    { value: 'Beginning reader (simple words)', emoji: '🌿', description: 'Can read simple words' },
    { value: 'Early reader (simple sentences)', emoji: '🌳', description: 'Can read basic sentences' },
    { value: 'Developing reader (short paragraphs)', emoji: '🌲', description: 'Comfortable with paragraphs' },
    { value: 'Proficient reader (grade level)', emoji: '🍃', description: 'Reading at grade level' },
    { value: 'Advanced reader (above grade level)', emoji: '🌳', description: 'Reading above grade level' }
  ];

  // Language options
  const popularLanguages = ['English', 'Spanish', 'French', 'Chinese', 'Arabic', 'Hindi'];
  const otherLanguages = ['German', 'Italian', 'Portuguese', 'Japanese', 'Korean', 'Russian', 'Dutch', 'Other'];

  const handleInputChange = (field: keyof PreAssessmentData, value: any) => {
    if (field === 'birthdate') {
      const age = calculateAge(value);
      setFormData(prev => ({ ...prev, [field]: value, age }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateCurrentSection = (): boolean => {
    const newErrors: Partial<PreAssessmentData> = {};

    if (currentSection === 0) {
      // Basic Information validation
      if (!formData.birthdate) {
        newErrors.birthdate = 'Please select your birthdate' as any;
      } else {
        const age = calculateAge(formData.birthdate);
        if (age < 3 || age > 100) {
          newErrors.birthdate = 'Age must be between 3 and 100 years' as any;
        }
      }
      if (!formData.primaryLanguage) {
        newErrors.primaryLanguage = 'Please select your primary language' as any;
      }
    } else if (currentSection === 1) {
      // Academic Information validation
      if (!formData.grade) {
        newErrors.grade = 'Please select a grade level' as any;
      }
      if (!formData.readingLevel) {
        newErrors.readingLevel = 'Please select a reading level' as any;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextSection = () => {
    if (validateCurrentSection() && currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentSection()) {
      return;
    }

    // Store form data in localStorage for the assessment
    localStorage.setItem('preAssessmentData', JSON.stringify(formData));
    
    // Navigate to assessment type selection
    navigate('/student/assessment-type-selection');
  };

  const getRecommendedAssessmentType = () => {
    const currentAge = formData.birthdate ? calculateAge(formData.birthdate) : formData.age;
    if (currentAge < 7 || formData.readingLevel === 'Cannot read yet' || formData.readingLevel === 'Beginning reader (simple words)') {
      return 'Visual/Interactive Assessment (Recommended for young children or non-readers)';
    }
    return 'Standard Text Assessment';
  };

  const renderBasicInformation = () => (
    <div className="space-y-8">
      {/* Birthdate Selection */}
      <div className="space-y-4">
        <div className="text-center mb-6">
          <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-800 mb-2">When is your birthday?</h3>
          <p className="text-gray-600 text-lg">This helps us choose the right questions for you</p>
        </div>
        <div className="max-w-md mx-auto">
          <input
            type="date"
            value={formData.birthdate}
            onChange={(e) => handleInputChange('birthdate', e.target.value)}
            min="1924-01-01"
            max={new Date().toISOString().split('T')[0]}
            className={`w-full p-4 text-lg border-3 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 text-center ${
              errors.birthdate ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
          />
          {errors.birthdate && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-center font-medium">{errors.birthdate as string}</p>
            </div>
          )}
          {formData.birthdate && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-blue-800 text-lg font-semibold">
                You are {calculateAge(formData.birthdate)} years old
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Primary Language */}
      <div className="space-y-4">
        <div className="text-center mb-6">
          <Languages className="h-12 w-12 text-blue-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-800 mb-2">What language do you speak best?</h3>
          <p className="text-gray-600 text-lg">Choose your main language</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">Most Common Languages</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {popularLanguages.map(language => (
                <button
                  key={language}
                  type="button"
                  onClick={() => handleInputChange('primaryLanguage', language)}
                  className={`p-4 text-lg font-semibold rounded-xl border-3 transition-all duration-200 hover:scale-105 ${
                    formData.primaryLanguage === language
                      ? 'border-blue-500 bg-blue-100 text-blue-800 shadow-lg'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">Other Languages</h4>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {otherLanguages.map(language => (
                <button
                  key={language}
                  type="button"
                  onClick={() => handleInputChange('primaryLanguage', language)}
                  className={`p-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                    formData.primaryLanguage === language
                      ? 'border-blue-500 bg-blue-100 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>
          
          {formData.primaryLanguage === 'Other' && (
            <div className="max-w-md mx-auto mt-4">
              <input
                type="text"
                placeholder="Please tell us your language"
                onChange={(e) => handleInputChange('primaryLanguage', e.target.value || 'Other')}
                className="w-full p-4 text-lg border-3 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAcademicInformation = () => (
    <div className="space-y-8">
      {/* Grade Level */}
      <div className="space-y-4">
        <div className="text-center mb-6">
          <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-800 mb-2">What grade are you in?</h3>
          <p className="text-gray-600 text-lg">Choose the grade that fits you best</p>
        </div>
        
        <div className="space-y-6">
          {Object.entries(gradeGroups).map(([groupName, grades]) => (
            <div key={groupName} className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-700 text-center bg-gray-100 py-2 rounded-lg">
                {groupName}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {grades.map(grade => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => handleInputChange('grade', grade)}
                    className={`p-4 text-lg font-semibold rounded-xl border-3 transition-all duration-200 hover:scale-105 ${
                      formData.grade === grade
                        ? 'border-blue-500 bg-blue-100 text-blue-800 shadow-lg'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {errors.grade && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
            <p className="text-red-600 text-center font-medium">{errors.grade as string}</p>
          </div>
        )}
      </div>

      {/* Reading Level */}
      <div className="space-y-4">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📚</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">How well do you read?</h3>
          <p className="text-gray-600 text-lg">Choose what sounds like you</p>
        </div>
        
        <div className="grid gap-4 max-w-2xl mx-auto">
          {readingLevels.map(level => (
            <button
              key={level.value}
              type="button"
              onClick={() => handleInputChange('readingLevel', level.value)}
              className={`p-6 text-left rounded-xl border-3 transition-all duration-200 hover:scale-102 ${
                formData.readingLevel === level.value
                  ? 'border-blue-500 bg-blue-100 shadow-lg'
                  : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{level.emoji}</span>
                <div>
                  <div className={`text-lg font-semibold ${
                    formData.readingLevel === level.value ? 'text-blue-800' : 'text-gray-800'
                  }`}>
                    {level.value}
                  </div>
                  <div className={`text-sm ${
                    formData.readingLevel === level.value ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {level.description}
                  </div>
                </div>
                {formData.readingLevel === level.value && (
                  <Check className="h-6 w-6 text-blue-600 ml-auto" />
                )}
              </div>
            </button>
          ))}
        </div>
        {errors.readingLevel && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
            <p className="text-red-600 text-center font-medium">{errors.readingLevel as string}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSupportNeeds = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <Users className="h-12 w-12 text-blue-600 mx-auto mb-2" />
        <h3 className="text-2xl font-bold text-gray-800 mb-2">How can we help you?</h3>
        <p className="text-gray-600 text-lg">Tell us what support you might need</p>
      </div>

      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Reading Difficulty */}
        <div className={`p-6 rounded-xl border-3 cursor-pointer transition-all duration-200 ${
          formData.hasReadingDifficulty 
            ? 'border-blue-500 bg-blue-100' 
            : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
        }`}
        onClick={() => handleInputChange('hasReadingDifficulty', !formData.hasReadingDifficulty)}>
          <div className="flex items-center gap-4">
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
              formData.hasReadingDifficulty 
                ? 'border-blue-500 bg-blue-500' 
                : 'border-gray-300'
            }`}>
              {formData.hasReadingDifficulty && <Check className="h-4 w-4 text-white" />}
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">
                I have trouble reading or understanding text
              </div>
              <div className="text-sm text-gray-600">
                Check this if reading is sometimes difficult for you
              </div>
            </div>
          </div>
        </div>

        {/* Needs Assistance */}
        <div className={`p-6 rounded-xl border-3 cursor-pointer transition-all duration-200 ${
          formData.needsAssistance 
            ? 'border-blue-500 bg-blue-100' 
            : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
        }`}
        onClick={() => handleInputChange('needsAssistance', !formData.needsAssistance)}>
          <div className="flex items-center gap-4">
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
              formData.needsAssistance 
                ? 'border-blue-500 bg-blue-500' 
                : 'border-gray-300'
            }`}>
              {formData.needsAssistance && <Check className="h-4 w-4 text-white" />}
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">
                I might need help during the test
              </div>
              <div className="text-sm text-gray-600">
                Check this if you sometimes need extra help
              </div>
            </div>
          </div>
        </div>

        {/* Previous Assessment */}
        <div className={`p-6 rounded-xl border-3 cursor-pointer transition-all duration-200 ${
          formData.previousAssessment 
            ? 'border-blue-500 bg-blue-100' 
            : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
        }`}
        onClick={() => handleInputChange('previousAssessment', !formData.previousAssessment)}>
          <div className="flex items-center gap-4">
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
              formData.previousAssessment 
                ? 'border-blue-500 bg-blue-500' 
                : 'border-gray-300'
            }`}>
              {formData.previousAssessment && <Check className="h-4 w-4 text-white" />}
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">
                I have done a test like this before
              </div>
              <div className="text-sm text-gray-600">
                Check this if you've taken similar assessments
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      {((formData.age > 0 || formData.birthdate) && formData.readingLevel) && (
        <div className="mt-8 p-6 bg-green-50 border-l-4 border-green-500 rounded-r-xl max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-2xl">💡</div>
            <h4 className="text-lg font-bold text-green-800">We recommend:</h4>
          </div>
          <p className="text-green-700 text-lg font-medium">{getRecommendedAssessmentType()}</p>
        </div>
      )}
    </div>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderAcademicInformation();
      case 2:
        return renderSupportNeeds();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8">
            <h1 className="text-4xl font-bold text-white text-center mb-2">
              Getting to Know You
            </h1>
            <p className="text-blue-100 text-xl text-center">
              Help us create the perfect test for you
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="px-8 py-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              {sections.map((section, index) => {
                const Icon = section.icon;
                const isCompleted = index < currentSection;
                const isCurrent = index === currentSection;
                
                return (
                  <div key={section.id} className="flex items-center">
                    <div className={`flex items-center gap-3 ${
                      isCompleted ? 'text-green-600' : 
                      isCurrent ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-3 ${
                        isCompleted ? 'bg-green-100 border-green-500' :
                        isCurrent ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-300'
                      }`}>
                        {isCompleted ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <Icon className="h-6 w-6" />
                        )}
                      </div>
                      <div className="hidden md:block">
                        <div className="font-semibold text-lg">{section.title}</div>
                        <div className="text-sm opacity-75">{section.description}</div>
                      </div>
                    </div>
                    {index < sections.length - 1 && (
                      <ArrowRight className={`h-6 w-6 mx-4 ${
                        isCompleted ? 'text-green-400' : 'text-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
              ></div>
            </div>
            <div className="text-center mt-2 text-gray-600 font-medium">
              Step {currentSection + 1} of {sections.length}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={currentSection === sections.length - 1 ? handleSubmit : (e) => e.preventDefault()}>
            <div className="px-8 py-12">
              {renderCurrentSection()}
            </div>

            {/* Navigation */}
            <div className="px-8 py-6 bg-gray-50 flex justify-between items-center">
              <button
                type="button"
                onClick={prevSection}
                disabled={currentSection === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-lg font-semibold transition-all duration-200 ${
                  currentSection === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>

              {currentSection < sections.length - 1 ? (
                <button
                  type="button"
                  onClick={nextSection}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Continue
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-lg font-semibold hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Start My Test
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PreAssessmentForm;
