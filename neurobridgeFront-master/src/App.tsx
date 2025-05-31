import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ProfilePage from './pages/ProfilePage';
import LearningPage from './pages/LearningPage';
import SchedulerPage from './pages/SchedulerPage';
import AccessibilityPage from './pages/AccessibilityPage';
import ChatbotPage from './pages/ChatbotPage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { useAccessibility } from './hooks/useAccessibility';

function App() {
  const { isAuthenticated } = useAuth();
  const { theme } = useAccessibility();

  return (
    <div className={`min-h-screen ${theme}`}>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            {({ user }) => (
              user?.role === 'teacher' 
                ? <TeacherDashboard /> 
                : <StudentDashboard />
            )}
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            {() => <ProfilePage />}
          </ProtectedRoute>
        } />
        
        <Route path="/learning" element={
          <ProtectedRoute>
            {() => <LearningPage />}
          </ProtectedRoute>
        } />
        
        <Route path="/scheduler" element={
          <ProtectedRoute>
            {() => <SchedulerPage />}
          </ProtectedRoute>
        } />
        
        <Route path="/accessibility" element={
          <ProtectedRoute>
            {() => <AccessibilityPage />}
          </ProtectedRoute>
        } />
        
        <Route path="/chatbot" element={
          <ProtectedRoute>
            {() => <ChatbotPage />}
          </ProtectedRoute>
        } />
        
        <Route path="/teacher/*" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            {() => <TeacherDashboard />}
          </ProtectedRoute>
        } />
        
        <Route path="/student/*" element={
          <ProtectedRoute allowedRoles={['student']}>
            {() => <StudentDashboard />}
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;