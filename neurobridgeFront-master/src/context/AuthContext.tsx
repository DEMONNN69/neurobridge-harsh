import React, { createContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assessmentCompleted?: boolean; // For students only
  preAssessmentCompleted?: boolean; // For students only
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string, confirmPassword: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  checkAssessmentStatus: () => Promise<boolean>; // Helper function to check assessment status
  updateAssessmentStatus: (completed: boolean) => void; // Function to update assessment status
  updatePreAssessmentStatus: (completed: boolean) => void; // Function to update pre-assessment status
  refreshAssessmentStatus: () => Promise<void>; // Function to refresh assessment status from backend
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isLoading: false,
  error: null,
  checkAssessmentStatus: async () => false,
  updateAssessmentStatus: () => {},
  updatePreAssessmentStatus: () => {},
  refreshAssessmentStatus: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in and validate token
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          // Verify token is still valid by fetching current user
          const userData = await apiService.getCurrentUser();
          const user: User = {
            id: userData.id.toString(),
            name: `${userData.first_name} ${userData.last_name}`,
            email: userData.email,
            role: userData.user_type,
          };          // For students, check assessment completion status and pre-assessment status
          if (user.role === 'student') {
            try {
              const [assessmentStatus, preAssessmentStatus] = await Promise.all([
                apiService.checkAssessmentCompletion(),
                apiService.checkPreAssessmentCompletion()
              ]);
              user.assessmentCompleted = assessmentStatus.completed;
              user.preAssessmentCompleted = preAssessmentStatus.completed;
              console.log('Assessment status during auth check:', user.assessmentCompleted);
              console.log('Pre-assessment status during auth check:', user.preAssessmentCompleted);
            } catch (error) {
              console.error('Failed to check assessment/pre-assessment status during auth check:', error);
              user.assessmentCompleted = false; // Default to false if API call fails
              user.preAssessmentCompleted = false;
            }
          }

          setUser(user);
          localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);
  const updateAssessmentStatus = (completed: boolean) => {
    if (user && user.role === 'student') {
      const updatedUser = { ...user, assessmentCompleted: completed };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const updatePreAssessmentStatus = (completed: boolean) => {
    if (user && user.role === 'student') {
      const updatedUser = { ...user, preAssessmentCompleted: completed };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const checkAssessmentStatus = async (): Promise<boolean> => {
    if (!user || user.role !== 'student') {
      return false;
    }
    
    try {
      const response = await apiService.checkAssessmentCompletion();
      return response.completed;
    } catch (error) {
      console.error('Failed to check assessment status:', error);
      return false;
    }
  };

  const refreshAssessmentStatus = async (): Promise<void> => {
    if (!user || user.role !== 'student') {
      return;
    }
    
    try {
      const response = await apiService.checkAssessmentCompletion();
      const updatedUser = { ...user, assessmentCompleted: response.completed };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('Refreshed assessment status from backend:', response.completed);
    } catch (error) {
      console.error('Failed to refresh assessment status from backend:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.login(email, password);
      const userData: User = {
        id: response.user.id.toString(),
        name: `${response.user.first_name} ${response.user.last_name}`,
        email: response.user.email,
        role: response.user.user_type,
      };
      
      // For students, check both assessment and pre-assessment completion status
      if (userData.role === 'student') {
        try {
          const [assessmentStatus, preAssessmentStatus] = await Promise.all([
            apiService.checkAssessmentCompletion(),
            apiService.checkPreAssessmentCompletion()
          ]);
          userData.assessmentCompleted = assessmentStatus.completed;
          userData.preAssessmentCompleted = preAssessmentStatus.completed;
          console.log('Assessment status during login:', userData.assessmentCompleted);
          console.log('Pre-assessment status during login:', userData.preAssessmentCompleted);
        } catch (error) {
          console.error('Failed to check assessment status:', error);
          userData.assessmentCompleted = false;
          userData.preAssessmentCompleted = false;
        }
      }
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, username: string, email: string, password: string, confirmPassword: string, role: UserRole) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ') || '';
      
      const response = await apiService.register({
        username,
        email,
        password,
        password_confirm: confirmPassword,
        first_name: firstName,
        last_name: lastName,
        user_type: role,
      });
      
      const userData: User = {
        id: response.user.id.toString(),
        name: `${response.user.first_name} ${response.user.last_name}`,
        email: response.user.email,
        role: response.user.user_type,
        // Set default values for new users
        assessmentCompleted: false,
        preAssessmentCompleted: false,
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        isLoading,
        error,
        checkAssessmentStatus,
        updateAssessmentStatus,
        updatePreAssessmentStatus,
        refreshAssessmentStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};