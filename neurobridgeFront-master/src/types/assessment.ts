// Manual Assessment Types
export interface ManualQuestion {
  id: string;
  title: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'text_response' | 'sequencing' | 'matching' | 'audio_response';
  category: {
    id: string;
    name: string;
    clinical_significance: string;
  };
  difficulty_level: {
    name: 'beginner' | 'intermediate' | 'advanced';
    description: string;
  };
  age_ranges: Array<{
    id: string;
    min_age: number;
    max_age: number;
    description: string;
  }>;
  options?: Array<{
    id: string;
    option_text: string;
    is_correct: boolean;
    option_image?: string;
    option_audio?: string;
    explanation?: string;
  }>;
  image?: string;
  audio_file?: string;
  instructions?: string;
  audio_instructions?: string;
  points: number;
  time_limit?: number;
  additional_data?: any;
}

export interface ManualAssessmentResponse {
  question_id: string;
  response_data: any; // Flexible response based on question type
  response_time: number;
  start_time: number;
  end_time: number;
}

export interface ManualAssessmentSession {
  session_id: string;
  questions: ManualQuestion[];
  student_age: number;
  total_questions: number;
}

export interface ManualAssessmentSubmission {
  session_id: string;
  responses: ManualAssessmentResponse[];
  total_time: number;
  student_age: number;
  completion_status: 'completed' | 'partial';
}

// Question Component Props
export interface QuestionComponentProps {
  question: ManualQuestion;
  response: any;
  onResponseChange: (response: any) => void;
  disabled?: boolean;
}

// New Assessment System Types
export interface TaskCategory {
  id: string;
  name: string;
  description: string;
  clinical_significance: string;
  weight: number;
  is_active: boolean;
}

export interface AgeRange {
  id: string;
  name: string;
  min_age: number;
  max_age: number;
  description: string;
}

export interface DifficultyLevel {
  id: string;
  name: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  order: number;
}

export interface QuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  order: number;
  explanation?: string;
  option_image?: string;
  option_audio?: string;
}

export interface Question {
  id: string;
  title: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'text_response' | 'sequencing' | 'matching' | 'audio_response';
  category: TaskCategory;
  age_ranges: AgeRange[];
  difficulty_level: DifficultyLevel;
  grade_levels: string;
  image?: string;
  audio_file?: string;
  instructions: string;
  audio_instructions?: string;
  points: number;
  time_limit?: number;
  is_active: boolean;
  is_published: boolean;
  additional_data: {
    audio_prompt?: string;
    expected_response?: string;
    assessment_type?: string;
    visual_stimulus?: string;
    visual_stimulus_type?: string;
    delay_duration?: number;
    task_items?: string[];
    processing_task?: string;
  };
  options: QuestionOption[];
}

export interface AssessmentSession {
  id: string;
  student: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  completed_at?: string;
  total_time_seconds?: number;
  total_score: number;
  max_possible_score: number;
  accuracy_percentage?: number;
  risk_indicators: Record<string, 'high_risk' | 'moderate_risk' | 'low_risk'>;
  pre_assessment_data: Record<string, any>;
}

export interface StudentResponse {
  id: string;
  session: string;
  question: string;
  selected_option?: string;
  text_response?: string;
  response_data: Record<string, any>;
  time_taken_seconds?: number;
  is_correct: boolean;
  score_earned: number;
  auto_scored: boolean;
  needs_review: boolean;
  answered_at: string;
}

export interface QuestionProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onComplete: (questionId: string, response: any, timeTaken: number) => void;
}

export interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

export interface AssessmentError {
  type: 'network' | 'permission' | 'audio' | 'speech' | 'validation';
  message: string;
  details?: any;
}
