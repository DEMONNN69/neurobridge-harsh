import React, { useState, useEffect } from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import StudentRouteGuard from '../components/Auth/StudentRouteGuard';
import { BookOpen, Award, Clock, Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import Chatbot from '../components/Chatbot/Chatbot';
import Scheduler from '../components/Scheduler/Scheduler';
import { useAuth } from '../hooks/useAuth';
import { 
  apiService,
  StudentProfile, 
  Achievement, 
  Progress, 
  Task
} from '../services/api';

interface DashboardStats {
  total_achievements: number;
  total_points: number;
  recent_achievements: Achievement[];
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for dashboard data
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [learningProgress, setLearningProgress] = useState<Progress[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data has been loaded

  useEffect(() => {
    const loadDashboard = async () => {
      // Only fetch data if not already loaded
      if (!dataLoaded) {
        await fetchDashboardData();
      }
    };
    
    loadDashboard();
  }, [dataLoaded]); // Run only once on mount or when dataLoaded changes

  useEffect(() => {
    // Clear refresh/assessment_completed parameters if present (separate effect to avoid infinite loop)
    if (searchParams.get('refresh') || searchParams.get('assessment_completed')) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('refresh');
      newSearchParams.delete('assessment_completed');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]); // Only run when search params change

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Starting dashboard data fetch...');

      // Fetch all dashboard data in parallel
      const [
        studentProfileData,
        achievementsData,
        progressData,
        tasksData,
        statsData
      ] = await Promise.allSettled([
        apiService.getStudentProfile(),
        apiService.getAchievements(),
        apiService.getProgress(),
        apiService.getTasks(),
        apiService.getStudentDashboardStats()
      ]);

      // Log the results for debugging
      console.log('Dashboard API Results:', {
        studentProfile: studentProfileData.status === 'fulfilled' ? studentProfileData.value : studentProfileData.reason,
        achievements: achievementsData.status === 'fulfilled' ? achievementsData.value : achievementsData.reason,
        progress: progressData.status === 'fulfilled' ? progressData.value : progressData.reason,
        tasks: tasksData.status === 'fulfilled' ? tasksData.value : tasksData.reason,
        stats: statsData.status === 'fulfilled' ? statsData.value : statsData.reason,
      });

      // Handle studentProfile
      if (studentProfileData.status === 'fulfilled') {
        console.log('Student profile data:', studentProfileData.value);
        setStudentProfile(studentProfileData.value);
      } else {
        console.error('Student profile failed:', studentProfileData.reason);
      }

      // Handle achievements
      if (achievementsData.status === 'fulfilled') {
        const achievements = achievementsData.value;
        console.log('Achievements data:', achievements);
        
        if (Array.isArray(achievements)) {
          setAchievements(achievements);
        } else if (achievements && typeof achievements === 'object' && 'results' in achievements && Array.isArray((achievements as any).results)) {
          // Handle paginated response format {count, next, previous, results}
          console.log('Extracted achievements from paginated response:', (achievements as any).results);
          setAchievements((achievements as any).results);
        } else {
          console.warn('Achievements API did not return an array or paginated response:', achievements);
          setAchievements([]);
        }
      } else {
        console.error('Achievements failed:', achievementsData.reason);
      }

      // Handle learning progress
      if (progressData.status === 'fulfilled') {
        const progress = progressData.value;
        console.log('Progress data:', progress);
        
        if (Array.isArray(progress)) {
          setLearningProgress(progress);
        } else if (progress && typeof progress === 'object' && 'results' in progress && Array.isArray((progress as any).results)) {
          // Handle paginated response format {count, next, previous, results}
          console.log('Extracted progress from paginated response:', (progress as any).results);
          setLearningProgress((progress as any).results);
        } else {
          console.warn('Progress API did not return an array or paginated response:', progress);
          setLearningProgress([]);
        }
      } else {
        console.error('Progress failed:', progressData.reason);
      }

      // Handle upcoming tasks
      if (tasksData.status === 'fulfilled') {
        const tasks = tasksData.value;
        console.log('Tasks data:', tasks, 'Type:', typeof tasks, 'Is array:', Array.isArray(tasks));
        
        let tasksArray: Task[] = [];
        
        if (Array.isArray(tasks)) {
          tasksArray = tasks;
        } else if (tasks && typeof tasks === 'object' && 'results' in tasks && Array.isArray((tasks as any).results)) {
          // Handle paginated response format {count, next, previous, results}
          console.log('Extracted tasks from paginated response:', (tasks as any).results);
          tasksArray = (tasks as any).results;
        } else {
          console.warn('Tasks API did not return an array or paginated response:', tasks);
        }
        
        // Filter for upcoming tasks and sort by due date
        const upcoming = tasksArray
          .filter((task: Task) => task.status !== 'completed' && new Date(task.due_date) > new Date())
          .sort((a: Task, b: Task) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
          .slice(0, 5); // Show only next 5 tasks
          
        setUpcomingTasks(upcoming);
      } else {
        console.error('Tasks failed:', tasksData.reason);
      }

      // Handle dashboard stats
      if (statsData.status === 'fulfilled') {
        console.log('Stats data:', statsData.value);
        setDashboardStats(statsData.value);
      } else {
        console.error('Stats failed:', statsData.reason);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setDataLoaded(true); // Mark data as loaded regardless of success/failure
    }
  };

  const refreshDashboard = async () => {
    setDataLoaded(false); // Reset the data loaded flag to trigger a refresh
    setError(null);
    await fetchDashboardData();
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays < 7) {
      return `In ${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const LoadingState = () => (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
      </div>
    </div>
  );

  const ErrorState = () => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <div className="flex items-center">
        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
        <div>
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
            Unable to load dashboard
          </h3>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
          <button
            onClick={refreshDashboard}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  const EmptyState = ({ title, description, icon: Icon }: { 
    title: string; 
    description: string; 
    icon: any;
  }) => (
    <div className="text-center py-8">
      <Icon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );

  return (
    <StudentRouteGuard>
      <Routes>
        <Route path="/*" element={
          <DashboardLayout>
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Welcome back, {user?.name || 'Student'}!
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Track your learning progress and upcoming tasks
                </p>
                {studentProfile && studentProfile.assessment_score && (
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Assessment Score: {studentProfile.assessment_score.toFixed(1)}%
                  </div>
                )}
              </div>

              {loading && <LoadingState />}
              {error && <ErrorState />}

              {!loading && !error && (
                <>
                  {/* Quick Stats Overview */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <BookOpen className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                Learning Progress
                              </dt>
                              <dd className="text-lg font-medium text-gray-900 dark:text-white">
                                {learningProgress.length} courses
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <Award className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                Achievements
                              </dt>
                              <dd className="text-lg font-medium text-gray-900 dark:text-white">
                                {achievements.length} earned
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <Clock className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                Pending Tasks
                              </dt>
                              <dd className="text-lg font-medium text-gray-900 dark:text-white">
                                {upcomingTasks.length} tasks
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                Total Points
                              </dt>
                              <dd className="text-lg font-medium text-gray-900 dark:text-white">
                                {dashboardStats?.total_points || 0}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Learning Progress */}
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                        <BookOpen className="h-5 w-5 mr-2 text-indigo-500" />
                        My Learning Progress
                      </h3>
                    </div>
                    
                    {learningProgress.length > 0 ? (
                      <>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                          {learningProgress.map((progress) => (
                            <li key={progress.id} className="px-4 py-4 sm:px-6">
                              <div className="flex justify-between">
                                <div className="flex-1">
                                  <h4 className="text-md font-medium text-gray-900 dark:text-white">
                                    {progress.lesson_title || 'Lesson'}
                                  </h4>
                                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {progress.course_title || 'Course'} • 
                                    {progress.is_completed ? ' Completed' : ' In Progress'}
                                  </p>
                                  {progress.time_spent > 0 && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                      Time spent: {Math.round(progress.time_spent / 60)} minutes
                                    </p>
                                  )}
                                </div>
                                <div className="w-24 text-right">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {progress.completion_percentage}%
                                  </div>
                                  <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div 
                                      className="bg-indigo-600 h-2.5 rounded-full" 
                                      style={{ width: `${progress.completion_percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="px-4 py-3 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                          <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Continue Learning
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <EmptyState
                          title="No Learning Progress Yet"
                          description="Start your learning journey by exploring available courses."
                          icon={BookOpen}
                        />
                        <div className="px-4 py-3 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              type="button"
                              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <BookOpen className="mr-2 h-4 w-4" />
                              Browse Courses
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              View Scheduler
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* Upcoming Tasks */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                          <Clock className="h-5 w-5 mr-2 text-yellow-500" />
                          Upcoming Tasks
                        </h3>
                      </div>
                      
                      {upcomingTasks.length > 0 ? (
                        <>
                          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {upcomingTasks.map((task) => (
                              <li key={task.id} className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {task.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {task.description || `${task.task_type} • ${task.priority} priority`}
                                    </p>
                                  </div>
                                  <div className="ml-2 flex-shrink-0 flex">
                                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      task.priority === 'urgent' 
                                        ? 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100'
                                        : task.priority === 'high'
                                        ? 'bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-100'
                                        : 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100'
                                    }`}>
                                      {formatDueDate(task.due_date)}
                                    </p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                          <div className="px-4 py-3 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                              type="button"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                            >
                              <Calendar className="mr-2 h-5 w-5" />
                              View All Tasks
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <EmptyState
                            title="No Upcoming Tasks"
                            description="Stay organized by creating your first task or exploring the scheduler."
                            icon={Clock}
                          />
                          <div className="px-4 py-3 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                              type="button"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                            >
                              <Calendar className="mr-2 h-5 w-5" />
                              Create Task
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Achievements */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                          <Award className="h-5 w-5 mr-2 text-purple-500" />
                          My Achievements
                          {dashboardStats && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                              {dashboardStats.total_points} points
                            </span>
                          )}
                        </h3>
                      </div>
                      
                      {achievements.length > 0 ? (
                        <>
                          <div className="px-4 py-5 sm:p-6">
                            <div className="space-y-3">
                              {achievements.slice(0, 3).map((achievement, index) => {
                                const colors = [
                                  'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
                                  'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
                                  'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                ];
                                return (
                                  <div key={achievement.id} className={`${colors[index]} p-3 rounded-lg`}>
                                    <div className="flex items-center">
                                      <Award className="h-5 w-5 mr-3" />
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{achievement.title}</p>
                                        <p className="text-xs opacity-75">{achievement.points} points</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="px-4 py-3 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                              type="button"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              View All Achievements
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <EmptyState
                            title="No Achievements Yet"
                            description="Complete lessons and tasks to unlock your first achievement!"
                            icon={Award}
                          />
                          <div className="px-4 py-3 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                              type="button"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              <BookOpen className="mr-2 h-5 w-5" />
                              Start Learning
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </DashboardLayout>
        } />

        <Route path="/scheduler" element={
          <DashboardLayout>
            <Scheduler userRole="student" />
          </DashboardLayout>
        } />

        <Route path="/chatbot" element={
          <DashboardLayout>
            <Chatbot userRole="student" />
          </DashboardLayout>
        } />
      </Routes>
    </StudentRouteGuard>
  );
};

export default StudentDashboard;