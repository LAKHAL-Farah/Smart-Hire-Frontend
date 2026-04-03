import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { ActivatedRoute, Router } from '@angular/router';
import SockJS from 'sockjs-client';
import { LiveSubMode } from '../models/live-session.model';
import { LiveControlsComponent } from './components/live-controls/live-controls.component';
import { LiveTopBarComponent } from './components/live-top-bar/live-top-bar.component';
import { ParticipantTileComponent } from './components/participant-tile/participant-tile.component';
import { QuestionCaptionComponent } from './components/question-caption/question-caption.component';

interface SessionEventEnvelope {
  type?: string;
  eventType?: string;
  sessionId?: number;
  payload?: unknown;
  message?: string;
  timestamp?: number;
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
  debugWsState: 'connecting' | 'connected' | 'disconnected' = 'disconnected';
  debugLastEvent = '—';
  needsTapToPlay = false;

  private sessionTimerInterval: ReturnType<typeof setInterval> | null = null;
  private greetingAudio: HTMLAudioElement | null = null;
  private stompClient: Client | null = null;
  private sessionSubscription: StompSubscription | null = null;

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
    this.connectSessionSocket();
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

    this.disconnectSessionSocket();
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

    this.playGreetingAudio(audioUrl);
  }

  private connectSessionSocket(): void {
    if (!this.sessionId) {
      this.debugWsState = 'disconnected';
      return;
    }

    this.debugWsState = 'connecting';
    this.debugBgTask = 'ws_connecting';

    const client = new Client({
      webSocketFactory: () => new SockJS(this.resolveSockJsUrl()),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      this.debugWsState = 'connected';
      this.debugBgTask = 'ws_connected';
      this.subscribeToSessionTopic(client);
    };

    client.onStompError = (frame) => {
      this.debugWsState = 'disconnected';
      this.debugBgTask = 'ws_error';
      this.debugLastTranscript = frame.headers['message'] || 'WebSocket STOMP error';
    };

    client.onWebSocketClose = () => {
      this.debugWsState = 'disconnected';
      this.debugBgTask = 'ws_reconnecting';
      this.sessionSubscription = null;
    };

    client.onWebSocketError = () => {
      this.debugWsState = 'disconnected';
      this.debugBgTask = 'ws_reconnecting';
    };

    this.stompClient = client;
    this.stompClient.activate();
  }

  private disconnectSessionSocket(): void {
    if (this.sessionSubscription) {
      this.sessionSubscription.unsubscribe();
      this.sessionSubscription = null;
    }

    if (this.stompClient?.active) {
      void this.stompClient.deactivate();
    }

    this.stompClient = null;
    this.debugWsState = 'disconnected';
  }

  private subscribeToSessionTopic(client: Client): void {
    const topic = `/topic/session/${this.sessionId}`;

    if (this.sessionSubscription) {
      this.sessionSubscription.unsubscribe();
      this.sessionSubscription = null;
    }

    this.sessionSubscription = client.subscribe(topic, (message: IMessage) => {
      this.handleSessionEvent(message);
    });
  }

  private handleSessionEvent(message: IMessage): void {
    let envelope: SessionEventEnvelope;

    try {
      envelope = JSON.parse(message.body) as SessionEventEnvelope;
    } catch {
      this.debugLastEvent = 'MALFORMED_EVENT';
      this.debugBgTask = 'ws_parse_error';
      return;
    }

    const eventType = String(envelope.type || envelope.eventType || '').trim().toUpperCase();
    const payload = this.asRecord(envelope.payload);

    this.debugLastEvent = eventType || 'UNKNOWN';

    switch (eventType) {
      case 'LIVE_SESSION_READY': {
        this.handleLiveSessionReady(payload);
        break;
      }
      case 'LIVE_AI_SPEECH': {
        this.handleLiveAiSpeech(payload);
        break;
      }
      case 'FILLER_AUDIO': {
        this.handleFillerAudio(payload);
        break;
      }
      case 'REPORT_READY': {
        void this.router.navigate(['/dashboard/interview/report', this.sessionId]);
        break;
      }
      case 'ERROR': {
        this.debugBgTask = 'server_error';
        this.debugAudioState = 'error';
        this.debugLastTranscript = envelope.message || 'Server error received';
        break;
      }
      default: {
        this.debugBgTask = 'ws_event_received';
      }
    }
  }

  private handleLiveSessionReady(payload: Record<string, unknown>): void {
    const firstQuestionText = this.readString(payload, 'firstQuestionText');
    const greetingAudioUrl = this.readString(payload, 'greetingAudioUrl');
    const companyName = this.readString(payload, 'companyName');
    const totalQuestions = this.readNumber(payload, 'totalQuestions');
    const currentQuestionIndex = this.readNumber(payload, 'currentQuestionIndex');
    const liveSubMode = (this.readString(payload, 'liveSubMode') || '').toUpperCase();

    if (firstQuestionText) {
      this.currentQuestionText = firstQuestionText;
      this.debugLastTranscript = firstQuestionText;
    }

    if (companyName) {
      this.companyName = companyName;
    }

    if (typeof totalQuestions === 'number') {
      this.totalQuestions = Math.max(0, totalQuestions);
    }

    if (typeof currentQuestionIndex === 'number') {
      this.currentQuestionIndex = Math.max(0, currentQuestionIndex);
    }

    if (liveSubMode === 'PRACTICE_LIVE' || liveSubMode === 'TEST_LIVE') {
      this.liveSubMode = liveSubMode;
    }

    const resolvedUrl = this.resolveBackendAssetUrl(greetingAudioUrl || '');
    if (resolvedUrl) {
      this.playGreetingAudio(resolvedUrl);
    }
  }

  private handleLiveAiSpeech(payload: Record<string, unknown>): void {
    const nextQuestionText = this.readString(payload, 'nextQuestionText');
    const aiText = this.readString(payload, 'text');
    const audioUrl = this.resolveBackendAssetUrl(this.readString(payload, 'audioUrl') || '');
    const totalQuestions = this.readNumber(payload, 'totalQuestions');
    const currentQuestionIndex = this.readNumber(payload, 'currentQuestionIndex');
    const isClosing = Boolean(payload['isClosing']);

    if (typeof totalQuestions === 'number') {
      this.totalQuestions = Math.max(0, totalQuestions);
    }

    if (typeof currentQuestionIndex === 'number') {
      // LIVE_AI_SPEECH currently uses a display index (1-based) from backend.
      this.currentQuestionIndex = Math.max(0, currentQuestionIndex - 1);
    }

    if (nextQuestionText) {
      this.currentQuestionText = nextQuestionText;
      this.debugLastTranscript = nextQuestionText;
    } else if (aiText) {
      this.debugLastTranscript = aiText;
    }

    if (!audioUrl) {
      if (isClosing) {
        void this.router.navigate(['/dashboard/interview/report', this.sessionId]);
      }
      return;
    }

    this.aiSpeaking = true;
    this.currentTurn = 'AI_SPEAKING';
    this.debugBgTask = 'starting_ai_speech';
    this.debugAudioState = 'starting';
    this.debugGreetingUrl = audioUrl;

    if (this.greetingAudio) {
      this.greetingAudio.pause();
      this.greetingAudio.src = '';
      this.greetingAudio = null;
    }

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

        if (isClosing) {
          void this.router.navigate(['/dashboard/interview/report', this.sessionId]);
        }
      },
      { once: true }
    );

    audio.addEventListener(
      'error',
      () => {
        this.aiSpeaking = false;
        this.currentTurn = 'PROCESSING';
        this.debugBgTask = 'ai_audio_error';
        this.debugAudioState = 'error';
      },
      { once: true }
    );

    this.greetingAudio = audio;

    audio
      .play()
      .then(() => {
        this.debugBgTask = 'playing_ai_speech';
        this.debugAudioState = 'playing';
      })
      .catch(() => {
        this.needsTapToPlay = true;
        this.debugBgTask = 'awaiting_tap';
        this.debugAudioState = 'blocked';
        this.currentTurn = 'PROCESSING';
        this.aiSpeaking = false;
      });
  }

  private handleFillerAudio(payload: Record<string, unknown>): void {
    const audioUrl = this.resolveBackendAssetUrl(this.readString(payload, 'audioUrl') || '');
    if (!audioUrl) {
      return;
    }

    this.currentTurn = 'PROCESSING';
    this.debugBgTask = 'playing_filler';
    this.debugAudioState = 'playing';
    this.debugGreetingUrl = audioUrl;

    const filler = new Audio(audioUrl);
    filler.preload = 'auto';
    filler.volume = 0.9;

    filler.addEventListener(
      'ended',
      () => {
        if (!this.aiSpeaking) {
          this.currentTurn = 'IDLE';
        }
        this.debugBgTask = 'nothing';
        this.debugAudioState = 'ended';
      },
      { once: true }
    );

    filler.addEventListener(
      'error',
      () => {
        this.debugBgTask = 'filler_audio_error';
        this.debugAudioState = 'error';
      },
      { once: true }
    );

    void filler.play().catch(() => {
      this.debugBgTask = 'filler_blocked';
      this.debugAudioState = 'blocked';
    });
  }

  private playGreetingAudio(audioUrl: string): void {
    this.aiSpeaking = true;
    this.currentTurn = 'AI_SPEAKING';
    this.debugBgTask = 'starting_greeting';
    this.debugAudioState = 'starting';
    this.debugGreetingUrl = audioUrl;

    if (this.greetingAudio) {
      this.greetingAudio.pause();
      this.greetingAudio.src = '';
      this.greetingAudio = null;
    }

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

  private resolveSockJsUrl(): string {
    const configured = (globalThis.localStorage?.getItem('smarthire.interviewWsUrl') ?? '').trim();
    if (configured) {
      return configured;
    }

    if (globalThis.location?.port === '4200') {
      return '/ws-interview';
    }

    if (globalThis.location?.origin) {
      return `${globalThis.location.origin}/interview-service/ws-interview`;
    }

    return '/ws-interview';
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }

    return {};
  }

  private readString(payload: Record<string, unknown>, key: string): string | null {
    const value = payload[key];
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  private readNumber(payload: Record<string, unknown>, key: string): number | null {
    const value = payload[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
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
