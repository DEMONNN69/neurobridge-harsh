import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, TeacherProfile } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { User, Building, GraduationCap, Calendar, Save, CheckCircle } from 'lucide-react';

const TeacherProfileSetup: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [profileData, setProfileData] = useState({
    employee_id: '',
    department: '',
    specialization: '',
    years_of_experience: 0,
    qualifications: ''
  });
  const [existingProfile, setExistingProfile] = useState<TeacherProfile | null>(null);

  useEffect(() => {
    fetchExistingProfile();
  }, []);

  const fetchExistingProfile = async () => {
    try {
      setLoading(true);
      const profile = await apiService.getTeacherProfile();
      setExistingProfile(profile);
      
      // Pre-fill form with existing data if profile exists
      if (profile) {
        setProfileData({
          employee_id: profile.employee_id || '',
          department: profile.department || '',
          specialization: profile.specialization || '',
          years_of_experience: profile.years_of_experience || 0,
          qualifications: profile.qualifications || ''
        });
      }
    } catch (err) {
      console.error('Error fetching teacher profile:', err);
      // Profile doesn't exist yet, which is expected for new teachers
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!profileData.employee_id.trim()) {
      setError('Employee ID is required');
      return false;
    }
    if (!profileData.department.trim()) {
      setError('Department is required');
      return false;
    }
    if (!profileData.specialization.trim()) {
      setError('Specialization is required');
      return false;
    }
    if (profileData.years_of_experience < 0) {
      setError('Years of experience must be 0 or greater');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      await apiService.updateTeacherProfile(profileData);
      
      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save teacher profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSkipForNow = () => {
    // Allow teachers to skip setup for now, but they'll be prompted again
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Setup Complete!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your teacher profile has been successfully created.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-6 py-8">
            <div className="flex items-center">
              <User className="h-8 w-8 text-white mr-3" />              <div>
                <h1 className="text-2xl font-bold text-white">
                  {existingProfile ? 'Update Your Profile' : `Welcome to NeuroBridge, ${user?.name}!`}
                </h1>
                <p className="text-indigo-100 mt-1">
                  {existingProfile 
                    ? 'Update your teacher profile information' 
                    : "Let's set up your teacher profile to get started"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4">
                <div className="text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Employee ID *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={profileData.employee_id}
                    onChange={(e) => handleInputChange('employee_id', e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your employee ID"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={profileData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Mathematics, Special Education"
                  />
                </div>
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Specialization *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={profileData.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Dyslexia Support, Learning Disabilities"
                  />
                </div>
              </div>

              {/* Years of Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Years of Experience *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    required
                    value={profileData.years_of_experience}
                    onChange={(e) => handleInputChange('years_of_experience', parseInt(e.target.value) || 0)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Qualifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Qualifications & Certifications
              </label>
              <textarea
                value={profileData.qualifications}
                onChange={(e) => handleInputChange('qualifications', e.target.value)}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="List your degrees, certifications, and relevant qualifications..."
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Optional: Include degrees, teaching certifications, special education training, etc.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    {existingProfile ? 'Update Profile' : 'Complete Setup'}
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleSkipForNow}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Skip for Now
              </button>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              * Required fields. You can update your profile later from the Profile page.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfileSetup;
