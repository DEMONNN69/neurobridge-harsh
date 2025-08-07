import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, LogOut, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AssessmentMain from '../components/Assessment/AssessmentMain';

const NewAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, updateAssessmentStatus } = useAuth();
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [startTime] = useState(Date.now());
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update timer every second
  React.useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAssessmentComplete = async (sessionId: string) => {
    try {
      // Update assessment status
      updateAssessmentStatus(true);
      
      // Set completion with mock result for now
      setAssessmentResult({
        summary: {
          total_questions: 7, // One per category
          correct_answers: 7,
          accuracy_percentage: 100,
          total_time: formatTime(currentTime - startTime)
        },
        session_id: sessionId
      });
      setAssessmentComplete(true);
    } catch (error) {
      console.error('Error completing assessment:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (assessmentComplete && assessmentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 transform transition-all duration-500 scale-100">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3 text-green-600">
              <CheckCircle className="w-16 h-16 animate-pulse" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Assessment Complete! 🎉
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200 transform hover:scale-105 transition-transform">
                <p className="text-sm text-blue-700 font-medium">Categories Completed</p>
                <p className="text-3xl font-bold text-blue-600">{assessmentResult.summary.total_questions}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200 transform hover:scale-105 transition-transform">
                <p className="text-sm text-green-700 font-medium">Success Rate</p>
                <p className="text-3xl font-bold text-green-600">{assessmentResult.summary.accuracy_percentage}%</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200 transform hover:scale-105 transition-transform">
                <p className="text-sm text-purple-700 font-medium">Total Time</p>
                <p className="text-3xl font-bold text-purple-600">{assessmentResult.summary.total_time}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl">
                <p className="text-lg font-semibold">🧠 Your cognitive assessment is complete!</p>
                <p className="text-blue-100">Results have been saved to your profile.</p>
              </div>
              
              <button
                onClick={() => navigate('/student/dashboard')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-8 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg transform hover:scale-105"
              >
                🏠 Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">🧠</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NeuroBridge Assessment
              </h1>
              <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full border border-blue-200">
                Dyslexia Screening
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-gray-700 bg-white/50 px-3 py-1 rounded-full border border-gray-200">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">{formatTime(currentTime - startTime)}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors bg-white/50 px-3 py-1 rounded-full border border-gray-200 hover:border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Assessment Content */}
      <div className="relative">
        <AssessmentMain onComplete={handleAssessmentComplete} />
      </div>
    </div>
  );
};

export default NewAssessmentPage;
