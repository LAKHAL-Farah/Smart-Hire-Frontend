export type LiveSubMode = 'PRACTICE_LIVE' | 'TEST_LIVE';

export interface LiveSessionStartRequest {
  userId: number;
  careerPathId: number;
  liveSubMode: LiveSubMode;
  questionCount: number;
  companyName?: string;
  targetRole?: string;
}

export interface LiveSession {
  id: number;
  liveSubMode: LiveSubMode;
  questionCountRequested: number;
  status: string;
  currentQuestionIndex: number;
  liveMode: boolean;
}

export interface LiveSessionReadyPayload {
  sessionId: number;
  greetingAudioUrl: string;
  firstQuestionId: number;
  firstQuestionText: string;
  totalQuestions: number;
  liveSubMode: LiveSubMode;
}

export interface LiveAISpeechPayload {
  audioUrl: string;
  text: string;
  isFollowUp: boolean;
  isRetry: boolean;
  isClosing: boolean;
  nextQuestionId: number | null;
  nextQuestionText: string | null;
  currentQuestionIndex: number;
  totalQuestions: number;
}

export interface LiveFeedbackPayload {
  answerId: number;
  audioUrl: string;
  feedbackText: string;
  score: number;
  aiFeedback: string;
  currentQuestionIndex: number;
  totalQuestions: number;
}

export interface FillerAudioPayload {
  audioUrl: string;
}
