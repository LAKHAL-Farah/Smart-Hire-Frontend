import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SessionAnswerDto } from '../interview.models';

@Injectable({ providedIn: 'root' })
export class AnswerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${this.resolveBaseUrl()}/answers`;

  submitTextAnswer(sessionId: number, questionId: number, answerText: string): Observable<SessionAnswerDto> {
    return this.http.post<SessionAnswerDto>(`${this.base}/submit`, {
      sessionId,
      questionId,
      answerText,
      videoUrl: null,
      audioUrl: null
    });
  }

  submitAudioAnswer(sessionId: number, questionId: number, audioBlob: Blob): Observable<SessionAnswerDto> {
    const formData = new FormData();
    formData.append('sessionId', String(sessionId));
    formData.append('questionId', String(questionId));
    formData.append('audio', audioBlob, 'answer.webm');

    return this.http.post<SessionAnswerDto>(`${this.base}/submit-audio`, formData);
  }

  private resolveBaseUrl(): string {
    const configured = (globalThis.localStorage?.getItem('smarthire.interviewApiBaseUrl') ?? '').trim();
    if (configured) {
      return configured.replace(/\/+$/, '');
    }

    if (globalThis.location?.protocol && globalThis.location?.hostname) {
      return `${globalThis.location.protocol}//${globalThis.location.hostname}:8081/interview-service/api/v1`;
    }

    return '/interview-service/api/v1';
  }
}
