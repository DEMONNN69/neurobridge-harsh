import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Task, Event, StudySession, Reminder } from '../services/api';

const SchedulerPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchSchedulerData();
  }, []);

  const fetchSchedulerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [tasksData, eventsData, studySessionsData, remindersData] = await Promise.all([
        apiService.getTasks(),
        apiService.getEvents(),
        apiService.getStudySessions(),
        apiService.getReminders()
      ]);

      setTasks(tasksData);
      setEvents(eventsData);
      setStudySessions(studySessionsData);
      setReminders(remindersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scheduler data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      await apiService.createTask(taskData);
      fetchSchedulerData();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const handleCreateEvent = async (eventData: Partial<Event>) => {
    try {
      await apiService.createEvent(eventData);
      fetchSchedulerData();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    }
  };

  const handleCreateStudySession = async (sessionData: Partial<StudySession>) => {
    try {
      await apiService.createStudySession(sessionData);
      fetchSchedulerData();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create study session');
    }
  };

  const handleCreateReminder = async (reminderData: Partial<Reminder>) => {
    try {
      await apiService.createReminder(reminderData);
      fetchSchedulerData();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reminder');
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, status: Task['status']) => {
    try {
      await apiService.updateTask(taskId, { status });
      fetchSchedulerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
          onClick={fetchSchedulerData}
          className="ml-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Scheduler</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create New
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'events'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('study-sessions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'study-sessions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Study Sessions ({studySessions.length})
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reminders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reminders ({reminders.length})
          </button>
        </nav>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tasks found. Create your first task!</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                    {task.description && (
                      <p className="text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                      {task.estimated_duration && (
                        <span>Duration: {task.estimated_duration} min</span>
                      )}
                      {task.is_recurring && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Recurring
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as Task['status'])}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Created: {new Date(task.created_at).toLocaleDateString()}
                  {task.completed_at && (
                    <span className="ml-4">
                      Completed: {new Date(task.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No events found. Create your first event!</p>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                    {event.description && (
                      <p className="text-gray-600 mb-2">{event.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        {event.is_all_day ? 'All Day' : 
                          `${new Date(event.start_datetime).toLocaleString()} - ${new Date(event.end_datetime).toLocaleString()}`
                        }
                      </span>
                      {event.location && <span>📍 {event.location}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      event.event_type === 'exam' ? 'bg-red-100 text-red-800' :
                      event.event_type === 'class' ? 'bg-blue-100 text-blue-800' :
                      event.event_type === 'meeting' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.event_type.replace('_', ' ')}
                    </span>
                    {event.is_recurring && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                        Recurring
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Reminder: {event.reminder_minutes} minutes before
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Study Sessions Tab */}
      {activeTab === 'study-sessions' && (
        <div className="space-y-4">
          {studySessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No study sessions found. Create your first study session!</p>
            </div>
          ) : (
            studySessions.map((session) => (
              <div key={session.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{session.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                      <span>Subject: {session.subject}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        session.session_type === 'individual' ? 'bg-blue-100 text-blue-800' :
                        session.session_type === 'group' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {session.session_type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        {new Date(session.start_time).toLocaleString()} - {new Date(session.end_time).toLocaleString()}
                      </span>
                      {session.location && <span>📍 {session.location}</span>}
                    </div>
                    {session.notes && (
                      <p className="text-gray-600 mt-2">{session.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      session.is_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.is_completed ? 'Completed' : 'Upcoming'}
                    </span>
                    {session.effectiveness_rating && (
                      <div className="text-sm">
                        Rating: {session.effectiveness_rating}/5 ⭐
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reminders Tab */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No reminders found. Create your first reminder!</p>
            </div>
          ) : (
            reminders.map((reminder) => (
              <div key={reminder.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{reminder.title}</h3>
                    <p className="text-gray-600 mb-2">{reminder.message}</p>
                    <div className="text-sm text-gray-500">
                      Remind at: {new Date(reminder.remind_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      reminder.reminder_type === 'task' ? 'bg-blue-100 text-blue-800' :
                      reminder.reminder_type === 'event' ? 'bg-green-100 text-green-800' :
                      reminder.reminder_type === 'medication' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {reminder.reminder_type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      reminder.is_sent ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reminder.is_sent ? 'Sent' : 'Pending'}
                    </span>
                    {reminder.is_recurring && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                        Recurring
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create New {activeTab.slice(0, -1).replace('-', ' ')}</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Task Form */}
              {activeTab === 'tasks' && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const taskData = {
                    title: formData.get('title') as string,
                    description: formData.get('description') as string,
                    task_type: formData.get('task_type') as Task['task_type'],
                    priority: formData.get('priority') as Task['priority'],
                    due_date: formData.get('due_date') as string,
                    estimated_duration: Number(formData.get('estimated_duration')),
                    is_recurring: formData.get('is_recurring') === 'on'
                  };
                  handleCreateTask(taskData);
                }}>
                  <div className="space-y-4">
                    <input
                      name="title"
                      placeholder="Task Title"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    <textarea
                      name="description"
                      placeholder="Description"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={3}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        name="task_type"
                        required
                        className="border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select Type</option>
                        <option value="assignment">Assignment</option>
                        <option value="study">Study</option>
                        <option value="meeting">Meeting</option>
                        <option value="reminder">Reminder</option>
                        <option value="other">Other</option>
                      </select>
                      <select
                        name="priority"
                        required
                        className="border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        name="due_date"
                        type="datetime-local"
                        required
                        className="border border-gray-300 rounded-md px-3 py-2"
                      />
                      <input
                        name="estimated_duration"
                        type="number"
                        placeholder="Duration (minutes)"
                        className="border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <label className="flex items-center">
                      <input type="checkbox" name="is_recurring" className="mr-2" />
                      Recurring task
                    </label>
                    <button
                      type="submit"
                      className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Create Task
                    </button>
                  </div>
                </form>
              )}

              {/* Similar forms for events, study sessions, and reminders would go here */}
              {/* For brevity, I'm showing a simplified version */}
              {activeTab !== 'tasks' && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Form for {activeTab} coming soon...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulerPage;
