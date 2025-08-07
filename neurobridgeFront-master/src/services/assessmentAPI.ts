import { apiService } from './api';
import { 
  SubmitResponseRequest,
  SubmitResponseResponse,
  CompleteAssessmentRequest,
  CompleteAssessmentResponse
} from './api';
import {
  AssessmentSession,
  Question,
  TaskCategory
} from '../types/assessment';

class AssessmentAPI {
  // Create a new assessment session
  async createSession(userId: string): Promise<AssessmentSession> {
    // Create a mock session without making API calls to avoid unwanted backend requests
    // Only make API calls when actually submitting the final assessment
    const mockSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return Promise.resolve({
      id: mockSessionId,
      student: userId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      total_score: 0,
      max_possible_score: 100,
      risk_indicators: {},
      pre_assessment_data: {}
    });
  }

  // Get questions for a specific category
  async getQuestionsByCategory(categoryName: string): Promise<Question[]> {
    // Return empty array to avoid any backend calls during assessment
    // Questions will be handled by the category components themselves
    return Promise.resolve([]);
  }

  // Submit a response to a question
  async submitResponse(
    sessionId: string, 
    questionId: string, 
    response: any, 
    timeTaken: number
  ): Promise<SubmitResponseResponse> {
    const requestData: SubmitResponseRequest = {
      session_id: sessionId,
      question_id: questionId,
      selected_option_id: typeof response === 'string' ? response : undefined,
      text_response: typeof response === 'string' ? undefined : JSON.stringify(response),
      response_data: typeof response === 'object' ? response : {},
      time_taken_seconds: timeTaken
    };

    return await apiService.submitResponse(requestData);
  }

  // Submit all responses at once (for ML processing)
  async submitAllResponses(submissionData: {
    session_id: string;
    responses: Array<{
      question_id: string;
      category_name: string;
      selected_option_id?: string;
      text_response?: string;
      response_data: Record<string, any>;
      time_taken_seconds: number;
      question_index: number;
      category_index: number;
      timestamp: number;
    }>;
    total_time_seconds: number;
    completed_categories: string[];
    student_age: number;
  }): Promise<CompleteAssessmentResponse> {
    return await apiService.submitAllResponses(submissionData);
  }

  // Complete the assessment session (deprecated - use submitAllResponses instead)
  async completeSession(sessionId: string): Promise<CompleteAssessmentResponse> {
    const requestData: CompleteAssessmentRequest = {
      session_id: sessionId
    };

    return await apiService.completeAssessment(requestData);
  }

  // Get session details
  async getSession(sessionId: string): Promise<AssessmentSession> {
    return await apiService.getAssessmentSession(sessionId);
  }

  // Get assessment results
  async getResults(sessionId: string): Promise<CompleteAssessmentResponse> {
    return await apiService.getAssessmentResults(sessionId);
  }

  // Get student's assessment history
  async getAssessmentHistory(): Promise<AssessmentSession[]> {
    return await apiService.getStudentAssessmentHistory();
  }

  // Get available categories
  async getCategories(): Promise<TaskCategory[]> {
    // This would typically be a separate endpoint
    // For now, return the standard categories
    return [
      {
        id: '1',
        name: 'Phonological Awareness',
        description: 'Assessment of sound-based language skills',
        clinical_significance: 'Critical for reading development',
        weight: 1.0,
        is_active: true
      },
      {
        id: '2',
        name: 'Reading Comprehension',
        description: 'Assessment of reading understanding skills',
        clinical_significance: 'Essential for academic success',
        weight: 1.0,
        is_active: true
      },
      {
        id: '3',
        name: 'Sequencing',
        description: 'Assessment of sequential processing abilities',
        clinical_significance: 'Important for organizing information',
        weight: 1.0,
        is_active: true
      },
      {
        id: '4',
        name: 'Sound-Letter Mapping',
        description: 'Assessment of phoneme-grapheme correspondence',
        clinical_significance: 'Fundamental for reading and spelling',
        weight: 1.0,
        is_active: true
      },
      {
        id: '5',
        name: 'Visual Processing',
        description: 'Assessment of visual perception skills',
        clinical_significance: 'Important for reading and learning',
        weight: 1.0,
        is_active: true
      },
      {
        id: '6',
        name: 'Word Recognition',
        description: 'Assessment of word identification skills',
        clinical_significance: 'Core reading skill',
        weight: 1.0,
        is_active: true
      },
      {
        id: '7',
        name: 'Working Memory',
        description: 'Assessment of short-term memory and processing',
        clinical_significance: 'Critical for learning and comprehension',
        weight: 1.0,
        is_active: true
      }
    ];
  }
}

export const assessmentAPI = new AssessmentAPI();
