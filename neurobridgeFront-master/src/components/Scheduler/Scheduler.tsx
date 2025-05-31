import React, { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { Calendar, Clock, Edit, Trash2, Plus } from 'lucide-react';
import { UserRole } from '../../context/AuthContext';

interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed';
}

interface SchedulerProps {
  userRole: UserRole;
}

const Scheduler: React.FC<SchedulerProps> = ({ userRole }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  
  // Mock data for demonstration
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Math Quiz',
      description: 'Chapter 4 - Fractions and Decimals',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '10:00 AM',
      status: 'upcoming'
    },
    {
      id: '2',
      title: 'Reading Assignment',
      description: 'Read Chapter 5 of "To Kill a Mockingbird"',
      date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      time: '02:00 PM',
      status: 'upcoming'
    },
    {
      id: '3',
      title: 'Science Project',
      description: 'Prepare presentation on ecosystem',
      date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
      time: '11:30 AM',
      status: 'upcoming'
    }
  ]);

  const startDate = startOfWeek(new Date());
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  
  const todaysTasks = tasks.filter(task => 
    isSameDay(parseISO(task.date), selectedDate)
  );

  const handleAddTask = () => {
    setCurrentTask(null);
    setShowTaskForm(true);
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleTaskComplete = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: 'completed' as const } : task
    ));
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const newTask: Task = {
      id: currentTask?.id || Math.random().toString(36).substr(2, 9),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      status: 'upcoming'
    };
    
    if (currentTask) {
      // Update existing task
      setTasks(tasks.map(task => task.id === currentTask.id ? newTask : task));
    } else {
      // Add new task
      setTasks([...tasks, newTask]);
    }
    
    setShowTaskForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
          <Calendar className="mr-2 h-6 w-6 text-indigo-500" />
          Visual Scheduler
        </h1>
        {userRole === 'teacher' && (
          <button
            onClick={handleAddTask}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </button>
        )}
      </div>

      {/* Week View Calendar */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {weekDays.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDate(day)}
              className={`p-4 text-center ${
                isSameDay(day, selectedDate)
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {format(day, 'EEE')}
              </p>
              <p className={`text-lg font-semibold ${
                isSameDay(day, new Date()) 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                {format(day, 'd')}
              </p>
              <div className="mt-1 flex justify-center">
                {tasks.filter(task => isSameDay(parseISO(task.date), day)).length > 0 && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tasks for selected day */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Tasks for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
        </div>
        
        {todaysTasks.length === 0 ? (
          <div className="px-4 py-6 sm:px-6 text-center text-gray-500 dark:text-gray-400">
            No tasks scheduled for this day
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {todaysTasks.map((task) => (
              <li key={task.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => handleTaskComplete(task.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        task.status === 'completed' 
                          ? 'text-gray-400 dark:text-gray-500 line-through' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {task.title}
                      </p>
                      <p className={`text-xs ${
                        task.status === 'completed' 
                          ? 'text-gray-400 dark:text-gray-500' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        <Clock className="inline h-3 w-3 mr-1" /> {task.time}
                      </p>
                    </div>
                  </div>
                  
                  {userRole === 'teacher' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 rounded-full text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="mt-2">
                  <p className={`text-sm ${
                    task.status === 'completed' 
                      ? 'text-gray-400 dark:text-gray-500' 
                      : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {task.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add/Edit Task Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {currentTask ? 'Edit Task' : 'Add New Task'}
            </h3>
            
            <form onSubmit={handleSaveTask}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    defaultValue={currentTask?.title}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    defaultValue={currentTask?.description}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      id="date"
                      required
                      defaultValue={currentTask?.date || format(selectedDate, 'yyyy-MM-dd')}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      id="time"
                      required
                      defaultValue={currentTask?.time ? currentTask.time.slice(0, 5) : '09:00'}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-5 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scheduler;