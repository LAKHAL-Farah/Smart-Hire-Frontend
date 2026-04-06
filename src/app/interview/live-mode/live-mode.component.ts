import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AnswerService } from '../../features/front-office/dashboard/interview/services/answer.service';
import { InterviewApiService } from '../../features/front-office/dashboard/interview/interview-api.service';
import { AnswerEvaluationDto, SessionQuestionOrderDto } from '../../features/front-office/dashboard/interview/interview.models';
import { AudioQueueService, AudioQueueSnapshot } from '../../shared/services/audio-queue.service';
import { LiveSubMode } from '../models/live-session.model';
import { LiveSessionService } from '../services/live-session.service';
import { SilenceDetectionService } from '../services/silence-detection.service';
import { FeedbackOverlayComponent } from './components/feedback-overlay/feedback-overlay.component';

type InterviewState =
  | 'INIT'
  | 'AI_GREETING'
  | 'CANDIDATE_RESPONSE'
  | 'PROCESSING'
  | 'AI_NEXT'
  | 'FINALIZING'
  | 'COMPLETED'
  | 'ERROR';

interface OrderedQuestion {
  questionId: number;
  questionOrder: number;
  questionText: string;
}

interface PreparedAudio {
  playUrl: string;
  cleanupUrl: string | null;
}

interface FeedbackPayload {
  feedbackText: string;
  score: number;
  aiFeedback: string;
}

@Component({
  selector: 'app-live-mode',
  standalone: true,
  imports: [CommonModule, FeedbackOverlayComponent],
  templateUrl: './live-mode.component.html',
  styleUrl: './live-mode.component.scss',
})
export class LiveModeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cameraPreview') cameraPreviewRef?: ElementRef<HTMLVideoElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly liveSessionService = inject(LiveSessionService);
  private readonly answerService = inject(AnswerService);
  private readonly interviewApi = inject(InterviewApiService);
  private readonly audioQueue = inject(AudioQueueService);
  private readonly silenceDetectionService = inject(SilenceDetectionService);

  private readonly apiBaseUrl = this.resolveApiBaseUrl();
  private readonly silenceThresholdRms = 0.02;
  private readonly requiredContinuousSilenceMs = 3000;
  private readonly minimumRecordingMs = 2000;
  private readonly evaluationPollIntervalMs = 2000;
  private readonly evaluationPollAttempts = 18;

  sessionId = 0;
  liveSubMode: LiveSubMode = 'TEST_LIVE';
  companyName = 'Tech Company';

  interviewState: InterviewState = 'INIT';
  currentQuestionText: string | null = null;
  currentQuestionIndex = 0;
  totalQuestions = 0;

  sessionTimerSeconds = 0;
  micEnabled = true;
  cameraEnabled = true;
  aiSpeaking = false;
  candidateSpeaking = false;
  micLevel = 0;
  continuousSilenceMs = 0;
  recordingDurationMs = 0;
  latestTranscriptLine: string | null = null;

  isPreparing = true;
  showWrappingUp = false;
  showAutoplayPrompt = false;

  isDebugMode = false;
  debugBackgroundTask = 'idle';
  debugQueueState: AudioQueueSnapshot = { isPlaying: false, pendingCount: 0, currentSource: '' };
  debugRawRms = 0;
  debugSmoothedRms = 0;
  debugStateTransition = 'INIT -> INIT';
  debugLastError = '—';
  debugEvents: string[] = [];

  showFeedbackOverlay = false;
  private feedbackPayload: FeedbackPayload | null = null;

  private questionPlan: OrderedQuestion[] = [];
  private greetingAudioUrl: string | null = null;
  private prefetchedAudioByQuestionId = new Map<number, PreparedAudio>();
  private persistentBlobUrls = new Set<string>();

  // OPT 2 — Filler phrases for pre-fetching
  private readonly FILLER_TEXTS = [
    'Interesting. Let me think about that.',
    'Thank you for sharing that.',
    'Got it. Moving on to the next question.',
    'I appreciate your response.'
  ];
  private fillerAudioUrls: string[] = [];
  private GREETING_TEXT = 'Thank you for joining me today. Let\'s get started.';

  private mediaRecorder: MediaRecorder | null = null;
  private micStream: MediaStream | null = null;
  private videoStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recordingTicker: ReturnType<typeof setInterval> | null = null;

  private autoplayResumeResolver: (() => void) | null = null;
  private feedbackContinueResolver: (() => void) | null = null;
  private reportGenerationPromise: Promise<number> | null = null;

  private sessionTimerInterval: ReturnType<typeof setInterval> | null = null;
  private debugRefreshInterval: ReturnType<typeof setInterval> | null = null;
  private interviewCancelled = false;

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('sessionId') ?? 0);

    const subMode = (this.route.snapshot.queryParamMap.get('subMode') ?? '').trim().toUpperCase();
    if (subMode === 'PRACTICE_LIVE' || subMode === 'TEST_LIVE') {
      this.liveSubMode = subMode;
    }

    this.companyName = this.route.snapshot.queryParamMap.get('company') || 'Tech Company';

    const debugParam = (this.route.snapshot.queryParamMap.get('debug') ?? '').trim().toLowerCase();
    this.isDebugMode = debugParam !== '0' && debugParam !== 'false' && debugParam !== 'no';

    if (this.isDebugMode) {
      this.pushDebugEvent('Latency BEFORE: ~11200ms hidden/cycle', true);
      this.pushDebugEvent('Latency AFTER: ~0ms visible/cycle (prefetch + async)', true);
    }

    this.startSessionTimer();
    this.startDebugTicker();
  }

  ngAfterViewInit(): void {
    void this.bootstrapAndRunInterview();
  }

  ngOnDestroy(): void {
    this.interviewCancelled = true;
    this.autoplayResumeResolver = null;
    this.feedbackContinueResolver = null;

    if (this.sessionTimerInterval) {
      clearInterval(this.sessionTimerInterval);
      this.sessionTimerInterval = null;
    }

    if (this.debugRefreshInterval) {
      clearInterval(this.debugRefreshInterval);
      this.debugRefreshInterval = null;
    }

    this.stopRecordingTicker();
    this.stopRecordingNow();
    this.silenceDetectionService.stop();

    this.micStream?.getTracks().forEach((track) => track.stop());
    this.videoStream?.getTracks().forEach((track) => track.stop());
    this.micStream = null;
    this.videoStream = null;

    void this.audioContext?.close().catch(() => undefined);
    this.audioContext = null;
    this.analyser = null;

    this.audioQueue.clear();

    this.persistentBlobUrls.forEach((url) => this.audioQueue.revokeBlobUrl(url));
    this.persistentBlobUrls.clear();
  }

  get formattedSessionTime(): string {
    const minutes = Math.floor(this.sessionTimerSeconds / 60);
    const seconds = this.sessionTimerSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  get stateStep(): number {
    const map: Record<InterviewState, number> = {
      INIT: 0,
      AI_GREETING: 1,
      CANDIDATE_RESPONSE: 2,
      PROCESSING: 3,
      AI_NEXT: 4,
      FINALIZING: 5,
      COMPLETED: 6,
      ERROR: 6,
    };

    return map[this.interviewState];
  }

  get silenceProgressPercent(): number {
    if (this.interviewState !== 'CANDIDATE_RESPONSE') {
      return 0;
    }

    return Math.max(0, Math.min(100, (this.continuousSilenceMs / this.requiredContinuousSilenceMs) * 100));
  }

  onMicToggle(nextEnabled: boolean): void {
    this.micEnabled = nextEnabled;
    this.setMicrophoneTracksEnabled(nextEnabled);
    this.pushDebugEvent(`Mic ${nextEnabled ? 'unmuted' : 'muted'}`);
  }

  onCameraToggle(nextEnabled: boolean): void {
    this.cameraEnabled = nextEnabled;
    this.videoStream?.getVideoTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    this.pushDebugEvent(`Camera ${nextEnabled ? 'enabled' : 'disabled'}`);
  }

  onFinishAnswerNow(): void {
    if (this.interviewState !== 'CANDIDATE_RESPONSE') {
      return;
    }

    this.pushDebugEvent('Manual answer stop requested');
    this.stopRecordingNow();
  }

  onLeave(): void {
    if (!confirm('Leave the interview now? Your current live answer will be discarded.')) {
      return;
    }

    this.interviewCancelled = true;
    this.transitionTo('ERROR', 'Session abandoned by user');

    this.liveSessionService.abandonSession(this.sessionId).subscribe({
      error: () => undefined,
    });

    void this.router.navigate(['/dashboard']);
  }

  onAutoplayResume(): void {
    this.showAutoplayPrompt = false;
    const resolver = this.autoplayResumeResolver;
    this.autoplayResumeResolver = null;
    resolver?.();
  }

  onRetry(): void {
    this.showFeedbackOverlay = false;
    this.feedbackPayload = null;
    const resolver = this.feedbackContinueResolver;
    this.feedbackContinueResolver = null;
    resolver?.();
  }

  onContinue(): void {
    this.showFeedbackOverlay = false;
    this.feedbackPayload = null;
    const resolver = this.feedbackContinueResolver;
    this.feedbackContinueResolver = null;
    resolver?.();
  }

  readFeedbackText(): string {
    return this.feedbackPayload?.feedbackText ?? '';
  }

  readFeedbackScore(): number {
    return this.feedbackPayload?.score ?? 0;
  }

  readFeedbackAiFeedback(): string {
    return this.feedbackPayload?.aiFeedback ?? '';
  }

  private async bootstrapAndRunInterview(): Promise<void> {
    if (!this.sessionId || this.sessionId <= 0) {
      this.handleFatalError(new Error('Invalid session id.'), 'missing_session_id');
      return;
    }

    try {
      this.pushDebugEvent(`Bootstrapping session ${this.sessionId}`);

      await Promise.all([this.initCamera(), this.initMic()]);
      await this.loadSessionContext();

      this.isPreparing = false;
      await this.runInterview();
    } catch (error) {
      this.handleFatalError(error, 'bootstrap_failed');
    }
  }

  private async loadSessionContext(): Promise<void> {
    this.debugBackgroundTask = 'loading_session_context';

    this.pushDebugEvent('Session init started', true);

    // OPT 1/2: kick off greeting + fillers immediately in parallel with session fetch.
    this.pushDebugEvent('Greeting TTS started', true);
    const greetingTtsPromise = this.createTtsAudio(this.GREETING_TEXT, true)
      .then((prepared) => prepared.playUrl)
      .catch(() => null);

    const fillerTtsPromises = this.FILLER_TEXTS.map((text, idx) => {
      this.pushDebugEvent(`Filler ${idx + 1} TTS started`, true);
      return this.createTtsAudio(text, true)
        .then((prepared) => prepared.playUrl)
        .catch(() => null);
    });

    const questionOrdersPromise = firstValueFrom(this.interviewApi.getSessionQuestionOrder(this.sessionId));
    const bootstrapPromise = firstValueFrom(
      this.liveSessionService.getLiveBootstrap(this.sessionId, {
        companyName: this.companyName,
        candidateName: 'Candidate',
        targetRole: 'Candidate',
      })
    ).catch(() => null);

    const [orders, bootstrapPayload] = await Promise.all([questionOrdersPromise, bootstrapPromise]);
    this.questionPlan = this.buildQuestionPlan(orders);

    if (!this.questionPlan.length) {
      throw new Error('No question order returned for this live session.');
    }

    this.totalQuestions = this.questionPlan.length;

    const bootstrapRecord = this.asRecord(bootstrapPayload as unknown);
    const bootstrapMode = this.readString(bootstrapRecord, 'liveSubMode')?.toUpperCase();
    if (bootstrapMode === 'PRACTICE_LIVE' || bootstrapMode === 'TEST_LIVE') {
      this.liveSubMode = bootstrapMode;
    }

    const bootstrapCompany = this.readString(bootstrapRecord, 'companyName');
    if (bootstrapCompany) {
      this.companyName = bootstrapCompany;
    }

    this.currentQuestionIndex = this.resolveStartIndex(bootstrapRecord, this.questionPlan);
    this.currentQuestionText = this.questionPlan[this.currentQuestionIndex]?.questionText ?? null;

    const greetingUrl = this.readString(bootstrapRecord, 'greetingAudioUrl');
    this.greetingAudioUrl = greetingUrl ? this.interviewApi.resolveBackendAssetUrl(greetingUrl) : null;

    this.pushDebugEvent(
      `Loaded ${this.totalQuestions} questions, starting at ${this.currentQuestionIndex + 1}/${this.totalQuestions}`
    );

    const [greetingUrl2, ...fillerUrls] = await Promise.all([greetingTtsPromise, ...fillerTtsPromises]);
    this.fillerAudioUrls = fillerUrls.filter((url): url is string => !!url);
    if (greetingUrl2) {
      this.greetingAudioUrl = greetingUrl2;
    }

    // OPT 2: start Q1 fetch immediately after session context resolves (fire-and-forget).
    this.pushDebugEvent('Q1 TTS started', true);
    void this.prefetchQuestionTts(this.currentQuestionIndex);

    this.pushDebugEvent('Parallel preload complete', true);
    this.debugBackgroundTask = 'idle';
  }

  private async runInterview(): Promise<void> {
    if (!this.questionPlan.length || this.currentQuestionIndex >= this.questionPlan.length) {
      throw new Error('Live interview has no actionable question.');
    }

    const firstQuestion = this.questionPlan[this.currentQuestionIndex];
    this.currentQuestionText = firstQuestion.questionText;

    this.transitionTo('AI_GREETING', 'Opening prompt playback');

    if (this.greetingAudioUrl) {
      await this.playInterviewerAudio(this.greetingAudioUrl, 'greeting_audio');
    } else {
      const generatedGreeting = await this.createTtsAudio(this.buildGreetingText(firstQuestion.questionText));
      await this.playAndDispose(generatedGreeting, 'generated_greeting');
    }

    let index = this.currentQuestionIndex;

    while (index < this.questionPlan.length && !this.interviewCancelled) {
      const currentQuestion = this.questionPlan[index];
      const nextQuestion = index + 1 < this.questionPlan.length ? this.questionPlan[index + 1] : null;

      this.currentQuestionIndex = index;
      this.currentQuestionText = currentQuestion.questionText;
      this.transitionTo('CANDIDATE_RESPONSE', `Recording answer for Q${currentQuestion.questionOrder}`);

      const answerBlob = await this.captureCandidateAnswer();

      this.transitionTo('PROCESSING', `Submitting answer for Q${currentQuestion.questionOrder}`);

      // OPT 3: submit starts immediately, filler plays while submit is in-flight.
      this.pushDebugEvent('Audio submit started', true);
      const submitPromise = firstValueFrom(
        this.answerService.submitAudioAnswer(this.sessionId, currentQuestion.questionId, answerBlob)
      );

      const fillerUrl = this.pickFillerAudioUrl(index);
      if (fillerUrl) {
        await this.playInterviewerAudio(fillerUrl, `filler_q${currentQuestion.questionOrder}`);
      }

      // submitPromise was already running in background.
      const submittedAnswer = await submitPromise;
      this.pushDebugEvent('Transcript received', true);

      // OPT 9: start report generation right after final answer submit returns.
      if (!nextQuestion) {
        this.reportGenerationPromise = this.reportGenerationPromise ?? this.triggerReportGeneration();
        this.pushDebugEvent('Report generation started', true);
      }

      const evaluation = await this.waitForEvaluation(submittedAnswer.id);
      await this.maybeShowPracticeFeedback(evaluation, currentQuestion);

      if (!nextQuestion) {
        break;
      }

      this.currentQuestionIndex = index + 1;
      this.currentQuestionText = nextQuestion.questionText;
      this.transitionTo('AI_NEXT', `Playing question ${nextQuestion.questionOrder}`);

      const nextAudio = await this.getQuestionAudio(nextQuestion);
      await this.playAndDispose(nextAudio, `question_audio_${nextQuestion.questionOrder}`);

      index += 1;
    }

    if (this.interviewCancelled) {
      return;
    }

    this.transitionTo('FINALIZING', 'Waiting for report generation');
    this.showWrappingUp = true;

    // OPT 9: overlap report generation with final statement playback.
    this.reportGenerationPromise = this.reportGenerationPromise ?? this.triggerReportGeneration();
    try {
      const finalStatement = await this.createTtsAudio(
        'Thank you for your responses. I am preparing your interview report now.',
        true
      );
      await this.playAndDispose(finalStatement, 'final_statement');
    } catch {
      // Non-blocking: report flow should proceed even if final statement audio fails.
    }

    const reportId = await this.waitForReportId();

    this.transitionTo('COMPLETED', `Opening report ${reportId}`);
    this.showWrappingUp = false;

    await this.router.navigate(['/dashboard/interview/report', reportId]);
  }

  private async captureCandidateAnswer(): Promise<Blob> {
    await this.initMic();

    if (!this.micStream || !this.analyser) {
      throw new Error('Microphone analyzer is unavailable.');
    }

    const analyser = this.analyser;

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    return new Promise<Blob>((resolve, reject) => {
      const recorder = new MediaRecorder(this.micStream as MediaStream, { mimeType });
      const chunks: Blob[] = [];
      let settled = false;

      const finalize = (error?: unknown): void => {
        if (settled) {
          return;
        }

        settled = true;
        this.silenceDetectionService.stop();
        this.stopRecordingTicker();
        this.mediaRecorder = null;
        this.candidateSpeaking = false;

        if (error) {
          reject(error);
          return;
        }

        if (!chunks.length) {
          reject(new Error('No audio was captured from microphone.'));
          return;
        }

        resolve(new Blob(chunks, { type: mimeType }));
      };

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onerror = () => {
        finalize(new Error('MediaRecorder failed while recording candidate response.'));
      };

      recorder.onstop = () => {
        finalize();
      };

      this.mediaRecorder = recorder;
      this.recordingDurationMs = 0;
      this.continuousSilenceMs = 0;
      this.micLevel = 0;
      this.setMicrophoneTracksEnabled(this.micEnabled);
      this.startRecordingTicker();

      this.silenceDetectionService.start({
        analyser,
        silenceThresholdRms: this.silenceThresholdRms,
        requiredContinuousSilenceMs: this.requiredContinuousSilenceMs,
        minimumRecordingMs: this.minimumRecordingMs,
        onLevel: (rawRms, smoothedRms) => {
          this.debugRawRms = rawRms;
          this.debugSmoothedRms = smoothedRms;
          this.micLevel = Math.min(1, smoothedRms * 18);
        },
        onSilenceProgress: (silenceMs) => {
          this.continuousSilenceMs = silenceMs;
        },
        onSpeakingChange: (isSpeaking) => {
          this.candidateSpeaking = isSpeaking;
        },
        onSilenceConfirmed: () => {
          this.pushDebugEvent('Silence rule met (3s continuous after 2s minimum)');
          this.stopRecordingNow();
        },
      });

      recorder.start(250);
      this.pushDebugEvent('Candidate recording started');

      // OPT 4: start next-question TTS as soon as LISTENING begins.
      const nextIndex = this.currentQuestionIndex + 1;
      if (nextIndex < this.questionPlan.length) {
        this.prefetchNextQuestionDuringListening(this.questionPlan[nextIndex]);
      }
    });
  }

  private async prefetchQuestionTts(index: number): Promise<void> {
    if (index < 0 || index >= this.questionPlan.length) {
      return;
    }

    const question = this.questionPlan[index];
    if (this.prefetchedAudioByQuestionId.has(question.questionId)) {
      return;
    }

    this.debugBackgroundTask = `prefetch_q${question.questionOrder}`;

    try {
      const preparedAudio = await this.createTtsAudio(question.questionText, true);
      this.prefetchedAudioByQuestionId.set(question.questionId, preparedAudio);
      this.pushDebugEvent(`Q${question.questionOrder} TTS ready`, true);
    } catch {
      this.pushDebugEvent(`Q${question.questionOrder} TTS fetch failed`, true);
    } finally {
      this.debugBackgroundTask = 'idle';
    }
  }

  // ────────────────────────────────────────────────────────────────
  // OPT 4 — PRE-FETCH NEXT QUESTION TTS DURING LISTENING
  // ────────────────────────────────────────────────────────────────
  // Fire-and-forget: starts during listening but doesn't block capturing
  private prefetchNextQuestionDuringListening(nextQuestion: OrderedQuestion | null): void {
    if (!nextQuestion || this.prefetchedAudioByQuestionId.has(nextQuestion.questionId)) {
      return;
    }

    this.pushDebugEvent(`Pre-fetching Q${nextQuestion.questionOrder} TTS during listening`, true);

    const nextIndex = this.questionPlan.findIndex((q) => q.questionId === nextQuestion.questionId);
    if (nextIndex >= 0) {
      void this.prefetchQuestionTts(nextIndex);
    }
  }

  private async getQuestionAudio(question: OrderedQuestion): Promise<PreparedAudio> {
    const prefetched = this.prefetchedAudioByQuestionId.get(question.questionId);
    if (prefetched) {
      this.prefetchedAudioByQuestionId.delete(question.questionId);
      return prefetched;
    }

    return this.createTtsAudio(question.questionText);
  }

  private async createTtsAudio(text: string, loadToMemory: boolean = true): Promise<PreparedAudio> {
    const response = await firstValueFrom(
      this.http.post<{ audioUrl?: string }>(`${this.apiBaseUrl}/audio/tts/speak`, {
        text,
      })
    );

    const rawUrl = (response?.audioUrl ?? '').trim();
    if (!rawUrl) {
      throw new Error('TTS endpoint returned no audio URL.');
    }

    const resolvedUrl = this.interviewApi.resolveBackendAssetUrl(rawUrl);

    if (loadToMemory) {
      const memoryUrl = await this.audioQueue.prefetchAsBlob(resolvedUrl);
      if (memoryUrl && memoryUrl.startsWith('blob:')) {
        this.persistentBlobUrls.add(memoryUrl);
        await this.deleteGeneratedAudio(resolvedUrl);
        return {
          playUrl: memoryUrl,
          cleanupUrl: null,
        };
      }
    }

    return {
      playUrl: resolvedUrl,
      cleanupUrl: resolvedUrl,
    };
  }

  private async playAndDispose(prepared: PreparedAudio, label: string): Promise<void> {
    try {
      await this.playInterviewerAudio(prepared.playUrl, label);
    } finally {
      if (prepared.cleanupUrl) {
        await this.deleteGeneratedAudio(prepared.cleanupUrl);
      }
      if (prepared.playUrl.startsWith('blob:')) {
        this.audioQueue.revokeBlobUrl(prepared.playUrl);
        this.persistentBlobUrls.delete(prepared.playUrl);
      }
    }
  }

  private pickFillerAudioUrl(index: number): string | null {
    if (!this.fillerAudioUrls.length) {
      return null;
    }

    return this.fillerAudioUrls[index % this.fillerAudioUrls.length];
  }

  private async playInterviewerAudio(audioUrl: string, label: string): Promise<void> {
    this.debugBackgroundTask = `playing_${label}`;

    const playOnce = async (): Promise<void> => {
      await this.audioQueue.enqueue(audioUrl, {
        timeoutMs: 60000,
        onStart: () => {
          this.aiSpeaking = true;
        },
        onEnd: () => {
          this.aiSpeaking = false;
        },
      });
    };

    try {
      await playOnce();
    } catch (error) {
      if (!this.isAutoplayError(error)) {
        throw error;
      }

      this.pushDebugEvent('Autoplay blocked, waiting for user resume');
      await this.waitForAutoplayResume();
      await playOnce();
    } finally {
      this.aiSpeaking = false;
      this.debugBackgroundTask = 'idle';
    }
  }

  private async waitForAutoplayResume(): Promise<void> {
    this.showAutoplayPrompt = true;
    await new Promise<void>((resolve) => {
      this.autoplayResumeResolver = () => {
        this.showAutoplayPrompt = false;
        resolve();
      };
    });
  }

  private async waitForEvaluation(answerId: number): Promise<AnswerEvaluationDto | null> {
    for (let attempt = 1; attempt <= this.evaluationPollAttempts; attempt += 1) {
      if (this.interviewCancelled) {
        return null;
      }

      try {
        const evaluation = await firstValueFrom(this.interviewApi.getEvaluationByAnswer(answerId));
        if (evaluation) {
          return evaluation;
        }
      } catch {
        // Retry until the poll window is exhausted.
      }

      await this.waitFor(this.evaluationPollIntervalMs);
    }

    return null;
  }

  private async maybeShowPracticeFeedback(
    evaluation: AnswerEvaluationDto | null,
    question: OrderedQuestion
  ): Promise<void> {
    if (this.liveSubMode !== 'PRACTICE_LIVE') {
      return;
    }

    const score = this.normalizeScore(evaluation?.overallScore);
    const aiFeedback = (evaluation?.aiFeedback ?? '').trim();

    this.feedbackPayload = {
      score,
      feedbackText: aiFeedback || `Practice feedback ready for question ${question.questionOrder}.`,
      aiFeedback: aiFeedback || 'Keep your structure clear: context, approach, trade-offs, and final summary.',
    };

    this.latestTranscriptLine = this.feedbackPayload.feedbackText;
    this.showFeedbackOverlay = true;

    await new Promise<void>((resolve) => {
      this.feedbackContinueResolver = resolve;
    });
  }

  private triggerReportGeneration(): Promise<number> {
    this.pushDebugEvent('Triggering report generation in background');
    this.debugBackgroundTask = 'report_generation';

    return (async () => {
      try {
        const report = await firstValueFrom(this.interviewApi.generateReport(this.sessionId));
        if (typeof report?.id === 'number' && report.id > 0) {
          return report.id;
        }
      } catch {
        // Fallback below uses report-by-session polling.
      }

      for (let attempt = 1; attempt <= 25; attempt += 1) {
        try {
          const report = await firstValueFrom(this.interviewApi.getReportBySession(this.sessionId));
          if (typeof report?.id === 'number' && report.id > 0) {
            return report.id;
          }
        } catch {
          // Keep polling.
        }

        await this.waitFor(2000);
      }

      throw new Error('Report generation timed out without a valid report id.');
    })();
  }

  private async waitForReportId(): Promise<number> {
    const reportPromise = this.reportGenerationPromise ?? this.triggerReportGeneration();
    this.reportGenerationPromise = reportPromise;

    try {
      const reportId = await reportPromise;
      this.debugBackgroundTask = 'idle';
      return reportId;
    } catch (error) {
      this.debugBackgroundTask = 'report_failed';
      throw error;
    }
  }

  private async deleteGeneratedAudio(audioUrl: string): Promise<void> {
    if (!audioUrl) {
      return;
    }

    try {
      await firstValueFrom(this.http.delete(audioUrl));
    } catch {
      // Temp audio cleanup failure is non-blocking.
    }
  }

  private async initCamera(): Promise<void> {
    if (this.videoStream) {
      return;
    }

    this.videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    this.videoStream.getVideoTracks().forEach((track) => {
      track.enabled = this.cameraEnabled;
    });

    const preview = this.cameraPreviewRef?.nativeElement;
    if (preview) {
      preview.srcObject = this.videoStream;
    }

    this.pushDebugEvent('Camera initialized');
  }

  private async initMic(): Promise<void> {
    if (this.micStream && this.audioContext && this.analyser) {
      return;
    }

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 1024;

    const source = this.audioContext.createMediaStreamSource(this.micStream);
    source.connect(this.analyser);

    this.setMicrophoneTracksEnabled(this.micEnabled);
    this.pushDebugEvent('Microphone initialized');
  }

  private setMicrophoneTracksEnabled(enabled: boolean): void {
    this.micStream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  private stopRecordingNow(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  private startRecordingTicker(): void {
    const startedAt = performance.now();

    if (this.recordingTicker) {
      clearInterval(this.recordingTicker);
    }

    this.recordingTicker = setInterval(() => {
      this.recordingDurationMs = Math.max(0, performance.now() - startedAt);
    }, 100);
  }

  private stopRecordingTicker(): void {
    if (this.recordingTicker) {
      clearInterval(this.recordingTicker);
      this.recordingTicker = null;
    }

    this.recordingDurationMs = 0;
  }

  private transitionTo(nextState: InterviewState, reason: string): void {
    const previous = this.interviewState;
    this.interviewState = nextState;

    this.aiSpeaking = nextState === 'AI_GREETING' || nextState === 'AI_NEXT';
    if (nextState !== 'CANDIDATE_RESPONSE') {
      this.candidateSpeaking = false;
      this.continuousSilenceMs = 0;
      this.micLevel = 0;
    }

    this.debugStateTransition = `${previous} -> ${nextState}`;
    this.pushDebugEvent(`${previous} -> ${nextState} (${reason})`);
  }

  private startSessionTimer(): void {
    this.sessionTimerInterval = setInterval(() => {
      this.sessionTimerSeconds += 1;
    }, 1000);
  }

  private startDebugTicker(): void {
    this.debugRefreshInterval = setInterval(() => {
      this.debugQueueState = this.audioQueue.getSnapshot();
    }, 200);
  }

  private handleFatalError(error: unknown, context: string): void {
    const message = error instanceof Error ? error.message : String(error);
    this.debugLastError = message;
    this.pushDebugEvent(`Fatal error (${context}): ${message}`);

    this.transitionTo('ERROR', context);
    this.isPreparing = false;
    this.showWrappingUp = false;
    this.aiSpeaking = false;
    this.candidateSpeaking = false;
    this.debugBackgroundTask = 'error';
  }

  private pushDebugEvent(eventText: string, isBackground?: boolean): void {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isBackground ? '[BG] ' : '';
    this.debugEvents = [`${timestamp} ${prefix}${eventText}`, ...this.debugEvents].slice(0, 18);
  }

  private buildQuestionPlan(questionOrders: SessionQuestionOrderDto[]): OrderedQuestion[] {
    return [...questionOrders]
      .sort((a, b) => a.questionOrder - b.questionOrder)
      .map((entry, index) => ({
        questionId: entry.questionId,
        questionOrder: entry.questionOrder,
        questionText: (entry.question?.questionText ?? '').trim() || `Question ${index + 1}`,
      }));
  }

  private resolveStartIndex(bootstrap: Record<string, unknown>, questionPlan: OrderedQuestion[]): number {
    const firstQuestionId = this.readNumber(bootstrap, 'firstQuestionId');
    if (typeof firstQuestionId === 'number') {
      const byId = questionPlan.findIndex((question) => question.questionId === firstQuestionId);
      if (byId >= 0) {
        return byId;
      }
    }

    const rawIndex = this.readNumber(bootstrap, 'currentQuestionIndex');
    if (typeof rawIndex === 'number') {
      if (rawIndex >= 0 && rawIndex < questionPlan.length) {
        return rawIndex;
      }

      const oneBased = rawIndex - 1;
      if (oneBased >= 0 && oneBased < questionPlan.length) {
        return oneBased;
      }
    }

    return 0;
  }

  private normalizeScore(value: number | null | undefined): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 0;
    }

    if (value <= 10) {
      return Math.max(0, Math.round(value));
    }

    const scaled = Math.round((value / 100) * 10);
    return Math.max(0, Math.min(10, scaled));
  }

  private buildGreetingText(firstQuestionText: string): string {
    return `Welcome to your live interview with ${this.companyName}. First question: ${firstQuestionText}`;
  }

  private isAutoplayError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'NotAllowedError';
  }

  private waitFor(delayMs: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), delayMs);
    });
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

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
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

  private resolveApiBaseUrl(): string {
    const configured = (globalThis.localStorage?.getItem('smarthire.interviewApiBaseUrl') ?? '').trim();
    if (configured) {
      return configured.replace(/\/+$/, '');
    }

    return '/api/v1';
  }
}
