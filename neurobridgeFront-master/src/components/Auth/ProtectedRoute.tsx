import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: (props: { user: ReturnType<typeof useAuth>['user'] }) => React.ReactNode;
  allowedRoles?: UserRole[];
  requireAssessment?: boolean; // New prop to indicate if route requires assessment completion
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  requireAssessment = false
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  // Check assessment completion for students accessing dashboard/main content
  if (user && user.role === 'student' && requireAssessment && user.assessmentCompleted === false) {
    return <Navigate to="/assessment" replace />;
  }

  return <>{children({ user })}</>;
};

export default ProtectedRoute;