import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { BookOpen, Award, Clock, Calendar } from 'lucide-react';
import Chatbot from '../components/Chatbot/Chatbot';
import Scheduler from '../components/Scheduler/Scheduler';

const StudentDashboard: React.FC = () => {
  // Mock data for demonstration
  const learningProgress = [
    { id: 1, subject: 'Mathematics', progress: 65, lastActivity: 'Completed fractions quiz' },
    { id: 2, subject: 'Science', progress: 40, lastActivity: 'Started plant lifecycle chapter' },
    { id: 3, subject: 'English', progress: 80, lastActivity: 'Submitted reading comprehension' },
  ];

  const upcomingTasks = [
    { id: 1, title: 'Math Quiz - Chapter 4', due: 'Tomorrow, 3:00 PM' },
    { id: 2, title: 'Science Project Submission', due: 'Friday, 12:00 PM' },
    { id: 3, title: 'English Vocabulary Test', due: 'Next Monday, 10:00 AM' },
  ];

  return (
    <Routes>
      <Route path="/*" element={
        <DashboardLayout>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Student Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Track your learning progress and upcoming tasks
              </p>
            </div>

            {/* Learning Progress */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-indigo-500" />
                  My Learning Progress
                </h3>
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {learningProgress.map((item) => (
                  <li key={item.id} className="px-4 py-4 sm:px-6">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white">{item.subject}</h4>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.lastActivity}</p>
                      </div>
                      <div className="w-24 text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{item.progress}%</div>
                        <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-indigo-600 h-2.5 rounded-full" 
                            style={{ width: `${item.progress}%` }}
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
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {upcomingTasks.map((task) => (
                    <li key={task.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100">
                            {task.due}
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
              </div>

              {/* Achievements */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                    <Award className="h-5 w-5 mr-2 text-purple-500" />
                    My Achievements
                  </h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg text-center">
                      <Award className="h-8 w-8 mx-auto text-purple-600 dark:text-purple-400" />
                      <p className="mt-2 text-sm font-medium text-purple-800 dark:text-purple-300">Perfect Attendance</p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg text-center">
                      <Award className="h-8 w-8 mx-auto text-blue-600 dark:text-blue-400" />
                      <p className="mt-2 text-sm font-medium text-blue-800 dark:text-blue-300">Math Wizard</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg text-center">
                      <Award className="h-8 w-8 mx-auto text-green-600 dark:text-green-400" />
                      <p className="mt-2 text-sm font-medium text-green-800 dark:text-green-300">Reading Champion</p>
                    </div>
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
              </div>
            </div>
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
  );
};

export default StudentDashboard;