import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { ChatSession, ChatMessage, BotPersonality, UserPreference, ChatFeedback } from '../services/api';

const ChatbotPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [personalities, setPersonalities] = useState<BotPersonality[]>([]);
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatbotData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatbotData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sessionsData, personalitiesData, preferencesData] = await Promise.all([
        apiService.getChatSessions(),
        apiService.getBotPersonalities(),
        apiService.getChatPreferences().catch(() => null)
      ]);

      setSessions(sessionsData);
      setPersonalities(personalitiesData);
      setPreferences(preferencesData);

      // Load the most recent active session
      const activeSession = sessionsData.find(s => s.is_active);
      if (activeSession) {
        await loadSession(activeSession);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chatbot data');
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (session: ChatSession) => {
    try {
      setCurrentSession(session);
      const messagesData = await apiService.getChatMessages(session.session_id);
      setMessages(messagesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session messages');
    }
  };

  const createNewSession = async () => {
    try {
      const newSession = await apiService.createChatSession({
        title: `Chat Session ${new Date().toLocaleString()}`
      });
      setSessions([newSession, ...sessions]);
      setCurrentSession(newSession);
      setMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create new session');
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !currentSession || sendingMessage) return;

    try {
      setSendingMessage(true);
      const userMessage = messageInput;
      setMessageInput('');

      // Add user message to UI immediately
      const tempUserMessage: ChatMessage = {
        id: Date.now(),
        message_type: 'user',
        content: userMessage,
        metadata: {},
        created_at: new Date().toISOString(),
        session: currentSession.id
      };
      setMessages(prev => [...prev, tempUserMessage]);

      // Send message to backend
      const response = await apiService.sendMessage(currentSession.session_id, {
        content: userMessage
      });

      // Replace temp message with actual response
      const updatedMessages = await apiService.getChatMessages(currentSession.session_id);
      setMessages(updatedMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const updatePreferences = async (updates: Partial<UserPreference>) => {
    try {
      const updated = await apiService.updateChatPreferences(updates);
      setPreferences(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    }
  };

  const provideFeedback = async (messageId: number, feedbackType: ChatFeedback['feedback_type'], rating?: number, comment?: string) => {
    try {
      await apiService.createChatFeedback({
        message: messageId,
        feedback_type: feedbackType,
        rating,
        comment
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to provide feedback');
    }
  };

  const getMessageTypeIcon = (type: ChatMessage['message_type']) => {
    switch (type) {
      case 'user': return '👤';
      case 'bot': return '🤖';
      case 'system': return '⚙️';
      default: return '💬';
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
          onClick={fetchChatbotData}
          className="ml-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Chatbot Assistant</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'chat'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('personalities')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'personalities'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bot Personalities ({personalities.length})
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preferences'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Preferences
          </button>
        </nav>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Session Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Chat Sessions</h2>
                <button
                  onClick={createNewSession}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  New Chat
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => loadSession(session)}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      currentSession?.id === session.id
                        ? 'bg-blue-100 border border-blue-300'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm truncate">
                      {session.title || `Session ${session.session_id.slice(-8)}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(session.created_at).toLocaleDateString()}
                    </div>
                    <div className={`text-xs ${session.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {session.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-4">
                <h3 className="font-semibold">
                  {currentSession ? (currentSession.title || `Chat Session`) : 'No Session Selected'}
                </h3>
                {currentSession && (
                  <p className="text-sm text-gray-500">
                    Started: {new Date(currentSession.created_at).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentSession ? (
                  messages.length === 0 ? (
                    <div className="text-center text-gray-500">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.message_type === 'user'
                              ? 'bg-blue-500 text-white'
                              : message.message_type === 'bot'
                              ? 'bg-gray-200 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          <div className="flex items-center mb-1">
                            <span className="mr-2">{getMessageTypeIcon(message.message_type)}</span>
                            <span className="text-xs opacity-75">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                          {message.audio_url && (
                            <audio controls className="mt-2 w-full">
                              <source src={message.audio_url} type="audio/mpeg" />
                            </audio>
                          )}
                          {message.message_type === 'bot' && (
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={() => provideFeedback(message.id, 'helpful')}
                                className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                              >
                                👍 Helpful
                              </button>
                              <button
                                onClick={() => provideFeedback(message.id, 'not_helpful')}
                                className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                              >
                                👎 Not Helpful
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  <div className="text-center text-gray-500">
                    Select a session or create a new one to start chatting
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {currentSession && (
                <div className="border-t border-gray-200 p-4">
                  <div className="flex space-x-2">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 resize-none"
                      rows={2}
                      disabled={sendingMessage}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim() || sendingMessage}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {sendingMessage ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Chat Sessions History</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-500">No chat sessions found.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">
                        {session.title || `Session ${session.session_id.slice(-8)}`}
                      </h3>
                      <p className="text-sm text-gray-500">ID: {session.session_id}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        session.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {session.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => loadSession(session)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Created: {new Date(session.created_at).toLocaleString()}
                    <br />
                    Updated: {new Date(session.updated_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Personalities Tab */}
      {activeTab === 'personalities' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Available Bot Personalities</h2>
          {personalities.length === 0 ? (
            <p className="text-gray-500">No bot personalities available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalities.map((personality) => (
                <div
                  key={personality.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    preferences?.preferred_personality === personality.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updatePreferences({ preferred_personality: personality.id })}
                >
                  <div className="flex items-center mb-3">
                    {personality.avatar_url && (
                      <img
                        src={personality.avatar_url}
                        alt={personality.name}
                        className="w-12 h-12 rounded-full mr-3"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{personality.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        personality.personality_type === 'tutor' ? 'bg-blue-100 text-blue-800' :
                        personality.personality_type === 'companion' ? 'bg-green-100 text-green-800' :
                        personality.personality_type === 'counselor' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {personality.personality_type}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{personality.description}</p>
                  <div className={`text-xs ${personality.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {personality.is_active ? 'Available' : 'Unavailable'}
                  </div>
                  {preferences?.preferred_personality === personality.id && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">✓ Currently Selected</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Chat Preferences</h2>
          {preferences ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Communication Style</label>
                <select
                  value={preferences.communication_style}
                  onChange={(e) => updatePreferences({ communication_style: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="encouraging">Encouraging</option>
                  <option value="direct">Direct</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Response Speed</label>
                <select
                  value={preferences.response_speed}
                  onChange={(e) => updatePreferences({ response_speed: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language Preference</label>
                <input
                  type="text"
                  value={preferences.language_preference}
                  onChange={(e) => updatePreferences({ language_preference: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., en-US, es-ES, fr-FR"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.enable_audio_response}
                    onChange={(e) => updatePreferences({ enable_audio_response: e.target.checked })}
                    className="mr-2"
                  />
                  Enable Audio Responses
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.enable_speech_recognition}
                    onChange={(e) => updatePreferences({ enable_speech_recognition: e.target.checked })}
                    className="mr-2"
                  />
                  Enable Speech Recognition
                </label>
              </div>

              <div className="text-sm text-gray-500">
                Last updated: {new Date(preferences.updated_at).toLocaleString()}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 mb-4">No preferences found. Default settings will be used.</p>
              <button
                onClick={() => updatePreferences({
                  communication_style: 'casual',
                  enable_audio_response: false,
                  enable_speech_recognition: false,
                  response_speed: 'normal',
                  language_preference: 'en-US'
                })}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Create Preferences
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatbotPage;
