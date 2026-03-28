import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InterviewApiService } from '../../features/front-office/dashboard/interview/interview-api.service';

@Injectable({ providedIn: 'root' })
export class TtsService {
  private readonly http = inject(HttpClient);
  private readonly interviewApi = inject(InterviewApiService);

  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioDeleteUrl: string | null = null;

  playFromUrl(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stop();

      const absoluteAudioUrl = this.interviewApi.resolveBackendAssetUrl(audioUrl);
      this.currentAudioDeleteUrl = absoluteAudioUrl;
      this.currentAudio = new Audio(absoluteAudioUrl);
      this.currentAudio.volume = 1.0;

      this.currentAudio.onended = () => {
        const deleteUrl = this.currentAudioDeleteUrl;
        if (deleteUrl) {
          this.http.delete(deleteUrl).subscribe({
            error: () => {
              // Cleanup failure should not block UX.
            },
          });
        }
        this.currentAudioDeleteUrl = null;
        resolve();
      };

      this.currentAudio.onerror = () => {
        this.currentAudioDeleteUrl = null;
        reject(new Error('Audio playback failed'));
      };

      this.currentAudio.play().catch((err) => {
        this.currentAudioDeleteUrl = null;
        reject(err);
      });
    });
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
      this.currentAudioDeleteUrl = null;
    }
  }

  get isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}
