import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { AccessibilitySettings, DyslexiaProfile, AccessibilityLog, SupportRequest } from '../services/api';

const AccessibilityPage: React.FC = () => {
  const [settings, setSettings] = useState<AccessibilitySettings | null>(null);
  const [dyslexiaProfile, setDyslexiaProfile] = useState<DyslexiaProfile | null>(null);
  const [logs, setLogs] = useState<AccessibilityLog[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    fetchAccessibilityData();
  }, []);

  const fetchAccessibilityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        settingsData,
        dyslexiaData,
        logsData,
        supportData,
        recommendationsData,
        analyticsData
      ] = await Promise.all([
        apiService.getAccessibilitySettings().catch(() => null),
        apiService.getDyslexiaProfile().catch(() => null),
        apiService.getAccessibilityLogs(),
        apiService.getSupportRequests(),
        apiService.getAccessibilityRecommendations().catch(() => null),
        apiService.getAccessibilityAnalytics().catch(() => null)
      ]);

      setSettings(settingsData);
      setDyslexiaProfile(dyslexiaData);
      setLogs(logsData);
      setSupportRequests(supportData);
      setRecommendations(recommendationsData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accessibility data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<AccessibilitySettings>) => {
    try {
      const updated = await apiService.updateAccessibilitySettings(updates);
      setSettings(updated);
      
      // Log the setting change
      await apiService.logAccessibilityAction({
        action: 'setting_changed',
        feature_name: Object.keys(updates)[0],
        context: { old_value: settings?.[Object.keys(updates)[0] as keyof AccessibilitySettings], new_value: Object.values(updates)[0] }
      });
      
      fetchAccessibilityData(); // Refresh logs
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    }
  };

  const handleUpdateDyslexiaProfile = async (updates: Partial<DyslexiaProfile>) => {
    try {
      const updated = await apiService.updateDyslexiaProfile(updates);
      setDyslexiaProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dyslexia profile');
    }
  };

  const handleCreateSupportRequest = async (requestData: Partial<SupportRequest>) => {
    try {
      await apiService.createSupportRequest(requestData);
      fetchAccessibilityData(); // Refresh support requests
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create support request');
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
          onClick={fetchAccessibilityData}
          className="ml-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Accessibility Center</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('dyslexia')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dyslexia'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dyslexia Profile
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'support'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Support Requests ({supportRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Activity Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recommendations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recommendations
          </button>
        </nav>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <div className="space-y-6">
          {/* Dyslexia Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Dyslexia Support</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dyslexia Mode</label>
                <select
                  value={settings.dyslexia_mode}
                  onChange={(e) => handleUpdateSettings({ dyslexia_mode: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="none">None</option>
                  <option value="phonological">Phonological</option>
                  <option value="surface">Surface</option>
                  <option value="visual">Visual</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.syllable_highlighting}
                    onChange={(e) => handleUpdateSettings({ syllable_highlighting: e.target.checked })}
                    className="mr-2"
                  />
                  Syllable Highlighting
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.word_emphasis}
                    onChange={(e) => handleUpdateSettings({ word_emphasis: e.target.checked })}
                    className="mr-2"
                  />
                  Word Emphasis
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.reading_guide}
                    onChange={(e) => handleUpdateSettings({ reading_guide: e.target.checked })}
                    className="mr-2"
                  />
                  Reading Guide
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.text_highlighting}
                    onChange={(e) => handleUpdateSettings({ text_highlighting: e.target.checked })}
                    className="mr-2"
                  />
                  Text Highlighting
                </label>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Display Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                <select
                  value={settings.font_size}
                  onChange={(e) => handleUpdateSettings({ font_size: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                <select
                  value={settings.font_family}
                  onChange={(e) => handleUpdateSettings({ font_family: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="default">Default</option>
                  <option value="opendyslexic">OpenDyslexic</option>
                  <option value="lexend">Lexend</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleUpdateSettings({ theme: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="high_contrast">High Contrast</option>
                  <option value="dyslexia_friendly">Dyslexia Friendly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Line Spacing</label>
                <select
                  value={settings.line_spacing}
                  onChange={(e) => handleUpdateSettings({ line_spacing: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="normal">Normal</option>
                  <option value="wide">Wide</option>
                  <option value="wider">Wider</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Letter Spacing</label>
                <select
                  value={settings.letter_spacing}
                  onChange={(e) => handleUpdateSettings({ letter_spacing: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="normal">Normal</option>
                  <option value="wide">Wide</option>
                  <option value="wider">Wider</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audio Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Audio Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.text_to_speech_enabled}
                    onChange={(e) => handleUpdateSettings({ text_to_speech_enabled: e.target.checked })}
                    className="mr-2"
                  />
                  Text-to-Speech Enabled
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Speech Rate: {settings.speech_rate}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.speech_rate}
                  onChange={(e) => handleUpdateSettings({ speech_rate: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Speech Volume: {Math.round(settings.speech_volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.speech_volume}
                  onChange={(e) => handleUpdateSettings({ speech_volume: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Navigation & Motion Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Navigation & Motion</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.keyboard_navigation}
                    onChange={(e) => handleUpdateSettings({ keyboard_navigation: e.target.checked })}
                    className="mr-2"
                  />
                  Keyboard Navigation
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.reduced_motion}
                    onChange={(e) => handleUpdateSettings({ reduced_motion: e.target.checked })}
                    className="mr-2"
                  />
                  Reduced Motion
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.focus_indicators}
                    onChange={(e) => handleUpdateSettings({ focus_indicators: e.target.checked })}
                    className="mr-2"
                  />
                  Focus Indicators
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.auto_scroll}
                    onChange={(e) => handleUpdateSettings({ auto_scroll: e.target.checked })}
                    className="mr-2"
                  />
                  Auto Scroll
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dyslexia Profile Tab */}
      {activeTab === 'dyslexia' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Dyslexia Assessment Profile</h2>
          {dyslexiaProfile ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phonological Awareness Score: {dyslexiaProfile.phonological_awareness_score || 'Not assessed'}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={dyslexiaProfile.phonological_awareness_score || 0}
                    onChange={(e) => handleUpdateDyslexiaProfile({ phonological_awareness_score: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visual Processing Score: {dyslexiaProfile.visual_processing_score || 'Not assessed'}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={dyslexiaProfile.visual_processing_score || 0}
                    onChange={(e) => handleUpdateDyslexiaProfile({ visual_processing_score: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Memory Score: {dyslexiaProfile.working_memory_score || 'Not assessed'}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={dyslexiaProfile.working_memory_score || 0}
                    onChange={(e) => handleUpdateDyslexiaProfile({ working_memory_score: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Processing Speed Score: {dyslexiaProfile.processing_speed_score || 'Not assessed'}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={dyslexiaProfile.processing_speed_score || 0}
                    onChange={(e) => handleUpdateDyslexiaProfile({ processing_speed_score: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reading Difficulty Level</label>
                <select
                  value={dyslexiaProfile.reading_difficulty_level || ''}
                  onChange={(e) => handleUpdateDyslexiaProfile({ reading_difficulty_level: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Not assessed</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={dyslexiaProfile.spelling_difficulty}
                    onChange={(e) => handleUpdateDyslexiaProfile({ spelling_difficulty: e.target.checked })}
                    className="mr-2"
                  />
                  Spelling Difficulty
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={dyslexiaProfile.writing_difficulty}
                    onChange={(e) => handleUpdateDyslexiaProfile({ writing_difficulty: e.target.checked })}
                    className="mr-2"
                  />
                  Writing Difficulty
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={dyslexiaProfile.math_difficulty}
                    onChange={(e) => handleUpdateDyslexiaProfile({ math_difficulty: e.target.checked })}
                    className="mr-2"
                  />
                  Math Difficulty
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={dyslexiaProfile.attention_issues}
                    onChange={(e) => handleUpdateDyslexiaProfile({ attention_issues: e.target.checked })}
                    className="mr-2"
                  />
                  Attention Issues
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Strengths</label>
                <textarea
                  value={dyslexiaProfile.strengths || ''}
                  onChange={(e) => handleUpdateDyslexiaProfile({ strengths: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recommended Accommodations</label>
                <textarea
                  value={dyslexiaProfile.recommended_accommodations || ''}
                  onChange={(e) => handleUpdateDyslexiaProfile({ recommended_accommodations: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="text-sm text-gray-500">
                Assessment Date: {dyslexiaProfile.assessment_date ? new Date(dyslexiaProfile.assessment_date).toLocaleDateString() : 'Not set'}
                <br />
                Last Review: {dyslexiaProfile.last_review_date ? new Date(dyslexiaProfile.last_review_date).toLocaleDateString() : 'Not reviewed'}
                <br />
                Next Review: {dyslexiaProfile.next_review_date ? new Date(dyslexiaProfile.next_review_date).toLocaleDateString() : 'Not scheduled'}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No dyslexia profile found. Create one to get personalized recommendations.</p>
          )}
        </div>
      )}

      {/* Support Requests Tab */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Create Support Request</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const requestData = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                category: formData.get('category') as SupportRequest['category'],
                priority: formData.get('priority') as SupportRequest['priority']
              };
              handleCreateSupportRequest(requestData);
              e.currentTarget.reset();
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  name="title"
                  placeholder="Request Title"
                  required
                  className="border border-gray-300 rounded-md px-3 py-2"
                />
                <select
                  name="category"
                  required
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Category</option>
                  <option value="accessibility">Accessibility</option>
                  <option value="dyslexia_support">Dyslexia Support</option>
                  <option value="technical">Technical</option>
                  <option value="feature_request">Feature Request</option>
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
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Submit Request
                </button>
              </div>
              <textarea
                name="description"
                placeholder="Describe your request in detail..."
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={4}
              />
            </form>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Support Requests</h2>
            {supportRequests.length === 0 ? (
              <p className="text-gray-500">No support requests found.</p>
            ) : (
              <div className="space-y-4">
                {supportRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{request.title}</h3>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {request.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          request.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">{request.description}</p>
                    <div className="text-sm text-gray-500">
                      Category: {request.category.replace('_', ' ')}
                      <br />
                      Created: {new Date(request.created_at).toLocaleDateString()}
                      {request.assigned_to_name && (
                        <>
                          <br />
                          Assigned to: {request.assigned_to_name}
                        </>
                      )}
                      {request.resolved_at && (
                        <>
                          <br />
                          Resolved: {new Date(request.resolved_at).toLocaleDateString()}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Accessibility Activity Logs</h2>
          {logs.length === 0 ? (
            <p className="text-gray-500">No activity logs found.</p>
          ) : (
            <div className="space-y-3">
              {logs.slice(0, 50).map((log) => (
                <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        log.action === 'setting_changed' ? 'bg-blue-100 text-blue-800' :
                        log.action === 'feature_used' ? 'bg-green-100 text-green-800' :
                        log.action === 'assistance_requested' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {log.action.replace('_', ' ')}
                      </span>
                      <span className="ml-2 font-medium">{log.feature_name}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {(log.old_value || log.new_value) && (
                    <div className="text-sm text-gray-600 mt-1">
                      {log.old_value && <span>From: {log.old_value}</span>}
                      {log.old_value && log.new_value && <span> → </span>}
                      {log.new_value && <span>To: {log.new_value}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Personalized Recommendations</h2>
          {recommendations ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Recommended Settings</h3>
                <pre className="text-sm text-blue-700">{JSON.stringify(recommendations, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No recommendations available. Complete your dyslexia profile assessment to get personalized recommendations.</p>
          )}
          
          {analytics && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Usage Analytics</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <pre className="text-sm text-gray-700">{JSON.stringify(analytics, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccessibilityPage;
