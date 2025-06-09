import React, { useState, useEffect } from 'react';
import { Plus, Users, School, LogOut, AlertCircle, CheckCircle, Eye, RefreshCw } from 'lucide-react';
import { apiService, ClassroomMembership, ClassroomStudent, JoinClassroomData, Classroom } from '../../services/api';

const StudentClassrooms: React.FC = () => {
  const [classrooms, setClassrooms] = useState<ClassroomMembership[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [classroomMembers, setClassroomMembers] = useState<ClassroomStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [joinData, setJoinData] = useState<JoinClassroomData>({
    join_code: ''
  });

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const refreshClassrooms = () => {
    fetchClassrooms();
  };

  const handleModalClose = () => {
    setShowJoinModal(false);
    setJoinData({ join_code: '' });
    setError(null); // Clear any errors when closing modal
  };const fetchClassrooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getStudentClassrooms();
      
      // Handle both paginated response and direct array
      let classroomsArray: ClassroomMembership[];
      if (Array.isArray(data)) {
        // Direct array response
        classroomsArray = data;
      } else if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as any).results)) {
        // Paginated response from Django REST Framework
        classroomsArray = (data as any).results;
      } else {
        console.error('Expected array or paginated response but got:', typeof data, data);
        classroomsArray = [];
        if (data && typeof data === 'object' && 'detail' in data) {
          setError(`Server error: ${(data as any).detail}`);
        } else {
          setError('Unable to load classrooms. Please try again later.');
        }
      }
      
      setClassrooms(classroomsArray);
    } catch (err) {
      console.error('Error fetching classrooms:', err);
      setClassrooms([]);
      
      // Handle different types of errors
      if (err instanceof Error) {
        if (err.message.includes('404')) {
          setError('Classroom service is not available. Please contact your administrator.');
        } else if (err.message.includes('401')) {
          setError('You need to log in again to access classrooms.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to fetch classrooms. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any existing errors
    setError(null);
    
    try {
      const result = await apiService.joinClassroom(joinData);
      
      // Add the new classroom to the list
      const newMembership: ClassroomMembership = {
        id: result.membership.id,
        joined_at: result.membership.joined_at,
        is_active: result.membership.is_active,
        classroom: result.classroom.id,
        student: result.membership.student,
        classroom_name: result.classroom.name
      };
      
      setClassrooms(prev => [...prev, newMembership]);
      setJoinData({ join_code: '' });
      setShowJoinModal(false);
      setSuccessMessage(result.message);
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error joining classroom:', err);
      setError(err instanceof Error ? err.message : 'Failed to join classroom');
    }
  };
  const handleLeaveClassroom = async (membership: ClassroomMembership) => {
    if (!confirm(`Are you sure you want to leave "${membership.classroom_name}"?`)) return;

    // Clear any existing messages
    setError(null);
    setSuccessMessage(null);

    try {
      await apiService.leaveClassroom(membership.classroom);
      setClassrooms(prev => prev.filter(c => c.id !== membership.id));
      setSuccessMessage('Successfully left the classroom');
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error leaving classroom:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave classroom');
    }
  };
  const handleViewMembers = async (membership: ClassroomMembership) => {
    // Clear any existing errors
    setError(null);
    
    try {
      const [classroomDetails, members] = await Promise.all([
        apiService.getClassroomDetails(membership.classroom),
        apiService.getClassroomMembers(membership.classroom)
      ]);
      
      setSelectedClassroom(classroomDetails);
      setClassroomMembers(members);
      setShowMembersModal(true);
    } catch (err) {
      console.error('Error fetching classroom members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch classroom members');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-400">Loading classrooms...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <School className="h-8 w-8 mr-3 text-indigo-600" />
            My Classrooms
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View your classrooms and connect with other students
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={refreshClassrooms}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Join Classroom
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-green-700 dark:text-green-300 text-sm">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}      {/* Classrooms Grid */}
      {!Array.isArray(classrooms) || classrooms.length === 0 ? (
        <div className="text-center py-12">
          <School className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Classrooms Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Join a classroom using a join code provided by your teacher
          </p>
          <button
            onClick={() => setShowJoinModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Join Your First Classroom
          </button>
        </div>
      ) : (        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(classrooms) && classrooms.map((membership) => (
            <div key={membership.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {membership.classroom_name}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewMembers(membership)}
                    className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="View members"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleLeaveClassroom(membership)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Leave classroom"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Users className="h-4 w-4 mr-1" />
                  Classroom members
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Joined {new Date(membership.joined_at).toLocaleDateString()}
                </div>

                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  membership.is_active 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
                }`}>
                  {membership.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join Classroom Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Join Classroom
            </h2>
            <form onSubmit={handleJoinClassroom}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Join Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={joinData.join_code}
                    onChange={(e) => setJoinData({ join_code: e.target.value.toUpperCase() })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-lg tracking-wider"
                    placeholder="Enter join code"
                    maxLength={8}
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Ask your teacher for the classroom join code
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Join Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedClassroom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedClassroom.name}
                </h2>
                {selectedClassroom.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {selectedClassroom.description}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Teacher: {selectedClassroom.teacher_name}
                </p>
              </div>
              <button
                onClick={() => setShowMembersModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Classroom Members ({classroomMembers.length})
              </h3>
              
              {classroomMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No other members in this classroom yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classroomMembers.map((member) => (
                    <div key={member.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                              {member.student_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {member.student_name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {member.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Joined: {new Date(member.joined_at).toLocaleDateString()}
                            </span>
                            {member.assessment_score && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                                Score: {member.assessment_score.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentClassrooms;
