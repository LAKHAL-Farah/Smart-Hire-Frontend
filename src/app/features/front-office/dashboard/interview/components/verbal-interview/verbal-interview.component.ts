import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MicButtonComponent } from '../mic-button/mic-button.component';
import { AnswerService } from '../../services/answer.service';
import { InterviewQuestionDto } from '../../interview.models';

@Component({
  selector: 'app-verbal-interview',
  standalone: true,
  imports: [CommonModule, MicButtonComponent],
  templateUrl: './verbal-interview.component.html',
  styleUrl: './verbal-interview.component.scss'
})
export class VerbalInterviewComponent {
  private readonly answerService = inject(AnswerService);

  @Input() question: InterviewQuestionDto | null = null;
  @Input() sessionId = 0;
  @Input() mode = 'PRACTICE';

  @Output() answerSubmitted = new EventEmitter<any>();

  readonly answerText = signal('');
  readonly submissionMode = signal<'text' | 'audio'>('text');
  readonly transcribingMessage = signal('');
  readonly isSubmitting = signal(false);
  readonly isAnswerFocused = signal(false);
  readonly hintOpen = signal(false);

  readonly audioTranscriptDebug = signal<string | null>(null);
  readonly audioEvaluationDebug = signal<any | null>(null);

  readonly characterCount = () => this.answerText().length;
  readonly hints = () => this.parseJsonArray(this.question?.hints);

  get isPractice(): boolean {
    return this.mode === 'PRACTICE';
  }

  toggleInputMode(mode?: 'text' | 'audio'): void {
    if (mode) {
      this.submissionMode.set(mode);
      return;
    }

    this.submissionMode.update((value) => (value === 'text' ? 'audio' : 'text'));
  }

  toggleHint(): void {
    this.hintOpen.update((open) => !open);
  }

  async submitTextAnswer(): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }

    const currentQuestion = this.question;
    if (!currentQuestion) {
      return;
    }

    const typed = this.answerText().trim();
    if (!typed) {
      return;
    }

    this.isSubmitting.set(true);
    this.transcribingMessage.set('');

    try {
      const response = await firstValueFrom(
        this.answerService.submitTextAnswer(this.sessionId, currentQuestion.id, typed)
      );

      this.answerSubmitted.emit(response);
      this.answerText.set('');
      this.hintOpen.set(false);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async onAudioReady(audioBlob: Blob): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }

    const currentQuestion = this.question;
    if (!currentQuestion) {
      return;
    }

    this.isSubmitting.set(true);
    this.transcribingMessage.set('Transcribing your answer...');
    this.audioTranscriptDebug.set(null);
    this.audioEvaluationDebug.set(null);

    try {
      const response = await firstValueFrom(
        this.answerService.submitAudioAnswer(this.sessionId, currentQuestion.id, audioBlob)
      );

      this.audioTranscriptDebug.set(response.answerText ?? '[No transcript returned]');
      this.answerSubmitted.emit(response);
      this.hintOpen.set(false);
    } finally {
      this.transcribingMessage.set('');
      this.isSubmitting.set(false);
    }
  }

  private parseJsonArray(raw: string | null | undefined): string[] {
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry));
      }
      return [String(parsed)];
    } catch {
      return [raw];
    }
  }
}
