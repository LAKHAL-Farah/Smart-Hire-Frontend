import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InterviewApiService } from '../../features/front-office/dashboard/interview/interview-api.service';

@Injectable({ providedIn: 'root' })
export class TtsService {
  private readonly http = inject(HttpClient);
  private readonly interviewApi = inject(InterviewApiService);

  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioDeleteUrl: string | null = null;

  private cleanupAudio(deleteAsset: boolean): void {
    const deleteUrl = this.currentAudioDeleteUrl;

    if (deleteAsset && deleteUrl) {
      this.http.delete(deleteUrl).subscribe({
        error: () => {
          // Cleanup failure should not block UX.
        },
      });
    }

    if (this.currentAudio) {
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }

    this.currentAudioDeleteUrl = null;
  }

  playFromUrl(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cleanupAudio(false);

      const absoluteAudioUrl = this.interviewApi.resolveBackendAssetUrl(audioUrl);
      this.currentAudioDeleteUrl = absoluteAudioUrl;
      this.currentAudio = new Audio(absoluteAudioUrl);
      this.currentAudio.volume = 1.0;
      this.currentAudio.preload = 'auto';
      this.currentAudio.load();

      this.currentAudio.onended = () => {
        this.cleanupAudio(true);
        resolve();
      };

      this.currentAudio.onerror = () => {
        this.cleanupAudio(true);
        reject(new Error('Audio playback failed'));
      };

      this.currentAudio.play().catch((err) => {
        this.cleanupAudio(true);
        reject(err);
      });
    });
  }

  stop(): void {
    this.cleanupAudio(true);
  }

  get isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}
