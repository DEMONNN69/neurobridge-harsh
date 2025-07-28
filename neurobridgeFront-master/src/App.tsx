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
import AssessmentRedirect from './components/Auth/AssessmentRedirect';
import PreAssessmentForm from './pages/PreAssessmentForm';
import AssessmentTypeSelection from './pages/AssessmentTypeSelection';
import AssessmentPage from './pages/AssessmentPage';
import ManualAssessmentPage from './pages/ManualAssessmentPage';
import TeacherProfileSetup from './pages/TeacherProfileSetup';
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
                : <ProtectedRoute requireAssessment={true}>
                    {() => <StudentDashboard />}
                  </ProtectedRoute>
            )}
          </ProtectedRoute>
        } />
        
        <Route path="/assessment" element={
          <ProtectedRoute allowedRoles={['student']}>
            {() => <AssessmentRedirect />}
          </ProtectedRoute>
        } />
        
        <Route path="/student/pre-assessment" element={
          <ProtectedRoute allowedRoles={['student']}>
            {() => <PreAssessmentForm />}
          </ProtectedRoute>
        } />
        
        <Route path="/student/assessment-type-selection" element={
          <ProtectedRoute allowedRoles={['student']}>
            {() => <AssessmentTypeSelection />}
          </ProtectedRoute>
        } />
        
        <Route path="/student/assessment-type" element={
          <ProtectedRoute allowedRoles={['student']}>
            {() => <AssessmentTypeSelection />}
          </ProtectedRoute>
        } />
        
        <Route path="/student/assessment" element={
          <ProtectedRoute allowedRoles={['student']}>
            {() => <AssessmentPage />}
          </ProtectedRoute>
        } />
        
        <Route path="/student/manual-assessment" element={
          <ProtectedRoute allowedRoles={['student']}>
            {() => <ManualAssessmentPage />}
          </ProtectedRoute>
        } />
        
        <Route path="/teacher/profile-setup" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            {() => <TeacherProfileSetup />}
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute requireAssessment={true}>
            {() => <ProfilePage />}
          </ProtectedRoute>
        } />
        
        <Route path="/learning" element={
          <ProtectedRoute requireAssessment={true}>
            {() => <LearningPage />}
          </ProtectedRoute>
        } />
        
        <Route path="/scheduler" element={
          <ProtectedRoute requireAssessment={true}>
            {() => <SchedulerPage />}
          </ProtectedRoute>
        } />
        
        <Route path="/accessibility" element={
          <ProtectedRoute requireAssessment={true}>
            {() => <AccessibilityPage />}
          </ProtectedRoute>
        } />
        
        <Route path="/chatbot" element={
          <ProtectedRoute requireAssessment={true}>
            {() => <ChatbotPage />}
          </ProtectedRoute>
        } />
        
        <Route path="/teacher/*" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            {() => <TeacherDashboard />}
          </ProtectedRoute>
        } />
        
        <Route path="/student/*" element={
          <ProtectedRoute allowedRoles={['student']} requireAssessment={true}>
            {() => <StudentDashboard />}
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;