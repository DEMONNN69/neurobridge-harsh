import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AssessmentRedirect: React.FC = () => {
  const { user } = useAuth();

  // Only students can access assessment
  if (!user || user.role !== 'student') {
    return <Navigate to="/dashboard" replace />;
  }
  // If assessment is already completed, redirect to dashboard
  if (user.assessmentCompleted) {
    return <Navigate to="/student/dashboard" replace />;
  }
    // Check if pre-assessment is completed from user profile
  if (!user.preAssessmentCompleted) {
    // Redirect to pre-assessment form first
    return <Navigate to="/student/pre-assessment" replace />;
  }
  
  // If pre-assessment is done, redirect to assessment type selection
  return <Navigate to="/student/assessment-type-selection" replace />;
};

export default AssessmentRedirect;
