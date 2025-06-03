import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';

interface TeacherRouteGuardProps {
  children: React.ReactNode;
}

const TeacherRouteGuard: React.FC<TeacherRouteGuardProps> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const [profileCheckLoading, setProfileCheckLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [checkCompleted, setCheckCompleted] = useState(false);

  useEffect(() => {
    const checkTeacherProfile = async () => {
      if (!user || user.role !== 'teacher' || authLoading) {
        return;
      }

      try {
        setProfileCheckLoading(true);
        const { completed } = await apiService.checkTeacherProfileCompletion();
        setProfileComplete(completed);
      } catch (error) {
        console.error('Error checking teacher profile completion:', error);
        // Default to incomplete if there's an error
        setProfileComplete(false);
      } finally {
        setProfileCheckLoading(false);
        setCheckCompleted(true);
      }
    };

    checkTeacherProfile();
  }, [user, authLoading]);

  // If user is not a teacher, this guard should not apply
  if (!authLoading && (!user || user.role !== 'teacher')) {
    return <>{children}</>;
  }

  // Show loading while checking auth or profile
  if (authLoading || profileCheckLoading || !checkCompleted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Check if we're on the profile setup page
  const isOnProfileSetupPage = location.pathname === '/teacher/profile-setup' || 
                                location.pathname === '/profile-setup';
  // If profile is incomplete and not on setup page, redirect to profile setup
  if (!profileComplete && !isOnProfileSetupPage) {
    return <Navigate to="/teacher/profile-setup" replace />;
  }
  // If profile is complete and on setup page, redirect to dashboard
  if (profileComplete && isOnProfileSetupPage) {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  // Profile is complete or we're on the right page, render children
  return <>{children}</>;
};

export default TeacherRouteGuard;
