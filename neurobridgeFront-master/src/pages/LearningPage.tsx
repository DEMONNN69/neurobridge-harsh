import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Course, Lesson, Assignment, Enrollment, Progress } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const LearningPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('courses');

  useEffect(() => {
    fetchLearningData();
  }, []);

  const fetchLearningData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [coursesData, enrollmentsData, assignmentsData, progressData] = await Promise.all([
        apiService.getCourses(),
        user?.user_type === 'student' ? apiService.getEnrollments() : Promise.resolve([]),
        apiService.getAssignments(),
        user?.user_type === 'student' ? apiService.getProgress() : Promise.resolve([])
      ]);

      setCourses(coursesData);
      setEnrollments(enrollmentsData);
      setAssignments(assignmentsData);
      setProgress(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch learning data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async (course: Course) => {
    try {
      setSelectedCourse(course);
      const [lessons, assignments] = await Promise.all([
        apiService.getCourseLessons(course.id),
        apiService.getCourseAssignments(course.id)
      ]);
      setCourseLessons(lessons);
      setCourseAssignments(assignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch course details');
    }
  };

  const handleEnrollInCourse = async (courseId: number) => {
    try {
      await apiService.enrollInCourse(courseId);
      fetchLearningData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll in course');
    }
  };

  const handleCreateCourse = async (courseData: Partial<Course>) => {
    try {
      await apiService.createCourse(courseData);
      fetchLearningData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    }
  };

  const isEnrolledInCourse = (courseId: number) => {
    return enrollments.some(enrollment => enrollment.course === courseId && enrollment.is_active);
  };

  const getCourseProgress = (courseId: number) => {
    const courseProgress = progress.filter(p => p.course_title && courses.find(c => c.id === courseId));
    if (courseProgress.length === 0) return 0;
    const averageProgress = courseProgress.reduce((sum, p) => sum + p.completion_percentage, 0) / courseProgress.length;
    return Math.round(averageProgress);
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
          onClick={fetchLearningData}
          className="ml-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Learning Center</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('courses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'courses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Courses ({courses.length})
          </button>
          {user?.user_type === 'student' && (
            <>
              <button
                onClick={() => setActiveTab('enrollments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'enrollments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Enrollments ({enrollments.length})
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'progress'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Progress ({progress.length})
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assignments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Assignments ({assignments.length})
          </button>
        </nav>
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {user?.user_type === 'teacher' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Create New Course</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const courseData = {
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  difficulty_level: formData.get('difficulty_level') as 'beginner' | 'intermediate' | 'advanced',
                  is_active: true
                };
                handleCreateCourse(courseData);
                e.currentTarget.reset();
              }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    name="title"
                    placeholder="Course Title"
                    required
                    className="border border-gray-300 rounded-md px-3 py-2"
                  />
                  <select
                    name="difficulty_level"
                    required
                    className="border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select Difficulty</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Create Course
                  </button>
                </div>
                <textarea
                  name="description"
                  placeholder="Course Description"
                  required
                  className="mt-4 w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{course.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    course.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' :
                    course.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {course.difficulty_level}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{course.description}</p>
                
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div>Teacher: {course.teacher_name || 'Unknown'}</div>
                  <div>Lessons: {course.lesson_count || 0}</div>
                  <div>Students: {course.enrolled_students || 0}</div>
                  {user?.user_type === 'student' && isEnrolledInCourse(course.id) && (
                    <div>Progress: {getCourseProgress(course.id)}%</div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchCourseDetails(course)}
                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    View Details
                  </button>
                  {user?.user_type === 'student' && !isEnrolledInCourse(course.id) && (
                    <button
                      onClick={() => handleEnrollInCourse(course.id)}
                      className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Enroll
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrollments Tab */}
      {activeTab === 'enrollments' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">My Course Enrollments</h2>
          {enrollments.length === 0 ? (
            <p className="text-gray-500">You are not enrolled in any courses yet.</p>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{enrollment.course_title}</h3>
                      <p className="text-sm text-gray-500">
                        Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm">
                        Status: {enrollment.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{getCourseProgress(enrollment.course)}%</div>
                      <div className="text-sm text-gray-500">Progress</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Learning Progress</h2>
          {progress.length === 0 ? (
            <p className="text-gray-500">No progress data available yet.</p>
          ) : (
            <div className="space-y-4">
              {progress.map((progressItem) => (
                <div key={progressItem.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{progressItem.lesson_title}</h3>
                      <p className="text-sm text-gray-500">{progressItem.course_title}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      progressItem.is_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {progressItem.is_completed ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{progressItem.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${progressItem.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Time spent: {Math.round(progressItem.time_spent / 60)} minutes
                    {progressItem.completed_at && (
                      <span className="ml-4">
                        Completed: {new Date(progressItem.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Assignments</h2>
          {assignments.length === 0 ? (
            <p className="text-gray-500">No assignments available.</p>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{assignment.title}</h3>
                      <p className="text-sm text-gray-500">{assignment.course_title}</p>
                      <p className="text-sm text-gray-500">Teacher: {assignment.teacher_name}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        assignment.status === 'published' ? 'bg-green-100 text-green-800' :
                        assignment.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        {assignment.max_points} points
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{assignment.description}</p>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                      {assignment.is_dyslexia_accommodated && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Dyslexia Friendly
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500">
                      Submissions: {assignment.submission_count || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Course Details Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedCourse.title}</h2>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">{selectedCourse.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Lessons ({courseLessons.length})</h3>
                  <div className="space-y-2">
                    {courseLessons.map((lesson) => (
                      <div key={lesson.id} className="border border-gray-200 rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{lesson.title}</h4>
                            <p className="text-sm text-gray-500">
                              Duration: {lesson.estimated_duration} min
                            </p>
                          </div>
                          {lesson.is_dyslexia_friendly && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              Dyslexia Friendly
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Assignments ({courseAssignments.length})</h3>
                  <div className="space-y-2">
                    {courseAssignments.map((assignment) => (
                      <div key={assignment.id} className="border border-gray-200 rounded p-3">
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-gray-500">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Points: {assignment.max_points}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPage;
