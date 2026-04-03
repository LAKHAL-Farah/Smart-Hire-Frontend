import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveSubMode } from '../models/live-session.model';
import { LiveControlsComponent } from './components/live-controls/live-controls.component';
import { LiveTopBarComponent } from './components/live-top-bar/live-top-bar.component';
import { ParticipantTileComponent } from './components/participant-tile/participant-tile.component';
import { QuestionCaptionComponent } from './components/question-caption/question-caption.component';

@Component({
  selector: 'app-live-mode',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ParticipantTileComponent,
    LiveTopBarComponent,
    LiveControlsComponent,
    QuestionCaptionComponent,
  ],
  templateUrl: './live-mode.component.html',
  styleUrl: './live-mode.component.scss',
})
export class LiveModeComponent implements OnInit, OnDestroy {
  sessionId = 0;
  liveSubMode: LiveSubMode = 'TEST_LIVE';
  companyName = 'Tech Company';
  currentQuestionText: string | null = null;
  currentQuestionIndex = 0;
  totalQuestions = 0;

  // IDLE | AI_SPEAKING | CANDIDATE_SPEAKING | PROCESSING
  currentTurn = 'IDLE';

  aiSpeaking = false;
  candidateSpeaking = false;
  micEnabled = true;
  cameraEnabled = true;
  micLevel = 0;
  sessionTimerSeconds = 0;

  videoStream: MediaStream | null = null;

  isDebugMode = false;
  debugBgTask = 'nothing';
  debugLastTranscript = '—';
  debugAudioState = 'idle';
  debugGreetingUrl = '—';
  needsTapToPlay = false;

  private sessionTimerInterval: ReturnType<typeof setInterval> | null = null;
  private greetingAudio: HTMLAudioElement | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('sessionId') ?? 0);

    const subMode = (this.route.snapshot.queryParamMap.get('subMode') ?? '').trim().toUpperCase();
    if (subMode === 'PRACTICE_LIVE' || subMode === 'TEST_LIVE') {
      this.liveSubMode = subMode;
    }

    this.companyName = this.route.snapshot.queryParamMap.get('company') || 'Tech Company';
    this.totalQuestions = Number(this.route.snapshot.queryParamMap.get('total') || 0);
    this.currentQuestionText = this.route.snapshot.queryParamMap.get('firstQ') || null;
    const debugParam = (this.route.snapshot.queryParamMap.get('debug') ?? '').trim().toLowerCase();
    this.isDebugMode = debugParam !== '0' && debugParam !== 'false' && debugParam !== 'no';
    this.debugLastTranscript = this.currentQuestionText || '—';

    this.startSessionTimer();
    this.initCamera();
    this.initGreetingPlayback();
  }

  ngOnDestroy(): void {
    if (this.sessionTimerInterval) {
      clearInterval(this.sessionTimerInterval);
      this.sessionTimerInterval = null;
    }

    this.videoStream?.getTracks().forEach((track) => track.stop());
    this.videoStream = null;

    if (this.greetingAudio) {
      this.greetingAudio.pause();
      this.greetingAudio.src = '';
      this.greetingAudio = null;
    }
  }

  onMicToggle(enabled: boolean): void {
    this.micEnabled = enabled;
    this.currentTurn = enabled ? 'IDLE' : 'PROCESSING';
  }

  onCameraToggle(enabled: boolean): void {
    this.cameraEnabled = enabled;
    this.videoStream?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  onLeave(): void {
    if (!confirm('Leave the interview? Your progress will be saved.')) {
      return;
    }

    void this.router.navigate(['/dashboard']);
  }

  onTapToPlayGreeting(): void {
    if (!this.greetingAudio) {
      return;
    }

    this.greetingAudio.play().then(() => {
      this.needsTapToPlay = false;
      this.debugBgTask = 'playing_greeting';
      this.debugAudioState = 'playing';
      this.currentTurn = 'AI_SPEAKING';
      this.aiSpeaking = true;
    }).catch((error: unknown) => {
      this.debugBgTask = 'audio_blocked';
      this.debugAudioState = 'blocked';
      this.debugLastTranscript = `Tap to play failed: ${String((error as { message?: string })?.message ?? error)}`;
    });
  }

  private startSessionTimer(): void {
    this.sessionTimerInterval = setInterval(() => {
      this.sessionTimerSeconds += 1;
    }, 1000);
  }

  private initCamera(): void {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        this.videoStream = stream;
      })
      .catch((error: unknown) => {
        console.warn('[LiveMode] Camera unavailable:', error);
        this.videoStream = null;
      });
  }

  private initGreetingPlayback(): void {
    const preparedResolved = this.route.snapshot.queryParamMap.get('preparedResolvedGreetingUrl') || '';
    const preparedRelative = this.route.snapshot.queryParamMap.get('preparedGreetingUrl') || '';
    const fallbackGreeting = this.route.snapshot.queryParamMap.get('greetingAudioUrl') || '';

    const audioUrl =
      preparedResolved ||
      this.resolveBackendAssetUrl(preparedRelative || fallbackGreeting);

    if (!audioUrl) {
      return;
    }

    this.aiSpeaking = true;
    this.currentTurn = 'AI_SPEAKING';
    this.debugBgTask = 'starting_greeting';
    this.debugAudioState = 'starting';
    this.debugGreetingUrl = audioUrl;

    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    audio.volume = 1;

    audio.addEventListener(
      'ended',
      () => {
        this.aiSpeaking = false;
        this.currentTurn = 'IDLE';
        this.debugBgTask = 'nothing';
        this.debugAudioState = 'ended';
        this.needsTapToPlay = false;
      },
      { once: true }
    );

    audio.addEventListener(
      'error',
      () => {
        this.aiSpeaking = false;
        this.currentTurn = 'PROCESSING';
        this.debugBgTask = 'audio_error';
        this.debugAudioState = 'error';
      },
      { once: true }
    );

    this.greetingAudio = audio;

    audio.play().then(() => {
      this.debugBgTask = 'playing_greeting';
      this.debugAudioState = 'playing';
    }).catch(() => {
      this.needsTapToPlay = true;
      this.debugBgTask = 'awaiting_tap';
      this.debugAudioState = 'blocked';
      this.currentTurn = 'PROCESSING';
      this.aiSpeaking = false;
    });
  }

  private resolveBackendAssetUrl(value: string): string {
    if (!value) {
      return '';
    }

    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    if (value.startsWith('/interview-service/') && globalThis.location?.protocol && globalThis.location?.hostname) {
      return `${globalThis.location.protocol}//${globalThis.location.hostname}:8081${value}`;
    }

    const configured = (globalThis.localStorage?.getItem('smarthire.interviewApiBaseUrl') ?? '').trim();
    if (configured && /^https?:\/\//i.test(configured)) {
      try {
        return new URL(value, configured).toString();
      } catch {
        // Fall through to origin fallback.
      }
    }

    if (globalThis.location?.origin) {
      return new URL(value, globalThis.location.origin).toString();
    }

    return value;
  }
}
