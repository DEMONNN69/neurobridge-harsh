import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { apiService } from '../../services/api';

interface StudentRouteGuardProps {
  children: React.ReactNode;
}

const StudentRouteGuard: React.FC<StudentRouteGuardProps> = ({ children }) => {
  const [needsAssessment, setNeedsAssessment] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAssessmentStatus();
  }, []);

  const checkAssessmentStatus = async () => {
    try {
      const needs = await apiService.checkNeedsAssessment();
      setNeedsAssessment(needs);
    } catch (error) {
      console.error('Error checking assessment status:', error);
      // If there's an error, assume assessment is needed
      setNeedsAssessment(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If student needs assessment and is not already on assessment page
  if (needsAssessment && window.location.pathname !== '/assessment') {
    return <Navigate to="/assessment" replace />;
  }

  // If student doesn't need assessment and is on assessment page, redirect to dashboard
  if (!needsAssessment && window.location.pathname === '/assessment') {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
};

export default StudentRouteGuard;
