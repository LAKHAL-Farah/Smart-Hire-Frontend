import { } from '@angular/core';
import { SubmissionStatus } from './submission-status.enum';


export interface HackathonSubmission {
  idLong?: number;   // ou id?: number si tu changes côté backend

  userId: number;

  projectTitle: string;
  projectDescription: string;
  repoUrl: string;
  demoUrl: string;

  status: SubmissionStatus;

  originalityScore?: number;
  feasibilityScore?: number;
  technicalScore?: number;
  overallScore?: number;

  aiFeedback?: string;
  ranking?: number;

  submittedAt?: string;   // LocalDateTime → string
  evaluatedAt?: string;

  event?: any;
}