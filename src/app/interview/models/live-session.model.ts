export type LiveSubMode = 'PRACTICE_LIVE' | 'TEST_LIVE';

export interface LiveSessionStartRequest {
  userId: number;
  careerPathId: number;
  liveSubMode: LiveSubMode;
  questionCount: number;
  companyName?: string;
  targetRole?: string;
}

export interface LiveSessionStartResponse {
  sessionId: number;
  greetingAudioUrl: string;
  firstQuestionText: string;
  firstQuestionId: number;
  totalQuestions: number;
  liveSubMode: string;
  status: string;
}

export interface LiveSessionReadyPayload {
  sessionId: number;
  greetingAudioUrl: string;
  firstQuestionId: number;
  firstQuestionText: string;
  totalQuestions: number;
  currentQuestionIndex?: number;
  liveSubMode: LiveSubMode;
}

export interface LiveStagePayload {
  stage?:
    | 'LISTENING'
    | 'TALKING'
    | 'TRANSCRIBING'
    | 'EVALUATING'
    | 'GENERATING_QUESTION'
    | 'SYNTHESIZING_SPEECH'
    | 'GENERATING_RESPONSE'
    | string;
  message?: string | null;
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
