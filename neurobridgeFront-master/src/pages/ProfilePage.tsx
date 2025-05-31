import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { UserProfile, StudentProfile, TeacherProfile, Achievement } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile
      const userProfileData = await apiService.getUserProfile();
      setUserProfile(userProfileData);      // Fetch role-specific profile
      if (user?.role === 'student') {
        const studentData = await apiService.getStudentProfile();
        setStudentProfile(studentData);
        
        // Fetch achievements for students
        const achievementsData = await apiService.getAchievements();
        setAchievements(achievementsData);
      } else if (user?.role === 'teacher') {
        const teacherData = await apiService.getTeacherProfile();
        setTeacherProfile(teacherData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    try {
      const updated = await apiService.updateUserProfile(data);
      setUserProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleUpdateStudentProfile = async (data: Partial<StudentProfile>) => {
    try {
      const updated = await apiService.updateStudentProfile(data);
      setStudentProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student profile');
    }
  };

  const handleUpdateTeacherProfile = async (data: Partial<TeacherProfile>) => {
    try {
      const updated = await apiService.updateTeacherProfile(data);
      setTeacherProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update teacher profile');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {error}
        <button 
          onClick={fetchProfileData}
          className="ml-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >          General Profile
          </button>
          {user?.role === 'student' && (
            <>
              <button
                onClick={() => setActiveTab('student')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'student'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Student Details
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'achievements'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Achievements
              </button>
            </>
          )}
          {user?.role === 'teacher' && (
            <button
              onClick={() => setActiveTab('teacher')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'teacher'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Teacher Details
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && userProfile && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">General Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                value={userProfile.bio || ''}
                onChange={(e) => handleUpdateProfile({ bio: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                value={userProfile.phone || ''}
                onChange={(e) => handleUpdateProfile({ phone: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                type="date"
                value={userProfile.date_of_birth || ''}
                onChange={(e) => handleUpdateProfile({ date_of_birth: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Profile Picture URL</label>
              <input
                type="url"
                value={userProfile.profile_picture || ''}
                onChange={(e) => handleUpdateProfile({ profile_picture: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Created: {new Date(userProfile.created_at).toLocaleDateString()}
            <br />
            Updated: {new Date(userProfile.updated_at).toLocaleDateString()}
          </div>
        </div>
      )}

      {activeTab === 'student' && studentProfile && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Student Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Student ID</label>
              <input
                type="text"
                value={studentProfile.student_id}
                readOnly
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Grade Level</label>
              <input
                type="text"
                value={studentProfile.grade_level || ''}
                onChange={(e) => handleUpdateStudentProfile({ grade_level: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dyslexia Type</label>
              <select
                value={studentProfile.dyslexia_type}
                onChange={(e) => handleUpdateStudentProfile({ dyslexia_type: e.target.value as any })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="none">None</option>
                <option value="phonological">Phonological</option>
                <option value="surface">Surface</option>
                <option value="visual">Visual</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Parent Contact</label>
              <input
                type="text"
                value={studentProfile.parent_contact || ''}
                onChange={(e) => handleUpdateStudentProfile({ parent_contact: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Learning Goals</label>
              <textarea
                value={studentProfile.learning_goals || ''}
                onChange={(e) => handleUpdateStudentProfile({ learning_goals: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Accommodation Notes</label>
              <textarea
                value={studentProfile.accommodation_notes || ''}
                onChange={(e) => handleUpdateStudentProfile({ accommodation_notes: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
              />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Enrollment Date: {new Date(studentProfile.enrollment_date).toLocaleDateString()}
          </div>
        </div>
      )}

      {activeTab === 'teacher' && teacherProfile && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Teacher Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee ID</label>
              <input
                type="text"
                value={teacherProfile.employee_id}
                readOnly
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                value={teacherProfile.department || ''}
                onChange={(e) => handleUpdateTeacherProfile({ department: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Specialization</label>
              <input
                type="text"
                value={teacherProfile.specialization || ''}
                onChange={(e) => handleUpdateTeacherProfile({ specialization: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
              <input
                type="number"
                value={teacherProfile.years_of_experience}
                onChange={(e) => handleUpdateTeacherProfile({ years_of_experience: Number(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Qualifications</label>
              <textarea
                value={teacherProfile.qualifications || ''}
                onChange={(e) => handleUpdateTeacherProfile({ qualifications: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
              />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Hire Date: {new Date(teacherProfile.hire_date).toLocaleDateString()}
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Achievements ({achievements.length})</h2>
          {achievements.length === 0 ? (
            <p className="text-gray-500">No achievements yet. Keep learning to earn your first achievement!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    {achievement.badge_icon && (
                      <img src={achievement.badge_icon} alt="Badge" className="w-8 h-8 mr-2" />
                    )}
                    <h3 className="font-semibold">{achievement.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{achievement.description}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      achievement.achievement_type === 'academic' ? 'bg-blue-100 text-blue-800' :
                      achievement.achievement_type === 'milestone' ? 'bg-green-100 text-green-800' :
                      achievement.achievement_type === 'participation' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {achievement.achievement_type}
                    </span>
                    <span className="text-gray-500">{achievement.points} pts</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Earned: {new Date(achievement.earned_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
