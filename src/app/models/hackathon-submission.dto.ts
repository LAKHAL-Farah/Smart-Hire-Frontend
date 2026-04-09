export interface HackathonSubmissionDTO {
  idLong?: number;
  userId: number;
  projectTitle: string;
  projectDescription?: string;
  repoUrl?: string;
  demoUrl?: string;
  status: 'SUBMITTED' | 'PENDING' | 'EVALUATED' | 'REJECTED';
  originalityScore?: number | null;
  feasibilityScore?: number | null;
  technicalScore?: number | null;
  overallScore?: number | null;
  aiFeedback?: string | null;
  ranking?: number | null;
  submittedAt?: string;
  evaluatedAt?: string | null;
  eventId?: number;
  id: number;
}