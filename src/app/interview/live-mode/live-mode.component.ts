import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { Client, IMessage, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';
import { LiveSessionService } from '../services/live-session.service';
import {
  FillerAudioPayload,
  LiveAISpeechPayload,
  LiveFeedbackPayload,
  LiveSessionReadyPayload,
  LiveStagePayload,
  LiveSubMode,
} from '../models/live-session.model';
import { FeedbackOverlayComponent } from './components/feedback-overlay/feedback-overlay.component';
import { LiveControlsComponent } from './components/live-controls/live-controls.component';
import { LiveTopBarComponent } from './components/live-top-bar/live-top-bar.component';
import { ParticipantTileComponent } from './components/participant-tile/participant-tile.component';
import { QuestionCaptionComponent } from './components/question-caption/question-caption.component';

interface LiveEventEnvelope {
  type?: string;
  eventType?: string;
  payload: any;
}

interface DebugRow {
  at: string;
  message: string;
}

@Component({
  selector: 'app-live-mode',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ParticipantTileComponent,
    LiveTopBarComponent,
    LiveControlsComponent,
    FeedbackOverlayComponent,
    QuestionCaptionComponent,
  ],
  templateUrl: './live-mode.component.html',
  styleUrl: './live-mode.component.scss',
})
export class LiveModeComponent implements OnInit, OnDestroy {
  sessionId!: number;

  liveSubMode: LiveSubMode = 'TEST_LIVE';
  currentQuestionIndex = 0;
  totalQuestions = 0;
  currentQuestionText: string | null = null;
  sessionTimerSeconds = 0;
  companyName = 'Tech Company';
  candidateName = 'Candidate';
  targetRole = 'Candidate';

  meetingStatus: 'LISTENING' | 'GENERATING' | 'TALKING' = 'GENERATING';
  meetingStatusLabel = 'Generating a response';
  meetingStatusHint: string | null = null;

  videoStream: MediaStream | null = null;
  private captureStream: MediaStream | null = null;
  aiSpeaking = false;
  candidateSpeaking = false;
  micEnabled = true;
  cameraEnabled = true;
  micLevel = 0;

  showFeedbackOverlay = false;
  feedbackPayload: LiveFeedbackPayload | null = null;
  isSessionEnded = false;

  private stompClient: Client | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private sessionTimerInterval: ReturnType<typeof setInterval> | null = null;
  private bootstrapRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private bootstrapFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private mainAudio: HTMLAudioElement | null = null;
  private fillerAudio: HTMLAudioElement | null = null;
  private isListening = false;
  private hasReceivedSessionReady = false;
  private readonly destroy$ = new Subject<void>();

  debugEnabled = true;
  wsStatus: 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR' = 'IDLE';
  lastGreetingUrl = '';
  lastResolvedGreetingUrl = '';
  lastAudioError = '';
  debugRows: DebugRow[] = [];
  private preloadedGreetingUrl = '';
  private preloadedResolvedGreetingUrl = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly liveService: LiveSessionService
  ) {}

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('sessionId'));
    this.liveSubMode = (this.route.snapshot.queryParamMap.get('subMode') as LiveSubMode) || 'TEST_LIVE';
    this.companyName = this.route.snapshot.queryParamMap.get('company') || 'Tech Company';
    this.candidateName = this.route.snapshot.queryParamMap.get('candidateName') || 'Candidate';
    this.targetRole = this.route.snapshot.queryParamMap.get('targetRole') || 'Candidate';
    this.debugEnabled = this.route.snapshot.queryParamMap.get('debug') !== '0';
    this.preloadedGreetingUrl = this.route.snapshot.queryParamMap.get('preparedGreetingUrl') || '';
    this.preloadedResolvedGreetingUrl = this.route.snapshot.queryParamMap.get('preparedResolvedGreetingUrl') || '';

    if (this.preloadedGreetingUrl) {
      this.lastGreetingUrl = this.preloadedGreetingUrl;
      this.lastResolvedGreetingUrl = this.preloadedResolvedGreetingUrl || this.resolveBackendAssetUrl(this.preloadedGreetingUrl);
      this.addDebug('Preloaded greeting received', {
        greetingAudioUrl: this.lastGreetingUrl,
        resolvedGreetingAudioUrl: this.lastResolvedGreetingUrl,
      });
    }

    this.addDebug('Init', {
      sessionId: this.sessionId,
      subMode: this.liveSubMode,
      companyName: this.companyName,
      candidateName: this.candidateName,
    });

    this.registerCypressHook();
    try {
      this.connectWebSocket();
    } catch {
      // WebSocket initialization should never block entering live view.
    }

    try {
      this.initMediaDevices();
    } catch {
      // Media initialization is best effort.
    }

    this.startSessionTimer();
  }

  ngOnDestroy(): void {
        const g = globalThis as any;
        if (g.__emitLiveEvent && g.__emitLiveEventOwner === this.sessionId) {
          delete g.__emitLiveEvent;
          delete g.__endLiveMainAudio;
          delete g.__livePublishedFrames;
          delete g.__emitLiveEventOwner;
        }

    this.destroy$.next();
    this.destroy$.complete();

    this.cleanupMedia();

    if (this.stompClient?.active) {
      this.stompClient.deactivate();
    }

    if (this.sessionTimerInterval) {
      clearInterval(this.sessionTimerInterval);
      this.sessionTimerInterval = null;
    }

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mainAudio) {
      this.mainAudio.pause();
      this.mainAudio.src = '';
      this.mainAudio = null;
    }

    if (this.fillerAudio) {
      this.fillerAudio.pause();
      this.fillerAudio.src = '';
      this.fillerAudio = null;
    }

    if (this.bootstrapRetryTimer) {
      clearTimeout(this.bootstrapRetryTimer);
      this.bootstrapRetryTimer = null;
    }

    if (this.bootstrapFallbackTimer) {
      clearTimeout(this.bootstrapFallbackTimer);
      this.bootstrapFallbackTimer = null;
    }
  }

  private connectWebSocket(): void {
    if ((globalThis as any).Cypress) {
      return;
    }

    this.wsStatus = 'CONNECTING';
    this.addDebug('WS connecting', { url: this.resolveSockJsUrl() });

    const socket = this.createSocketClient(this.resolveSockJsUrl());
    this.stompClient = Stomp.over(socket);
    this.stompClient.debug = () => {};
    this.stompClient.reconnectDelay = 5000;
    this.stompClient.onConnect = () => {
      this.wsStatus = 'CONNECTED';
      this.addDebug('WS connected');

      this.stompClient?.subscribe(`/topic/session/${this.sessionId}`, (msg: IMessage) => {
        try {
          const event = JSON.parse(msg.body) as LiveEventEnvelope;
          this.addDebug('WS event', { type: event.eventType ?? event.type });
          this.handleWebSocketEvent(event);
        } catch {
          // Ignore malformed live events.
          this.addDebug('WS malformed event');
        }
      });

      if (this.hasReceivedSessionReady) {
        return;
      }

      this.publishBootstrapRequest();
      if (this.bootstrapRetryTimer) {
        clearTimeout(this.bootstrapRetryTimer);
      }
      this.bootstrapRetryTimer = setTimeout(() => {
        if (!this.hasReceivedSessionReady) {
          this.addDebug('Bootstrap retry');
          this.publishBootstrapRequest();
        }
      }, 3500);

      if (this.bootstrapFallbackTimer) {
        clearTimeout(this.bootstrapFallbackTimer);
      }
      this.bootstrapFallbackTimer = setTimeout(() => {
        if (!this.hasReceivedSessionReady) {
          this.addDebug('Bootstrap REST fallback request');
          this.requestBootstrapFallback();
        }
      }, 6000);
    };

    this.stompClient.onStompError = (frame) => {
      this.wsStatus = 'ERROR';
      this.addDebug('WS stomp error', frame?.headers ?? {});
    };

    this.stompClient.onWebSocketClose = () => {
      this.wsStatus = 'DISCONNECTED';
      this.addDebug('WS closed');
    };

    this.stompClient.onWebSocketError = () => {
      this.wsStatus = 'ERROR';
      this.addDebug('WS transport error');
    };

    this.stompClient.activate();
  }

  protected createSocketClient(url: string): WebSocket {
    return new SockJS(url) as unknown as WebSocket;
  }

  private publishBootstrapRequest(): void {
    const body = JSON.stringify({ candidateName: this.candidateName });
    this.addDebug('Publish bootstrap', { destination: `/app/session/${this.sessionId}/bootstrap` });
    this.stompClient?.publish({ destination: `/app/session/${this.sessionId}/bootstrap`, body });
  }

  private handleWebSocketEvent(event: LiveEventEnvelope): void {
    const type = event.eventType ?? event.type;

    switch (type) {
      case 'LIVE_SESSION_READY': {
        const p = event.payload as LiveSessionReadyPayload;
        const eventGreetingUrl = (p.greetingAudioUrl ?? '').trim();
        const resolvedGreetingUrl = eventGreetingUrl || this.preloadedGreetingUrl;
        this.lastGreetingUrl = resolvedGreetingUrl;
        this.addDebug('LIVE_SESSION_READY', {
          greetingAudioUrl: p.greetingAudioUrl,
          effectiveGreetingAudioUrl: resolvedGreetingUrl,
          firstQuestionId: p.firstQuestionId,
          firstQuestionText: p.firstQuestionText,
          currentQuestionIndex: p.currentQuestionIndex,
          totalQuestions: p.totalQuestions,
        });

        if (!eventGreetingUrl && this.preloadedGreetingUrl) {
          this.addDebug('LIVE_SESSION_READY missing greeting URL, using preloaded URL');
        }
        const readyIndex = p.currentQuestionIndex ?? 0;
        if (
          this.hasReceivedSessionReady &&
          this.currentQuestionText === p.firstQuestionText &&
          this.currentQuestionIndex === readyIndex
        ) {
          break;
        }

        this.hasReceivedSessionReady = true;
        if (this.bootstrapRetryTimer) {
          clearTimeout(this.bootstrapRetryTimer);
          this.bootstrapRetryTimer = null;
        }
        if (this.bootstrapFallbackTimer) {
          clearTimeout(this.bootstrapFallbackTimer);
          this.bootstrapFallbackTimer = null;
        }
        this.stopListening();
        this.totalQuestions = p.totalQuestions;
        this.currentQuestionText = p.firstQuestionText;
        this.currentQuestionIndex = readyIndex;
        this.aiSpeaking = true;
        this.setMeetingStatus('TALKING');
        this.playMainAudio(resolvedGreetingUrl, () => {
          this.aiSpeaking = false;
          this.startListening();
        });
        break;
      }

      case 'FILLER_AUDIO': {
        const p = event.payload as FillerAudioPayload;
        this.stopListening();
        this.setMeetingStatus('GENERATING', 'Thinking...');
        this.playFiller(p.audioUrl);
        break;
      }

      case 'LIVE_STAGE': {
        const p = (event.payload ?? {}) as LiveStagePayload;
        this.applyLiveStage(p);
        break;
      }

      case 'LIVE_AI_SPEECH': {
        const p = event.payload as LiveAISpeechPayload;
        this.aiSpeaking = true;
        this.stopListening();
        this.setMeetingStatus('TALKING');
        if (p.nextQuestionText) {
          this.currentQuestionText = p.nextQuestionText;
        }

        if (p.currentQuestionIndex !== undefined && p.currentQuestionIndex !== null) {
          this.currentQuestionIndex = p.currentQuestionIndex;
        }

        this.playMainAudio(p.audioUrl, () => {
          this.aiSpeaking = false;
          if (p.isClosing) {
            this.isSessionEnded = true;
            this.router.navigate(['/dashboard/interview/report', this.sessionId]);
            return;
          }

          this.startListening();
        });
        break;
      }

      case 'LIVE_FEEDBACK': {
        if (this.liveSubMode !== 'PRACTICE_LIVE') {
          break;
        }

        const p = event.payload as LiveFeedbackPayload;
        this.aiSpeaking = true;
        this.stopListening();
        this.setMeetingStatus('TALKING');
        this.playMainAudio(p.audioUrl, () => {
          this.aiSpeaking = false;
          this.feedbackPayload = p;
          this.showFeedbackOverlay = true;
          this.setMeetingStatus('GENERATING');
        });
        break;
      }

      case 'REPORT_READY': {
        this.setMeetingStatus('GENERATING', 'Finalizing report...');
        this.router.navigate(['/dashboard/interview/report', this.sessionId]);
        break;
      }

      default:
        break;
    }
  }

  private playMainAudio(url: string, onEnded?: () => void): void {
    const resolvedUrl = this.resolveBackendAssetUrl(url);
    this.lastGreetingUrl = url || this.lastGreetingUrl;
    this.lastResolvedGreetingUrl = resolvedUrl || '';

    if (!resolvedUrl) {
      this.lastAudioError = 'No audio URL received';
      this.addDebug('Main audio skipped: empty URL');
      onEnded?.();
      return;
    }

    if (this.fillerAudio) {
      this.fillerAudio.pause();
      this.fillerAudio.src = '';
      this.fillerAudio = null;
    }

    if (this.mainAudio) {
      this.mainAudio.pause();
      this.mainAudio.src = '';
    }

    this.mainAudio = new Audio(resolvedUrl);
    this.mainAudio.volume = 1;
    this.mainAudio.addEventListener('loadedmetadata', () => {
      this.addDebug('Main audio metadata loaded', { duration: this.mainAudio?.duration });
    });
    this.mainAudio.addEventListener('canplay', () => {
      this.addDebug('Main audio canplay');
    });
    this.mainAudio.addEventListener('error', () => {
      const mediaError = this.mainAudio?.error;
      this.lastAudioError = mediaError ? `MediaError code=${mediaError.code}` : 'Unknown media error';
      this.addDebug('Main audio error', {
        src: resolvedUrl,
        errorCode: mediaError?.code,
        networkState: this.mainAudio?.networkState,
        readyState: this.mainAudio?.readyState,
      });
    });
    this.mainAudio.play().then(() => {
      this.addDebug('Main audio play started', { src: resolvedUrl });
    }).catch((err: unknown) => {
      this.aiSpeaking = false;
      this.lastAudioError = String((err as any)?.message ?? err ?? 'Audio play failed');
      this.addDebug('Main audio play rejected', { src: resolvedUrl, error: this.lastAudioError });
      onEnded?.();
    });

    if (onEnded) {
      this.mainAudio.addEventListener(
        'ended',
        () => {
          this.addDebug('Main audio ended');
          onEnded();
        },
        { once: true }
      );
    }
  }

  private playFiller(url: string): void {
    const resolvedUrl = this.resolveBackendAssetUrl(url);
    if (!resolvedUrl) {
      return;
    }

    if (this.fillerAudio) {
      this.fillerAudio.pause();
      this.fillerAudio.src = '';
    }

    this.fillerAudio = new Audio(resolvedUrl);
    this.fillerAudio.volume = 0.8;
    this.fillerAudio.play().catch(() => {
      // Filler audio is best effort.
    });
    this.fillerAudio.addEventListener(
      'ended',
      () => {
        if (!this.aiSpeaking && !this.isSessionEnded && !this.showFeedbackOverlay && this.micEnabled) {
          this.startListening();
        }
      },
      { once: true }
    );
  }

  private startListening(): void {
    if (!this.micEnabled || !this.captureStream || this.isListening) {
      return;
    }

    const audioTracks = this.captureStream.getAudioTracks();
    if (!audioTracks.length) {
      return;
    }

    const audioStream = new MediaStream(audioTracks);
    try {
      this.mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus',
      });
    } catch {
      return;
    }

    this.mediaRecorder.addEventListener('dataavailable', (e: BlobEvent) => {
      if (e.data.size > 0 && this.stompClient?.connected) {
        e.data.arrayBuffer().then((buffer) => {
          this.stompClient?.publish({
            destination: `/app/session/${this.sessionId}/audio-chunk`,
            binaryBody: new Uint8Array(buffer),
            headers: { 'content-type': 'application/octet-stream' },
          });
        });
      }
    });

    this.mediaRecorder.start(250);
    this.isListening = true;
    this.setMeetingStatus('LISTENING', 'Speak naturally, I am listening.');
  }

  private stopListening(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;
    this.isListening = false;
    if (!this.aiSpeaking && !this.isSessionEnded) {
      this.setMeetingStatus('GENERATING', 'Processing your answer...');
    }
  }

  private initMediaDevices(): void {
    if (!navigator?.mediaDevices?.getUserMedia) {
      this.captureStream = null;
      this.videoStream = null;
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        this.captureStream = stream;
        this.videoStream = stream;
        this.setupAmplitudeTracker(stream);
      })
      .catch(() => {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            this.captureStream = stream;
            this.videoStream = null;
            this.setupAmplitudeTracker(stream);
          })
          .catch(() => {
            this.captureStream = null;
            this.videoStream = null;
          });
      });
  }

  private setupAmplitudeTracker(stream: MediaStream): void {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const track = () => {
      if (!this.analyser) {
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      this.micLevel = avg / 255;
      this.candidateSpeaking = avg > 15 && this.micEnabled;
      this.animFrameId = requestAnimationFrame(track);
    };

    track();
  }

  onMicToggle(enabled: boolean): void {
    this.micEnabled = enabled;
    this.captureStream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });

    if (!enabled) {
      this.stopListening();
      this.stompClient?.publish({ destination: `/app/session/${this.sessionId}/end-turn`, body: '' });
      return;
    }

    if (!this.aiSpeaking && !this.showFeedbackOverlay && !this.isSessionEnded) {
      this.startListening();
    }
  }

  onCameraToggle(enabled: boolean): void {
    this.cameraEnabled = enabled;
    this.captureStream?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  onLeave(): void {
    if (!confirm('Leave the interview? Your progress will be saved.')) {
      return;
    }

    this.liveService.abandonSession(this.sessionId).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.router.navigate(['/dashboard']);
      },
    });
  }

  onRetry(): void {
    this.showFeedbackOverlay = false;
    this.feedbackPayload = null;
    this.setMeetingStatus('GENERATING', 'Preparing retry...');
    this.stompClient?.publish({ destination: `/app/session/${this.sessionId}/retry`, body: '' });
  }

  onContinue(): void {
    this.showFeedbackOverlay = false;
    this.feedbackPayload = null;
    this.setMeetingStatus('GENERATING', 'Preparing next question...');
    this.stompClient?.publish({ destination: `/app/session/${this.sessionId}/continue`, body: '' });
  }

  private startSessionTimer(): void {
    this.sessionTimerInterval = setInterval(() => {
      this.sessionTimerSeconds += 1;
    }, 1000);
  }

  private registerCypressHook(): void {
    const g = globalThis as any;
    if (!g.Cypress) {
      return;
    }

    const publishedFrames: Array<{ destination: string; body?: string }> = [];
    this.stompClient = {
      publish: (frame: { destination: string; body?: string }) => {
        publishedFrames.push(frame);
      },
    } as any;

    g.__emitLiveEvent = (event: LiveEventEnvelope) => this.handleWebSocketEvent(event);
    g.__endLiveMainAudio = () => this.mainAudio?.dispatchEvent(new Event('ended'));
    g.__livePublishedFrames = publishedFrames;
    g.__emitLiveEventOwner = this.sessionId;
  }

  private cleanupMedia(): void {
    this.stopListening();
    this.captureStream?.getTracks().forEach((track) => track.stop());
    this.captureStream = null;
    this.videoStream = null;
    this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
  }

  private setMeetingStatus(status: 'LISTENING' | 'GENERATING' | 'TALKING', hint?: string | null): void {
    this.meetingStatus = status;
    this.meetingStatusLabel =
      status === 'LISTENING'
        ? 'Listening'
        : status === 'TALKING'
          ? 'Talking'
          : 'Generating a response';
    this.meetingStatusHint = hint ?? null;
  }

  private applyLiveStage(payload: LiveStagePayload): void {
    const stage = payload?.stage;
    const message = payload?.message ?? null;

    switch (stage) {
      case 'LISTENING':
        this.setMeetingStatus('LISTENING', message ?? 'Speak naturally, I am listening.');
        break;
      case 'TALKING':
        this.setMeetingStatus('TALKING', message ?? null);
        break;
      case 'TRANSCRIBING':
        this.setMeetingStatus('GENERATING', message ?? 'Transcribing your answer...');
        break;
      case 'EVALUATING':
        this.setMeetingStatus('GENERATING', message ?? 'Evaluating with AI...');
        break;
      case 'GENERATING_QUESTION':
        this.setMeetingStatus('GENERATING', message ?? 'Generating next question...');
        break;
      case 'SYNTHESIZING_SPEECH':
        this.setMeetingStatus('GENERATING', message ?? 'Preparing speech...');
        break;
      case 'GENERATING_RESPONSE':
      default:
        this.setMeetingStatus('GENERATING', message ?? 'Generating a response...');
        break;
    }
  }

  private resolveSockJsUrl(): string {
    const configured = (globalThis.localStorage?.getItem('smarthire.interviewWsUrl') ?? '').trim();
    if (configured) {
      return configured;
    }

    if (globalThis.location?.protocol && globalThis.location?.hostname) {
      return `${globalThis.location.protocol}//${globalThis.location.hostname}:8081/interview-service/ws`;
    }

    return '/interview-service/ws';
  }

  private resolveBackendAssetUrl(value: string): string {
    if (!value) {
      return '';
    }

    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    const configured = (globalThis.localStorage?.getItem('smarthire.interviewApiBaseUrl') ?? '').trim();
    if (configured && /^https?:\/\//i.test(configured)) {
      try {
        return new URL(value, configured).toString();
      } catch {
        return value;
      }
    }

    if (globalThis.location?.protocol && globalThis.location?.hostname) {
      const origin = `${globalThis.location.protocol}//${globalThis.location.hostname}:8081`;
      return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
    }

    return value;
  }

  private requestBootstrapFallback(): void {
    this.liveService
      .getLiveBootstrap(this.sessionId, {
        companyName: this.companyName,
        targetRole: this.targetRole,
        candidateName: this.candidateName,
      })
      .subscribe({
        next: (payload) => {
          this.addDebug('Bootstrap fallback received', {
            greetingAudioUrl: payload.greetingAudioUrl,
            firstQuestionId: payload.firstQuestionId,
            totalQuestions: payload.totalQuestions,
          });
          this.handleWebSocketEvent({ eventType: 'LIVE_SESSION_READY', payload });
        },
        error: (error) => {
          this.addDebug('Bootstrap fallback failed', {
            status: error?.status,
            message: error?.message,
          });
        },
      });
  }

  private addDebug(message: string, details?: unknown): void {
    if (!this.debugEnabled) {
      return;
    }

    const suffix = details === undefined ? '' : ` ${this.stringifyDebug(details)}`;
    this.debugRows.unshift({
      at: new Date().toLocaleTimeString(),
      message: `${message}${suffix}`,
    });

    if (this.debugRows.length > 60) {
      this.debugRows.length = 60;
    }
  }

  private stringifyDebug(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}
