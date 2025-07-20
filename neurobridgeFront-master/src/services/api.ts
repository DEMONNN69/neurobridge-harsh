// API service for communicating with Django backend
const getApiBaseUrl = (): string => {
  // Check if we're in a Codespace
  const hostname = window.location.hostname;
  
  if (hostname.includes('.app.github.dev')) {
    // We're in Codespaces - use your specific Codespace URL
    return 'https://miniature-eureka-x7pwjg4g46j2qxw-8000.app.github.dev/api';
  }
  
  // Default to localhost for local development
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type: 'student' | 'teacher';
  };
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  user_type: 'student' | 'teacher';
}

// Profiles interfaces
export interface UserProfile {
  id: number;
  bio?: string;
  profile_picture?: string;
  phone?: string;
  date_of_birth?: string;
  user: number;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: number;
  student_id: string;
  grade_level?: string;
  dyslexia_type: 'phonological' | 'surface' | 'visual' | 'mixed' | 'none';
  assessment_type?: 'dyslexia' | 'autism' | 'both';
  assessment_score?: number;
  dyslexia_score?: number;
  autism_score?: number;
  
  // XGBoost dyslexia prediction results
  dyslexia_prediction_level?: string;
  dyslexia_prediction_confidence?: number;
  dyslexia_prediction_date?: string;
  
  // XGBoost autism prediction results
  autism_prediction_level?: string;
  autism_prediction_confidence?: number;
  autism_prediction_date?: string;
  
  learning_goals?: string;
  accommodation_notes?: string;
  parent_contact?: string;
  enrollment_date: string;  user: number;
}

export interface PreAssessmentData {
  age: number;
  grade: string;
  reading_level: string;
  primary_language: string;
  has_reading_difficulty: boolean;
  needs_assistance: boolean;
  previous_assessment: boolean;
}

export interface PreAssessmentResponse {
  pre_assessment_completed: boolean;
  data: PreAssessmentData & {
    completed_date?: string;
  };
}

export interface TeacherProfile {
  id: number;
  employee_id: string;
  department?: string;
  specialization?: string;
  years_of_experience: number;
  qualifications?: string;
  hire_date: string;
  user: number;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  achievement_type: 'academic' | 'milestone' | 'participation' | 'improvement';
  points: number;
  badge_icon?: string;
  earned_date: string;
  student: number;
  awarded_by?: number;
}

// Learning interfaces
export interface Course {
  id: number;
  title: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  teacher: number;
  teacher_name?: string;
  lesson_count?: number;
  enrolled_students?: number;
}

export interface Lesson {
  id: number;
  title: string;
  content: string;
  order: number;
  is_dyslexia_friendly: boolean;
  estimated_duration: number;
  created_at: string;
  course: number;
  course_title?: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  status: 'draft' | 'published' | 'archived';
  is_dyslexia_accommodated: boolean;
  created_at: string;
  course: number;
  teacher: number;
  course_title?: string;
  teacher_name?: string;
  submission_count?: number;
}

export interface Submission {
  id: number;
  content: string;
  file_upload?: string;
  submitted_at: string;
  status: 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  graded_at?: string;
  assignment: number;
  student: number;
  graded_by?: number;
}

export interface Enrollment {
  id: number;
  enrolled_at: string;
  is_active: boolean;
  student: number;
  course: number;
  course_title?: string;
  student_name?: string;
}

export interface Progress {
  id: number;
  is_completed: boolean;
  completion_percentage: number;
  time_spent: number;
  completed_at?: string;
  created_at: string;
  student: number;
  lesson: number;
  lesson_title?: string;
  course_title?: string;
}

// Scheduler interfaces
export interface Task {
  id: number;
  title: string;
  description?: string;
  task_type: 'assignment' | 'study' | 'meeting' | 'reminder' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string;
  estimated_duration?: number;
  is_recurring: boolean;
  recurrence_pattern?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  user: number;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  event_type: 'class' | 'meeting' | 'study_group' | 'exam' | 'deadline' | 'personal';
  start_datetime: string;
  end_datetime: string;
  location?: string;
  is_all_day: boolean;
  is_recurring: boolean;
  recurrence_pattern?: string;
  reminder_minutes: number;
  created_at: string;
  updated_at: string;
  user: number;
}

export interface StudySession {
  id: number;
  title: string;
  session_type: 'individual' | 'group' | 'tutoring';
  subject: string;
  start_time: string;
  end_time: string;
  location?: string;
  notes?: string;
  is_completed: boolean;
  effectiveness_rating?: number;
  created_at: string;
  student: number;
}

export interface Reminder {
  id: number;
  title: string;
  message: string;
  reminder_type: 'task' | 'event' | 'medication' | 'break' | 'custom';
  remind_at: string;
  is_sent: boolean;
  is_recurring: boolean;
  recurrence_pattern?: string;
  created_at: string;
  user: number;
}

// Accessibility interfaces
export interface AccessibilitySettings {
  id: number;
  dyslexia_mode: 'none' | 'phonological' | 'surface' | 'visual';
  syllable_highlighting: boolean;
  word_emphasis: boolean;
  font_size: 'small' | 'medium' | 'large';
  font_family: 'default' | 'opendyslexic' | 'lexend';
  line_spacing: 'normal' | 'wide' | 'wider';
  letter_spacing: 'normal' | 'wide' | 'wider';
  theme: 'light' | 'dark' | 'high_contrast' | 'dyslexia_friendly';
  custom_background_color?: string;
  custom_text_color?: string;
  text_to_speech_enabled: boolean;
  speech_rate: number;
  speech_volume: number;
  keyboard_navigation: boolean;
  reduced_motion: boolean;
  focus_indicators: boolean;
  reading_guide: boolean;
  text_highlighting: boolean;
  auto_scroll: boolean;
  created_at: string;
  updated_at: string;
  user: number;
}

export interface DyslexiaProfile {
  id: number;
  phonological_awareness_score?: number;
  visual_processing_score?: number;
  working_memory_score?: number;
  processing_speed_score?: number;
  reading_difficulty_level?: number;
  spelling_difficulty: boolean;
  writing_difficulty: boolean;
  math_difficulty: boolean;
  attention_issues: boolean;
  strengths?: string;
  recommended_accommodations?: string;
  assessment_date?: string;
  last_review_date?: string;
  next_review_date?: string;
  created_at: string;
  updated_at: string;
  user: number;
}

export interface AccessibilityLog {
  id: number;
  action: 'setting_changed' | 'feature_used' | 'assistance_requested' | 'error_encountered';
  feature_name: string;
  old_value?: string;
  new_value?: string;
  context: Record<string, any>;
  timestamp: string;
  user: number;
}

export interface SupportRequest {
  id: number;
  title: string;
  description: string;
  category: 'accessibility' | 'dyslexia_support' | 'technical' | 'feature_request' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  user: number;
  assigned_to?: number;
  assigned_to_name?: string;
}

// Chatbot interfaces
export interface ChatSession {
  id: number;
  session_id: string;
  title?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: number;
}

export interface ChatMessage {
  id: number;
  message_type: 'user' | 'bot' | 'system';
  content: string;
  audio_url?: string;
  metadata: Record<string, any>;
  created_at: string;
  session: number;
}

export interface BotPersonality {
  id: number;
  name: string;
  personality_type: 'tutor' | 'companion' | 'counselor' | 'motivator';
  description: string;
  avatar_url?: string;
  system_prompt: string;
  is_active: boolean;
  created_at: string;
}

export interface UserPreference {
  id: number;
  communication_style: 'formal' | 'casual' | 'encouraging' | 'direct';
  enable_audio_response: boolean;
  enable_speech_recognition: boolean;
  response_speed: 'slow' | 'normal' | 'fast';
  language_preference: string;
  updated_at: string;
  user: number;
  preferred_personality?: number;
}

export interface ChatFeedback {
  id: number;
  feedback_type: 'helpful' | 'not_helpful' | 'inappropriate' | 'error';
  rating?: number;
  comment?: string;
  created_at: string;
  message: number;
  user: number;
}

// Quiz Generator interfaces
export interface QuizQuestion {
  id: number;
  question_id: string;  // UUID for tracking
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  condition: 'dyslexia' | 'autism';  // Track question type
  explanation?: string;
}

export interface QuizGenerationRequest {
  condition?: 'dyslexia' | 'autism' | 'mixed';  // Made optional since backend determines this
  num_easy?: number;  // Made optional - backend sets based on assessment_type
  num_moderate?: number;  // Made optional - backend sets based on assessment_type
  num_hard?: number;  // Made optional - backend sets based on assessment_type
  assessment_type: string;  // Required - user's choice from frontend
  
  // Pre-assessment data fields for customization
  age?: number;  // Student's age (3-100)
  grade?: string;  // Student's grade level
  reading_level?: string;  // Student's reading proficiency level
  primary_language?: string;  // Student's primary language (default: 'English')
  has_reading_difficulty?: boolean;  // Whether student has difficulty reading
  needs_assistance?: boolean;  // Whether student may need assistance during assessment
  previous_assessment?: boolean;  // Whether student has taken similar assessment before
}

export interface QuizGenerationResponse {
  session_id: string;  // Added session tracking
  questions: QuizQuestion[];
  total_questions: number;
  condition: string;
  assessment_type: string;
  dyslexia_questions?: number;  // Count of dyslexia questions
  autism_questions?: number;    // Count of autism questions
  difficulty_distribution: {
    easy: number;
    moderate: number;
    hard: number;
  };
  pre_assessment_data?: {
    age?: number;
    grade?: string;
    reading_level?: string;
    primary_language?: string;
    has_reading_difficulty?: boolean;
    needs_assistance?: boolean;
    previous_assessment?: boolean;
  };
  recommendations?: {
    use_visual_assessment: boolean;
    difficulty_customized: boolean;
    customization_reason: string;
  };
  generated_at: string;
  generated_by?: number;
  message: string;
}

export interface QuizInfo {
  available_conditions: string[];
  difficulty_levels: string[];
  max_questions_per_request: number;
  min_questions_per_request: number;
  supported_formats: string[];
  api_version: string;
  description: string;
}

export interface AssessmentAnswer {
  question_id: string;  // Changed from question_index to question_id
  selected_answer: string;
  is_correct: boolean;
  response_time: number;  // Time taken for this specific question in seconds
}

export interface QuestionTiming {
  question_id: string;
  start_time: number;
  end_time: number;
  response_time: number;
}

export interface AssessmentSubmission {
  session_id?: string;  // Added session tracking
  assessment_type?: string;  // Track user's assessment type choice
  answers: AssessmentAnswer[];
  total_questions: number;
  correct_answers: number;
  total_assessment_time: number;  // Total time for entire assessment in seconds
  question_timings: QuestionTiming[];  // Detailed timing for each question
}

export interface AssessmentResult {
  session_id: string;
  assessment_type: string;
  accuracy: number;
  total_questions: number;
  correct_answers: number;
  dyslexia_score?: number;  // Score for dyslexia questions only
  autism_score?: number;    // Score for autism questions only
  wrong_questions: Array<{
    question_id: string;
    condition_type: string;
    difficulty: string;
    user_answer: string;
    correct_answer: string;
  }>;
  wrong_questions_count: number;
  predicted_dyslexic_type: string;
  predicted_severity: string;
  message: string;
}

// Combined assessment interfaces
export interface CombinedAssessmentSubmission {
  dyslexia_session_id: string;
  autism_session_id: string;
  dyslexia_answers: AssessmentAnswer[];
  autism_answers: AssessmentAnswer[];
  total_assessment_time: number;
}

// Classroom interfaces
export interface Classroom {
  id: number;
  name: string;
  description?: string;
  join_code: string;
  created_at: string;
  updated_at: string;
  teacher: number;
  teacher_name?: string;
  student_count?: number;
}

export interface ClassroomMembership {
  id: number;
  joined_at: string;
  is_active: boolean;
  classroom: number;
  student: number;
  classroom_name?: string;
  student_name?: string;
}

export interface ClassroomStudent {
  id: number;
  student_id: string;
  student_name: string;
  email: string;
  joined_at: string;
  is_active: boolean;
  assessment_score?: number;
  dyslexia_type?: string;
  autism_score?: number;
}

export interface CreateClassroomData {
  name: string;
  description?: string;
}

export interface JoinClassroomData {
  join_code: string;
}

class ApiService {
  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();
    
    // Store tokens
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    
    return data;
  }

  async register(userData: RegisterData): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Registration failed');
    }

    const data = await response.json();
    
    // Store tokens
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    
    return data;
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout/`, {
          method: 'POST',
          headers: this.getHeaders(true),
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    // Clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    
    return data.access;
  }

  async getCurrentUser(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    return response.json();
  }

  // Generic method for authenticated requests
  async authenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(true),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Try to refresh token
      try {
        await this.refreshToken();
        // Retry the original request
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            ...this.getHeaders(true),
            ...options.headers,
          },
        });
        
        if (!retryResponse.ok) {
          throw new Error('Request failed after token refresh');
        }
        
        return retryResponse.json();
      } catch (error) {
        // Refresh failed, redirect to login
        this.logout();
        window.location.href = '/login';
        throw error;
      }
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Request failed');
    }

    return response.json();
  }

  // Profiles API methods
  async getUserProfile(): Promise<UserProfile> {
    return this.authenticatedRequest('/profiles/profile/');
  }

  async updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return this.authenticatedRequest('/profiles/profile/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getStudentProfile(): Promise<StudentProfile> {
    return this.authenticatedRequest('/profiles/student/');
  }

  async checkNeedsAssessment(): Promise<boolean> {
    try {
      const response = await this.checkAssessmentCompletion();
      return !response.completed;
    } catch (error) {
      // If there's an error, assume assessment is needed
      return true;
    }
  }

  async updateStudentProfile(data: Partial<StudentProfile>): Promise<StudentProfile> {
    return this.authenticatedRequest('/profiles/student/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getTeacherProfile(): Promise<TeacherProfile> {
    return this.authenticatedRequest('/profiles/teacher/');
  }

  async updateTeacherProfile(data: Partial<TeacherProfile>): Promise<TeacherProfile> {
    return this.authenticatedRequest('/profiles/teacher/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  //   async createTeacherProfile(data: Partial<TeacherProfile>): Promise<TeacherProfile> {
  //   return this.authenticatedRequest('/profiles/teacher/', {
  //     method: 'POST',
  //     body: JSON.stringify(data),
  //   });
  // }

  async checkTeacherProfileCompletion(): Promise<{ completed: boolean; profile?: TeacherProfile }> {
    return this.authenticatedRequest('/profiles/teacher/profile-completion/');
  }

  async getAchievements(): Promise<Achievement[]> {
    return this.authenticatedRequest('/profiles/achievements/');
  }

  async createAchievement(data: Partial<Achievement>): Promise<Achievement> {
    return this.authenticatedRequest('/profiles/achievements/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStudentDashboardStats(): Promise<any> {
    return this.authenticatedRequest('/profiles/dashboard/stats/');
  }

  // Learning API methods
  async getCourses(): Promise<Course[]> {
    return this.authenticatedRequest('/learning/courses/');
  }

  async createCourse(data: Partial<Course>): Promise<Course> {
    return this.authenticatedRequest('/learning/courses/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCourse(id: number): Promise<Course> {
    return this.authenticatedRequest(`/learning/courses/${id}/`);
  }

  async updateCourse(id: number, data: Partial<Course>): Promise<Course> {
    return this.authenticatedRequest(`/learning/courses/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(id: number): Promise<void> {
    return this.authenticatedRequest(`/learning/courses/${id}/`, {
      method: 'DELETE',
    });
  }

  async getCourseLessons(courseId: number): Promise<Lesson[]> {
    return this.authenticatedRequest(`/learning/courses/${courseId}/lessons/`);
  }

  async createLesson(courseId: number, data: Partial<Lesson>): Promise<Lesson> {
    return this.authenticatedRequest(`/learning/courses/${courseId}/lessons/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCourseAssignments(courseId: number): Promise<Assignment[]> {
    return this.authenticatedRequest(`/learning/courses/${courseId}/assignments/`);
  }

  async getAssignments(): Promise<Assignment[]> {
    return this.authenticatedRequest('/learning/assignments/');
  }

  async createAssignment(courseId: number, data: Partial<Assignment>): Promise<Assignment> {
    return this.authenticatedRequest(`/learning/courses/${courseId}/assignments/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAssignmentSubmissions(assignmentId: number): Promise<Submission[]> {
    return this.authenticatedRequest(`/learning/assignments/${assignmentId}/submissions/`);
  }

  async getSubmissions(): Promise<Submission[]> {
    return this.authenticatedRequest('/learning/submissions/');
  }

  async createSubmission(assignmentId: number, data: Partial<Submission>): Promise<Submission> {
    return this.authenticatedRequest(`/learning/assignments/${assignmentId}/submissions/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEnrollments(): Promise<Enrollment[]> {
    return this.authenticatedRequest('/learning/enrollments/');
  }

  async enrollInCourse(courseId: number): Promise<Enrollment> {
    return this.authenticatedRequest(`/learning/enroll/${courseId}/`, {
      method: 'POST',
    });
  }

  async unenrollFromCourse(enrollmentId: number): Promise<void> {
    return this.authenticatedRequest(`/learning/enrollments/${enrollmentId}/`, {
      method: 'DELETE',
    });
  }

  async getProgress(): Promise<Progress[]> {
    return this.authenticatedRequest('/learning/progress/');
  }

  async updateProgress(lessonId: number, data: { completion_percentage: number; time_spent: number }): Promise<Progress> {
    return this.authenticatedRequest(`/learning/progress/${lessonId}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Scheduler API methods
  async getTasks(): Promise<Task[]> {
    return this.authenticatedRequest('/scheduler/tasks/');
  }

  async createTask(data: Partial<Task>): Promise<Task> {
    return this.authenticatedRequest('/scheduler/tasks/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: number, data: Partial<Task>): Promise<Task> {
    return this.authenticatedRequest(`/scheduler/tasks/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: number): Promise<void> {
    return this.authenticatedRequest(`/scheduler/tasks/${id}/`, {
      method: 'DELETE',
    });
  }

  async getEvents(): Promise<Event[]> {
    return this.authenticatedRequest('/scheduler/events/');
  }

  async createEvent(data: Partial<Event>): Promise<Event> {
    return this.authenticatedRequest('/scheduler/events/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    return this.authenticatedRequest(`/scheduler/events/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: number): Promise<void> {
    return this.authenticatedRequest(`/scheduler/events/${id}/`, {
      method: 'DELETE',
    });
  }

  async getStudySessions(): Promise<StudySession[]> {
    return this.authenticatedRequest('/scheduler/study-sessions/');
  }

  async createStudySession(data: Partial<StudySession>): Promise<StudySession> {
    return this.authenticatedRequest('/scheduler/study-sessions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReminders(): Promise<Reminder[]> {
    return this.authenticatedRequest('/scheduler/reminders/');
  }

  async createReminder(data: Partial<Reminder>): Promise<Reminder> {
    return this.authenticatedRequest('/scheduler/reminders/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Accessibility API methods
  async getAccessibilitySettings(): Promise<AccessibilitySettings> {
    return this.authenticatedRequest('/accessibility/settings/');
  }

  async updateAccessibilitySettings(data: Partial<AccessibilitySettings>): Promise<AccessibilitySettings> {
    return this.authenticatedRequest('/accessibility/settings/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getDyslexiaProfile(): Promise<DyslexiaProfile> {
    return this.authenticatedRequest('/accessibility/dyslexia-profile/');
  }

  async updateDyslexiaProfile(data: Partial<DyslexiaProfile>): Promise<DyslexiaProfile> {
    return this.authenticatedRequest('/accessibility/dyslexia-profile/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAccessibilityLogs(): Promise<AccessibilityLog[]> {
    return this.authenticatedRequest('/accessibility/logs/');
  }

  async logAccessibilityAction(data: { action: string; feature_name: string; context?: Record<string, any> }): Promise<any> {
    return this.authenticatedRequest('/accessibility/log-action/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSupportRequests(): Promise<SupportRequest[]> {
    return this.authenticatedRequest('/accessibility/support-requests/');
  }

  async createSupportRequest(data: Partial<SupportRequest>): Promise<SupportRequest> {
    return this.authenticatedRequest('/accessibility/support-requests/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSupportRequest(id: number, data: Partial<SupportRequest>): Promise<SupportRequest> {
    return this.authenticatedRequest(`/accessibility/support-requests/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAccessibilityRecommendations(): Promise<any> {
    return this.authenticatedRequest('/accessibility/recommendations/');
  }

  async getAccessibilityAnalytics(): Promise<any> {
    return this.authenticatedRequest('/accessibility/analytics/');
  }

  // Chatbot API methods
  async getChatSessions(): Promise<ChatSession[]> {
    return this.authenticatedRequest('/chatbot/sessions/');
  }

  async createChatSession(data: Partial<ChatSession>): Promise<ChatSession> {
    return this.authenticatedRequest('/chatbot/sessions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getChatSession(sessionId: string): Promise<ChatSession> {
    return this.authenticatedRequest(`/chatbot/sessions/${sessionId}/`);
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.authenticatedRequest(`/chatbot/sessions/${sessionId}/messages/`);
  }

  async sendMessage(sessionId: string, data: { content: string }): Promise<ChatMessage> {
    return this.authenticatedRequest(`/chatbot/sessions/${sessionId}/send/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async endChatSession(sessionId: string): Promise<any> {
    return this.authenticatedRequest(`/chatbot/sessions/${sessionId}/end/`, {
      method: 'POST',
    });
  }

  async getBotPersonalities(): Promise<BotPersonality[]> {
    return this.authenticatedRequest('/chatbot/personalities/');
  }

  async getChatPreferences(): Promise<UserPreference> {
    return this.authenticatedRequest('/chatbot/preferences/');
  }

  async updateChatPreferences(data: Partial<UserPreference>): Promise<UserPreference> {
    return this.authenticatedRequest('/chatbot/preferences/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createChatFeedback(data: Partial<ChatFeedback>): Promise<ChatFeedback> {
    return this.authenticatedRequest('/chatbot/feedback/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Quiz Generator API methods
  async generateQuiz(data: QuizGenerationRequest): Promise<QuizGenerationResponse> {
    return this.authenticatedRequest('/quiz/generate/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQuizInfo(): Promise<QuizInfo> {
    return this.authenticatedRequest('/quiz/info/');
  }
  async submitAssessment(data: AssessmentSubmission): Promise<AssessmentResult> {
    return this.authenticatedRequest('/quiz/submit/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitCombinedAssessment(data: CombinedAssessmentSubmission): Promise<AssessmentResult> {
    return this.authenticatedRequest('/quiz/submit-combined/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  // Check if student has completed assessment
  async checkAssessmentCompletion(): Promise<{ completed: boolean; assessment_score?: number }> {
    return this.authenticatedRequest('/profiles/student/assessment-status/');
  }

  // Pre-assessment API methods
  async savePreAssessmentData(data: PreAssessmentData): Promise<{ message: string }> {
    return this.authenticatedRequest('/profiles/pre-assessment/save/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }  async getPreAssessmentData(): Promise<PreAssessmentResponse | null> {
    try {
      return await this.authenticatedRequest('/profiles/pre-assessment/get/');
    } catch (error) {
      // Return null if no pre-assessment data found
      return null;
    }
  }

  // Classroom API methods
  
  // Teacher classroom methods
  async getClassrooms(): Promise<Classroom[]> {
    return this.authenticatedRequest('/classroom/teacher-classrooms/');
  }

  async createClassroom(data: CreateClassroomData): Promise<Classroom> {
    return this.authenticatedRequest('/classroom/create/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClassroom(classroomId: number, data: Partial<CreateClassroomData>): Promise<Classroom> {
    return this.authenticatedRequest(`/classroom/${classroomId}/update/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClassroom(classroomId: number): Promise<{ message: string }> {
    return this.authenticatedRequest(`/classroom/${classroomId}/delete/`, {
      method: 'DELETE',
    });
  }

  async getClassroomStudents(classroomId: number): Promise<ClassroomStudent[]> {
    return this.authenticatedRequest(`/classroom/${classroomId}/students/`);
  }

  async removeStudentFromClassroom(classroomId: number, studentId: number): Promise<{ message: string }> {
    return this.authenticatedRequest(`/classroom/${classroomId}/remove-student/${studentId}/`, {
      method: 'DELETE',
    });
  }

  // Student classroom methods
  async getStudentClassrooms(): Promise<ClassroomMembership[]> {
    return this.authenticatedRequest('/classroom/student-classrooms/');
  }

  async joinClassroom(data: JoinClassroomData): Promise<{ 
    message: string; 
    classroom: Classroom; 
    membership: ClassroomMembership; 
  }> {
    return this.authenticatedRequest('/classroom/join/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  async leaveClassroom(classroomId: number): Promise<{ message: string }> {
    return this.authenticatedRequest(`/classroom/${classroomId}/leave/`, {
      method: 'POST',
    });
  }

  async getClassroomDetails(classroomId: number): Promise<Classroom> {
    return this.authenticatedRequest(`/classroom/${classroomId}/`);
  }

  async getClassroomMembers(classroomId: number): Promise<ClassroomStudent[]> {
    return this.authenticatedRequest(`/classroom/${classroomId}/members/`);
  }
}

export const apiService = new ApiService();
