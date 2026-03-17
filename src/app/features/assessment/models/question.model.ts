/**
 * Assessment Question Model
 */
export interface AssessmentQuestion {
  id?: number;
  assessmentId: number;
  questionText: string;
  category: string;
  difficulty: number;
}

/**
 * Assessment Question UI Model - Extended for quiz display
 */
export interface AssessmentQuestionUI extends AssessmentQuestion {
  options: QuestionOption[];
  difficultyLabel?: string;
}

/**
 * Question Option Model
 */
export interface QuestionOption {
  letter: string;
  text: string;
}

/**
 * Assessment Answer Model
 */
export interface AssessmentAnswer {
  id?: number;
  assessmentQuestionId: number;
  userId: number;
  answerText: string;
  score: number;
}

/**
 * Assessment Answer Request - User answer submission
 */
export interface AnswerSubmission {
  assessmentQuestionId: number;
  selectedOption: string;
}
