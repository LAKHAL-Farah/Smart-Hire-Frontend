import { inject, Injectable } from '@angular/core';
import { InterviewApiService } from '../../features/front-office/dashboard/interview/interview-api.service';

@Injectable({ providedIn: 'root' })
export class TtsService {
  private readonly interviewApi = inject(InterviewApiService);

  private currentAudio: HTMLAudioElement | null = null;

  private cleanupAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
  }

  playFromUrl(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cleanupAudio();

      const absoluteAudioUrl = this.interviewApi.resolveBackendAssetUrl(audioUrl);
      this.currentAudio = new Audio(absoluteAudioUrl);
      this.currentAudio.volume = 1.0;
      this.currentAudio.preload = 'auto';
      this.currentAudio.load();

      this.currentAudio.onended = () => {
        this.cleanupAudio();
        resolve();
      };

      this.currentAudio.onerror = () => {
        this.cleanupAudio();
        reject(new Error('Audio playback failed'));
      };

      this.currentAudio.play().catch((err) => {
        this.cleanupAudio();
        reject(err);
      });
    });
  }

  stop(): void {
    this.cleanupAudio();
  }

  get isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}
