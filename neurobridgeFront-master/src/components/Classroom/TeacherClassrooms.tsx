import React, { useState, useEffect } from 'react';
import { Plus, Users, Copy, Edit, Trash2, Eye, AlertCircle, CheckCircle, School } from 'lucide-react';
import { apiService, Classroom, ClassroomStudent, CreateClassroomData } from '../../services/api';

const TeacherClassrooms: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [classroomStudents, setClassroomStudents] = useState<ClassroomStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const [newClassroom, setNewClassroom] = useState<CreateClassroomData>({
    name: '',
    description: ''
  });
  useEffect(() => {
    fetchClassrooms(false); // Don't show error toast on initial load
  }, []);  const fetchClassrooms = async (showErrorToast: boolean = true) => {
    try {
      setLoading(true);
      if (showErrorToast) {
        setError(null); // Only clear errors if we're showing toast
      }
      const data = await apiService.getClassrooms();
      console.log('Teacher classrooms response:', data); // Debug log
      
      // Handle both paginated response and direct array
      let classroomsArray: Classroom[];
      if (Array.isArray(data)) {
        // Direct array response
        classroomsArray = data;
      } else if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as any).results)) {
        // Paginated response from Django REST Framework
        classroomsArray = (data as any).results;
      } else {
        console.error('Expected array or paginated response but got:', typeof data, data);
        classroomsArray = [];
        // Don't clear classrooms on initial load if there's an error
        if (showErrorToast) {
          if (data && typeof data === 'object' && 'detail' in data) {
            setError(`Server error: ${(data as any).detail}`);
          } else {
            setError('Unable to load classrooms. Please try again later.');
          }
        }
      }
      
      setClassrooms(classroomsArray);
    } catch (err) {
      console.error('Error fetching classrooms:', err); // Debug log
      
      // Only clear classrooms if we're explicitly showing errors (not on initial load)
      if (showErrorToast) {
        setClassrooms([]); // Only clear on explicit refresh/retry
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
      }
    } finally {
      setLoading(false);
    }
  };const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null); // Clear any existing errors
      const classroom = await apiService.createClassroom(newClassroom);
      setClassrooms(Array.isArray(classrooms) ? [...classrooms, classroom] : [classroom]);
      setNewClassroom({ name: '', description: '' });
      setShowCreateModal(false);
      setSuccessMessage('Classroom created successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create classroom');
    }
  };  const handleEditClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassroom) return;

    try {
      setError(null); // Clear any existing errors
      const updatedClassroom = await apiService.updateClassroom(editingClassroom.id, {
        name: editingClassroom.name,
        description: editingClassroom.description
      });
      setClassrooms(Array.isArray(classrooms) ? 
        classrooms.map(c => c.id === updatedClassroom.id ? updatedClassroom : c) : 
        [updatedClassroom]
      );
      setShowEditModal(false);
      setEditingClassroom(null);
      setSuccessMessage('Classroom updated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update classroom');
    }
  };  const handleDeleteClassroom = async (classroom: Classroom) => {
    if (!confirm(`Are you sure you want to delete "${classroom.name}"?`)) return;

    try {
      setError(null); // Clear any existing errors
      await apiService.deleteClassroom(classroom.id);
      setClassrooms(Array.isArray(classrooms) ? 
        classrooms.filter(c => c.id !== classroom.id) : 
        []
      );
      setSuccessMessage('Classroom deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete classroom');
    }
  };

  const handleViewStudents = async (classroom: Classroom) => {
    try {
      setSelectedClassroom(classroom);
      const students = await apiService.getClassroomStudents(classroom.id);
      setClassroomStudents(students);
      setShowStudentsModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!selectedClassroom) return;
    if (!confirm('Are you sure you want to remove this student from the classroom?')) return;    try {
      await apiService.removeStudentFromClassroom(selectedClassroom.id, studentId);
      setClassroomStudents(classroomStudents.filter(s => s.id !== studentId));
      // Update classroom student count
      setClassrooms(Array.isArray(classrooms) ? classrooms.map(c => 
        c.id === selectedClassroom.id 
          ? { ...c, student_count: (c.student_count || 0) - 1 }
          : c
      ) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove student');
    }
  };

  const copyJoinCode = async (joinCode: string) => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopyMessage('Join code copied to clipboard!');
      setTimeout(() => setCopyMessage(null), 3000);
    } catch (err) {
      setCopyMessage('Failed to copy join code');
      setTimeout(() => setCopyMessage(null), 3000);
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <School className="h-8 w-8 mr-3 text-indigo-600" />
            My Classrooms
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your classrooms and students
          </p>        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => fetchClassrooms(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Refresh classrooms"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Classroom
          </button>
        </div>
      </div>      {/* Copy Message */}
      {copyMessage && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-green-700 dark:text-green-300 text-sm">{copyMessage}</p>
          </div>
        </div>
      )}

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
            Create your first classroom to start managing students
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Classroom
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(classrooms) && classrooms.map((classroom) => (
            <div key={classroom.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {classroom.name}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingClassroom(classroom);
                      setShowEditModal(true);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClassroom(classroom)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {classroom.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {classroom.description}
                </p>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-1" />
                    {classroom.student_count || 0} students
                  </div>
                  <button
                    onClick={() => handleViewStudents(classroom)}
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Join Code</p>
                      <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                        {classroom.join_code}
                      </p>
                    </div>
                    <button
                      onClick={() => copyJoinCode(classroom.join_code)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Created {new Date(classroom.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create New Classroom
            </h2>
            <form onSubmit={handleCreateClassroom}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Classroom Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClassroom.name}
                    onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Grade 5 Reading Support"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newClassroom.description}
                    onChange={(e) => setNewClassroom({ ...newClassroom, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Brief description of the classroom..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Classroom Modal */}
      {showEditModal && editingClassroom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Edit Classroom
            </h2>
            <form onSubmit={handleEditClassroom}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Classroom Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingClassroom.name}
                    onChange={(e) => setEditingClassroom({ ...editingClassroom, name: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingClassroom.description || ''}
                    onChange={(e) => setEditingClassroom({ ...editingClassroom, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingClassroom(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Update Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Students Modal */}
      {showStudentsModal && selectedClassroom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Students in {selectedClassroom.name}
              </h2>
              <button
                onClick={() => setShowStudentsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {classroomStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Students Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Share the join code <strong>{selectedClassroom.join_code}</strong> with students to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {classroomStudents.map((student) => (
                  <div key={student.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {student.student_name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {student.email}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>ID: {student.student_id}</span>
                          <span>Joined: {new Date(student.joined_at).toLocaleDateString()}</span>
                          {student.assessment_score && (
                            <span>Score: {student.assessment_score.toFixed(1)}%</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherClassrooms;
