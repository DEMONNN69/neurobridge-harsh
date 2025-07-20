// Example: Integrating Theory of Mind into existing assessment flow
// This shows how to add ToM to autism or combined assessments

import React, { useState } from 'react';
import TheoryOfMindIntegration from '../components/ToM/TheoryOfMindIntegration';

// Example of how to modify your existing assessment flow
const EnhancedAssessmentFlow: React.FC = () => {
  const [currentPhase, setCurrentPhase] = useState<'autism' | 'theory_of_mind' | 'completed'>('autism');
  const [autismResults, setAutismResults] = useState(null);
  const [tomResults, setTomResults] = useState(null);
  const [preAssessmentData, setPreAssessmentData] = useState({
    age: 8,
    has_reading_difficulty: false,
    needs_assistance: false,
    // ... other pre-assessment data
  });

  const handleAutismComplete = (results: any) => {
    setAutismResults(results);
    
    // Determine if ToM should be included based on:
    // 1. Assessment type (autism or both)
    // 2. Age appropriateness (6-12 years old)
    // 3. Pre-assessment flags
    
    const shouldIncludeToM = (
      results.assessment_type === 'autism' || 
      results.assessment_type === 'both'
    ) && (
      preAssessmentData.age >= 6 && 
      preAssessmentData.age <= 12
    );

    if (shouldIncludeToM) {
      setCurrentPhase('theory_of_mind');
    } else {
      setCurrentPhase('completed');
    }
  };

  const handleToMComplete = async (tomData: any) => {
    setTomResults(tomData);
    
    // Combine results and submit to backend
    const combinedResults = {
      ...autismResults,
      theory_of_mind_data: tomData,
      assessment_type: 'autism_with_tom'
    };

    // Submit combined results
    try {
      await apiService.submitCombinedAssessment(combinedResults);
      setCurrentPhase('completed');
    } catch (error) {
      console.error('Failed to submit combined assessment:', error);
    }
  };

  return (
    <div className="assessment-container">
      {currentPhase === 'autism' && (
        <AutismAssessmentComponent 
          onComplete={handleAutismComplete}
          preAssessmentData={preAssessmentData}
        />
      )}
      
      {currentPhase === 'theory_of_mind' && (
        <div className="tom-phase">
          <div className="phase-header mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Phase 2: Understanding Perspectives
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Now let's explore how you think about what others might know or believe.
            </p>
          </div>
          
          <TheoryOfMindIntegration
            assessmentType="autism"
            preAssessmentData={preAssessmentData}
            onComplete={handleToMComplete}
          />
        </div>
      )}
      
      {currentPhase === 'completed' && (
        <AssessmentCompletedComponent 
          autismResults={autismResults}
          tomResults={tomResults}
        />
      )}
    </div>
  );
};

// Example of adding ToM trigger logic to existing assessment logic
const getAssessmentPhases = (assessmentType: string, preAssessmentData: any) => {
  const phases = [];
  
  if (assessmentType === 'dyslexia') {
    phases.push('dyslexia');
  } else if (assessmentType === 'autism') {
    phases.push('autism');
    
    // Add ToM if age appropriate
    if (preAssessmentData.age >= 6 && preAssessmentData.age <= 12) {
      phases.push('theory_of_mind');
    }
  } else if (assessmentType === 'both') {
    phases.push('dyslexia', 'autism');
    
    // Add ToM for combined assessments if age appropriate
    if (preAssessmentData.age >= 6 && preAssessmentData.age <= 12) {
      phases.push('theory_of_mind');
    }
  }
  
  return phases;
};

export { EnhancedAssessmentFlow, getAssessmentPhases };
