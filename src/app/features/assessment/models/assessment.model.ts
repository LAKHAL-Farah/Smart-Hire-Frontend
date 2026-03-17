/**
 * Assessment Model - Represents an assessment
 */
export interface Assessment {
  id?: number;
  userId: number;
  type: string;
  status?: string;
  createdAt?: string;
  completedAt?: string;
}

/**
 * Assessment Status Enum
 */
export enum AssessmentStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
}

/**
 * Assessment Type Enum
 */
export enum AssessmentType {
  INITIAL = 'INITIAL',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

/**
 * Assessment Response Model - API response
 */
export interface AssessmentResponse extends Assessment {}

/**
 * Assessment Request Model - API request payload
 */
export interface AssessmentRequest {
  userId: number;
  type: string;
}
