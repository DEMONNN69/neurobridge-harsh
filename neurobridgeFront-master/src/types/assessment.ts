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
