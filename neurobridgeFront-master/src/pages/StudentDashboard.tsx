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

  useEffect(() => {
    const loadDashboard = async () => {
      // Clear refresh/assessment_completed parameters if present
      if (searchParams.get('refresh') || searchParams.get('assessment_completed')) {
        setSearchParams({}, { replace: true });
      }
      
      // Fetch dashboard data
      await fetchDashboardData();
    };
    
    loadDashboard();
  }, []); // Run only once on mount

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

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

      // Handle studentProfile
      if (studentProfileData.status === 'fulfilled') {
        setStudentProfile(studentProfileData.value);
      }

      // Handle achievements
      if (achievementsData.status === 'fulfilled') {
        setAchievements(achievementsData.value);
      }

      // Handle learning progress
      if (progressData.status === 'fulfilled') {
        setLearningProgress(progressData.value);
      }

      // Handle upcoming tasks
      if (tasksData.status === 'fulfilled') {
        const tasks = tasksData.value;
        // Filter for upcoming tasks and sort by due date
        const upcoming = tasks
          .filter((task: Task) => task.status !== 'completed' && new Date(task.due_date) > new Date())
          .sort((a: Task, b: Task) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
          .slice(0, 5); // Show only next 5 tasks
        setUpcomingTasks(upcoming);
      }

      // Handle dashboard stats
      if (statsData.status === 'fulfilled') {
        setDashboardStats(statsData.value);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
            onClick={fetchDashboardData}
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
                      <EmptyState
                        title="No Learning Progress Yet"
                        description="Start learning by enrolling in courses to see your progress here."
                        icon={BookOpen}
                      />
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
                        <EmptyState
                          title="No Upcoming Tasks"
                          description="You're all caught up! New tasks will appear here when they're assigned."
                          icon={Clock}
                        />
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
                        <EmptyState
                          title="No Achievements Yet"
                          description="Complete lessons and tasks to earn your first achievement!"
                          icon={Award}
                        />
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