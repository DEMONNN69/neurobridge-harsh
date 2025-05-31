import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { BookOpen, Users, BarChart, Calendar } from 'lucide-react';
import Chatbot from '../components/Chatbot/Chatbot';
import Scheduler from '../components/Scheduler/Scheduler';

const TeacherDashboard: React.FC = () => {
  // Mock data for demonstration
  const stats = [
    { name: 'Total Students', value: '12', icon: Users, color: 'bg-blue-500' },
    { name: 'Active Syllabi', value: '3', icon: BookOpen, color: 'bg-green-500' },
    { name: 'Average Performance', value: '76%', icon: BarChart, color: 'bg-yellow-500' },
    { name: 'Tasks for Today', value: '4', icon: Calendar, color: 'bg-purple-500' },
  ];

  const recentActivities = [
    { id: 1, student: 'Alex Johnson', activity: 'Completed Chapter 2 Quiz', time: '2 hours ago' },
    { id: 2, student: 'Sarah Williams', activity: 'Started new lesson on Fractions', time: '3 hours ago' },
    { id: 3, student: 'Mike Chen', activity: 'Needs assistance with Chapter 3', time: '5 hours ago' },
  ];

  return (
    <Routes>
      <Route path="/*" element={
        <DashboardLayout>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Teacher Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Monitor student progress and manage your teaching resources
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
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
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentActivities.map((activity) => (
                    <li key={activity.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                          {activity.student}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            {activity.activity}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
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
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <BookOpen className="mr-2 h-5 w-5" />
                      Create New Syllabus
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Add New Student
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <Calendar className="mr-2 h-5 w-5" />
                      Schedule a Session
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      <BarChart className="mr-2 h-5 w-5" />
                      View Performance Reports
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
  );
};

export default TeacherDashboard;