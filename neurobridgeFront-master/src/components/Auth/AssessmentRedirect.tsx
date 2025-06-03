import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AssessmentPage from '../../pages/AssessmentPage';

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

  // Show assessment page if not completed
  return <AssessmentPage />;
};

export default AssessmentRedirect;
