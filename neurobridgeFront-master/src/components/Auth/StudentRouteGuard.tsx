import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface StudentRouteGuardProps {
  children: React.ReactNode;
}

const StudentRouteGuard: React.FC<StudentRouteGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // If user is not a student, this guard should not apply
  if (!isLoading && (!user || user.role !== 'student')) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Use the assessment status from the auth context instead of making additional API calls
  const isOnAssessmentPage = location.pathname === '/assessment';
  const needsAssessment = user?.assessmentCompleted === false;

  // If student needs assessment and is not already on assessment page
  if (needsAssessment && !isOnAssessmentPage) {
    return <Navigate to="/assessment" replace />;
  }

  // If student doesn't need assessment and is on assessment page, redirect to dashboard
  if (!needsAssessment && isOnAssessmentPage) {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
};

export default StudentRouteGuard;
