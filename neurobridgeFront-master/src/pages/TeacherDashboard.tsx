import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import TeacherRouteGuard from '../components/Auth/TeacherRouteGuard';
import { BookOpen, Users, BarChart, Calendar, AlertCircle, TrendingUp, Clock, Building } from 'lucide-react';
import Chatbot from '../components/Chatbot/Chatbot';
import Scheduler from '../components/Scheduler/Scheduler';
import { useAuth } from '../hooks/useAuth';
import { apiService, TeacherProfile } from '../services/api';

interface TeacherStats {
  totalStudents: number;
  activeCourses: number;
  averagePerformance: number;
  tasksToday: number;
}

interface StudentActivity {
  id: number;
  student: string;
  activity: string;
  time: string;
  type: 'completion' | 'progress' | 'help_needed';
}

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [stats, setStats] = useState<TeacherStats>({
    totalStudents: 0,
    activeCourses: 0,
    averagePerformance: 0,
    tasksToday: 0
  });
  const [recentActivities, setRecentActivities] = useState<StudentActivity[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch teacher profile and dashboard data
      const [profileData, coursesData] = await Promise.allSettled([
        apiService.getTeacherProfile(),
        apiService.getCourses()
      ]);

      // Handle teacher profile
      if (profileData.status === 'fulfilled') {
        setTeacherProfile(profileData.value);
      }

      // Handle courses data to calculate stats
      if (coursesData.status === 'fulfilled') {
        const courses = coursesData.value;
        setStats(prev => ({
          ...prev,
          activeCourses: courses.filter(course => course.is_active).length
        }));
      }

      // Mock recent activities for now (replace with real API call later)
      setRecentActivities([
        { 
          id: 1, 
          student: 'Alex Johnson', 
          activity: 'Completed Assessment - Score: 85%', 
          time: '2 hours ago',
          type: 'completion'
        },
        { 
          id: 2, 
          student: 'Sarah Williams', 
          activity: 'Started new learning module', 
          time: '3 hours ago',
          type: 'progress'
        },
        { 
          id: 3, 
          student: 'Mike Chen', 
          activity: 'Requested help with exercises', 
          time: '5 hours ago',
          type: 'help_needed'
        },
      ]);

    } catch (err) {
      console.error('Error fetching teacher dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statItems = [
    { 
      name: 'Total Students', 
      value: stats.totalStudents.toString(), 
      icon: Users, 
      color: 'bg-blue-500',
      description: 'Active learners'
    },
    { 
      name: 'Active Courses', 
      value: stats.activeCourses.toString(), 
      icon: BookOpen, 
      color: 'bg-green-500',
      description: 'Currently running'
    },
    { 
      name: 'Avg Performance', 
      value: stats.averagePerformance > 0 ? `${stats.averagePerformance}%` : 'N/A', 
      icon: BarChart, 
      color: 'bg-yellow-500',
      description: 'Student progress'
    },
    { 
      name: 'Tasks Today', 
      value: stats.tasksToday.toString(), 
      icon: Calendar, 
      color: 'bg-purple-500',
      description: 'Pending items'
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completion':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'help_needed':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'completion':
        return 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100';
      case 'progress':
        return 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100';
      case 'help_needed':
        return 'bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-100';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100';
    }
  };

  const LoadingState = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  const ErrorState = () => (
    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <div className="flex items-center">
        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
        <div>
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
            Error Loading Dashboard
          </h3>
          <p className="text-red-600 dark:text-red-400 mt-1">{error}</p>
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

  return (
    <TeacherRouteGuard>
      <Routes>
        <Route path="/*" element={
          <DashboardLayout>
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Welcome back, {user?.name || 'Teacher'}!
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Monitor student progress and manage your teaching resources
                </p>
                {teacherProfile && (
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200">
                    <Building className="h-4 w-4 mr-2" />
                    {teacherProfile.department} • {teacherProfile.specialization}
                  </div>
                )}
              </div>

              {loading && <LoadingState />}
              {error && <ErrorState />}

              {!loading && !error && (
                <>
                  {/* Stats Overview */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {statItems.map((stat) => (
                      <div
                        key={stat.name}
                        className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
                      >
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                              <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                {stat.name}
                              </dt>
                              <dd className="flex items-baseline">
                                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                  {stat.value}
                                </div>
                                <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                  {stat.description}
                                </div>
                              </dd>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* Recent Activities */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                          Recent Student Activities
                        </h3>
                      </div>
                      {recentActivities.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                          {recentActivities.map((activity) => (
                            <li key={activity.id} className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {getActivityIcon(activity.type)}
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {activity.student}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {activity.activity}
                                    </p>
                                  </div>
                                </div>
                                <div className="ml-2 flex-shrink-0">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActivityBadgeColor(activity.type)}`}>
                                    {activity.time}
                                  </span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <Clock className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No Recent Activities
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Student activities will appear here as they engage with your courses.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                          Quick Actions
                        </h3>
                      </div>
                      <div className="px-4 py-5 sm:p-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => window.location.href = '/learning'}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <BookOpen className="mr-2 h-5 w-5" />
                            Manage Courses
                          </button>
                          <button
                            type="button"
                            onClick={() => window.location.href = '/profile'}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <Users className="mr-2 h-5 w-5" />
                            View Students
                          </button>
                          <button
                            type="button"
                            onClick={() => window.location.href = '/scheduler'}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            <Calendar className="mr-2 h-5 w-5" />
                            Schedule Session
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                          >
                            <BarChart className="mr-2 h-5 w-5" />
                            View Reports
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DashboardLayout>
        } />

        <Route path="/scheduler" element={
          <DashboardLayout>
            <Scheduler userRole="teacher" />
          </DashboardLayout>
        } />

        <Route path="/chatbot" element={
          <DashboardLayout>
            <Chatbot userRole="teacher" />
          </DashboardLayout>
        } />
      </Routes>
    </TeacherRouteGuard>
  );
};

export default TeacherDashboard;