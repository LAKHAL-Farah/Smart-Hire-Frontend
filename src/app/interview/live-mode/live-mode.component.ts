import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { ActivatedRoute, Router } from '@angular/router';
import SockJS from 'sockjs-client';
import { LiveSubMode } from '../models/live-session.model';
import { LiveSessionService } from '../services/live-session.service';
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
export class LiveModeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mainAudioEl') mainAudioElRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('fillerAudioEl') fillerAudioElRef!: ElementRef<HTMLAudioElement>;

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
  showAutoplayPrompt = false;

  private blockedUrl: string | null = null;
  private blockedCallback: (() => void) | null = null;
  private preparedGreetingUrl: string | null = null;
  private sessionReadyReceived = false;
  private bootstrapRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private bootstrapAttempts = 0;
  private httpBootstrapAttempted = false;

  private sessionTimerInterval: ReturnType<typeof setInterval> | null = null;
  private stompClient: Client | null = null;
  private sessionSubscription: StompSubscription | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly liveSessionService: LiveSessionService
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
    this.httpBootstrapAttempted = false;

    const preparedResolved = this.route.snapshot.queryParamMap.get('preparedResolvedGreetingUrl') || '';
    const preparedRelative = this.route.snapshot.queryParamMap.get('preparedGreetingUrl') || '';
    const fallbackGreeting = this.route.snapshot.queryParamMap.get('greetingAudioUrl') || '';
    const resolvedPrepared = preparedResolved || this.resolveBackendAssetUrl(preparedRelative || fallbackGreeting);
    this.preparedGreetingUrl = resolvedPrepared || null;

    this.startSessionTimer();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.connectWebSocket();
      this.initCamera();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.sessionTimerInterval) {
      clearInterval(this.sessionTimerInterval);
      this.sessionTimerInterval = null;
    }

    this.videoStream?.getTracks().forEach((track) => track.stop());
    this.videoStream = null;

    if (this.mainAudioElRef?.nativeElement) {
      this.mainAudioElRef.nativeElement.pause();
      this.mainAudioElRef.nativeElement.src = '';
    }

    if (this.fillerAudioElRef?.nativeElement) {
      this.fillerAudioElRef.nativeElement.pause();
      this.fillerAudioElRef.nativeElement.src = '';
    }

    if (this.bootstrapRetryTimer) {
      clearTimeout(this.bootstrapRetryTimer);
      this.bootstrapRetryTimer = null;
    }

    this.disconnectWebSocket();
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

  onAutoplayResume(): void {
    this.showAutoplayPrompt = false;
    if (this.blockedUrl && this.blockedCallback) {
      const url = this.blockedUrl;
      const cb = this.blockedCallback;
      this.blockedUrl = null;
      this.blockedCallback = null;
      this.startPlayback(this.mainAudioElRef.nativeElement, url, cb);
    }
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

  private connectWebSocket(): void {
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
      this.bootstrapAttempts = 0;
      this.scheduleBootstrapRequest(client, 250);

      // Fallback if backend does not push LIVE_SESSION_READY quickly.
      setTimeout(() => {
        if (!this.sessionReadyReceived && this.preparedGreetingUrl) {
          console.warn('[LiveMode] LIVE_SESSION_READY not received yet. Using prepared greeting fallback.');
          this.playGreetingFlow(this.preparedGreetingUrl);
        }
      }, 2500);

      // If WS bootstrap path fails, force-fetch bootstrap over HTTP.
      setTimeout(() => {
        if (!this.sessionReadyReceived) {
          this.requestHttpBootstrap();
        }
      }, 1800);
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
      if (this.bootstrapRetryTimer) {
        clearTimeout(this.bootstrapRetryTimer);
        this.bootstrapRetryTimer = null;
      }
    };

    client.onWebSocketError = () => {
      this.debugWsState = 'disconnected';
      this.debugBgTask = 'ws_reconnecting';
    };

    this.stompClient = client;
    this.stompClient.activate();
  }

  private disconnectWebSocket(): void {
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
      this.handleWebSocketEvent(message);
    });
  }

  private handleWebSocketEvent(message: IMessage): void {
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
    console.log('[LiveMode] WS event:', eventType, payload);

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
        void this.router.navigate(['/interview/report', this.sessionId]);
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
    this.sessionReadyReceived = true;
    if (this.bootstrapRetryTimer) {
      clearTimeout(this.bootstrapRetryTimer);
      this.bootstrapRetryTimer = null;
    }

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
    if (!resolvedUrl) {
      this.aiSpeaking = false;
      this.currentTurn = 'CANDIDATE_SPEAKING';
      this.debugBgTask = 'no_greeting_audio';
      this.debugAudioState = 'missing';
      return;
    }

    this.playGreetingFlow(resolvedUrl);
  }

  private playGreetingFlow(audioUrl: string): void {
    if (this.aiSpeaking && this.debugGreetingUrl === audioUrl) {
      return;
    }

    this.currentTurn = 'AI_SPEAKING';
    this.aiSpeaking = true;
    this.debugBgTask = 'starting_greeting';
    this.debugAudioState = 'starting';
    this.debugGreetingUrl = audioUrl;

    this.playMainAudio(audioUrl, () => {
      this.currentTurn = 'CANDIDATE_SPEAKING';
      this.aiSpeaking = false;
      this.debugBgTask = 'nothing';
      this.debugAudioState = 'ended';
      console.log('[LiveMode] Greeting ended — ready for candidate');
    });
  }

  private requestBootstrap(client: Client): void {
    if (!this.sessionId || !client.connected) {
      return;
    }

    try {
      client.publish({
        destination: `/app/session/${this.sessionId}/bootstrap`,
        body: '',
      });
      this.debugBgTask = 'bootstrap_requested';
      console.log('[LiveMode] Bootstrap requested for session', this.sessionId);
    } catch (error) {
      console.warn('[LiveMode] Failed to request bootstrap:', error);
    }
  }

  private requestHttpBootstrap(): void {
    if (!this.sessionId || this.sessionReadyReceived || this.httpBootstrapAttempted) {
      return;
    }

    this.httpBootstrapAttempted = true;
    this.debugBgTask = 'http_bootstrap_requested';
    console.warn('[LiveMode] Falling back to HTTP live-bootstrap for session', this.sessionId);

    this.liveSessionService
      .getLiveBootstrap(this.sessionId, {
        companyName: this.companyName,
        targetRole: 'Candidate',
        candidateName: 'Candidate',
      })
      .subscribe({
        next: (payload) => {
          this.handleLiveSessionReady(payload as unknown as Record<string, unknown>);
        },
        error: (error: unknown) => {
          console.warn('[LiveMode] HTTP live-bootstrap failed:', error);
          this.debugBgTask = 'http_bootstrap_failed';
        },
      });
  }

  private scheduleBootstrapRequest(client: Client, delayMs: number): void {
    if (this.bootstrapRetryTimer) {
      clearTimeout(this.bootstrapRetryTimer);
      this.bootstrapRetryTimer = null;
    }

    this.bootstrapRetryTimer = setTimeout(() => {
      if (this.sessionReadyReceived || !client.connected) {
        return;
      }

      this.bootstrapAttempts += 1;
      this.requestBootstrap(client);

      // Retry a few times because SUBSCRIBE and initial PUBLISH can race.
      if (!this.sessionReadyReceived && this.bootstrapAttempts < 4) {
        this.debugBgTask = `bootstrap_retry_${this.bootstrapAttempts}`;
        this.scheduleBootstrapRequest(client, 1200);
      }
    }, delayMs);
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
      this.aiSpeaking = false;
      if (isClosing) {
        this.currentTurn = 'IDLE';
        void this.router.navigate(['/interview/report', this.sessionId]);
      } else {
        this.currentTurn = 'CANDIDATE_SPEAKING';
      }
      return;
    }

    this.aiSpeaking = true;
    this.currentTurn = 'AI_SPEAKING';
    this.debugBgTask = 'starting_ai_speech';
    this.debugAudioState = 'starting';
    this.debugGreetingUrl = audioUrl;

    this.playMainAudio(audioUrl, () => {
      this.aiSpeaking = false;
      this.debugBgTask = 'nothing';
      this.debugAudioState = 'ended';
      if (isClosing) {
        console.log('[LiveMode] Closing speech ended — navigating to report');
        this.currentTurn = 'IDLE';
        void this.router.navigate(['/interview/report', this.sessionId]);
      } else {
        this.currentTurn = 'CANDIDATE_SPEAKING';
        console.log('[LiveMode] Next question audio ended — ready for candidate');
      }
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

    this.playFiller(audioUrl);
  }

  private playMainAudio(url: string, onEnded: () => void): void {
    const audio = this.mainAudioElRef.nativeElement;

    console.log('[Audio] playMainAudio -> verifying URL:', url);

    fetch(url, { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) {
          console.error('[Audio] URL returned', res.status, ':', url);
          setTimeout(() => onEnded(), 300);
          return;
        }
        console.log('[Audio] URL OK -', res.headers.get('content-type'), url);
        this.startPlayback(audio, url, onEnded);
      })
      .catch((err: unknown) => {
        console.error('[Audio] URL unreachable:', url, err);
        setTimeout(() => onEnded(), 300);
      });
  }

  private startPlayback(audio: HTMLAudioElement, url: string, onEnded: () => void): void {
    audio.onended = null;
    audio.onerror = null;
    audio.src = url;
    audio.volume = 1.0;

    audio.onended = () => {
      console.log('[Audio] Playback ended:', url);
      this.aiSpeaking = false;
      setTimeout(() => onEnded(), 300);
    };

    audio.onerror = () => {
      console.error('[Audio] Playback error:', audio.error?.code, audio.error?.message, 'URL:', url);
      this.aiSpeaking = false;
      setTimeout(() => onEnded(), 300);
    };

    audio.load();
    audio
      .play()
      .then(() => {
        console.log('[Audio] play() started successfully');
        this.aiSpeaking = true;
        this.debugBgTask = 'playing_audio';
        this.debugAudioState = 'playing';
      })
      .catch((err: unknown) => {
        const audioErr = err as DOMException;
        console.error('[Audio] play() rejected:', audioErr.name, audioErr.message);
        if (audioErr.name === 'NotAllowedError') {
          this.handleAutoplayBlocked(url, onEnded);
        } else {
          this.aiSpeaking = false;
          setTimeout(() => onEnded(), 300);
        }
      });
  }

  private playFiller(url: string): void {
    const audio = this.fillerAudioElRef.nativeElement;
    audio.src = url;
    audio.volume = 0.8;
    audio.onended = null;
    audio.onerror = null;

    audio.load();
    audio
      .play()
      .then(() => console.log('[Filler] Playing:', url))
      .catch((err: unknown) => {
        const audioErr = err as DOMException;
        console.warn('[Filler] play() failed (non-critical):', audioErr.message);
      });
  }

  private handleAutoplayBlocked(url: string, onEnded: () => void): void {
    console.warn('[Audio] Autoplay blocked - showing tap prompt');
    this.blockedUrl = url;
    this.blockedCallback = onEnded;
    this.showAutoplayPrompt = true;
    this.aiSpeaking = false;
    this.debugBgTask = 'autoplay_blocked';
    this.debugAudioState = 'blocked';
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

    if (value.startsWith('/api/v1/')) {
      return value;
    }

    if (value.startsWith('/interview-service/api/v1/')) {
      return value.replace('/interview-service/api/v1/', '/api/v1/');
    }

    if (/^https?:\/\//i.test(value)) {
      try {
        const parsed = new URL(value);
        if (parsed.pathname.startsWith('/interview-service/api/v1/')) {
          return parsed.pathname.replace('/interview-service/api/v1/', '/api/v1/');
        }
      } catch {
        // Keep original URL when parsing fails.
      }
      return value;
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
