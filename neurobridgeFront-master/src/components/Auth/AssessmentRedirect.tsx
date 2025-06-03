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
  // Redirect to assessment type selection
  return <Navigate to="/student/assessment-type" replace />;
};

export default AssessmentRedirect;
