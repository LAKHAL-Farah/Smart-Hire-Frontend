import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { InterviewApiService } from '../interview-api.service';
import { InterviewMode, InterviewType, LiveBootstrapResponse, LiveSubMode, RoleType } from '../interview.models';
import { resolveCurrentUserId } from '../interview-user.util';

interface PreparedLiveAudio {
  greetingAudioUrl: string;
  resolvedGreetingAudioUrl: string;
  bootstrap: LiveBootstrapResponse;
}

interface RoleCard {
  value: RoleType;
  icon: string;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-interview-setup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interview-setup.component.html',
  styleUrl: './interview-setup.component.scss',
})
export class InterviewSetupComponent implements OnInit {
  private readonly api = inject(InterviewApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly userId = resolveCurrentUserId();

  readonly selectedRole = signal<RoleType | null>(null);
  readonly selectedType = signal<InterviewType | null>(null);
  readonly selectedMode = signal<InterviewMode | null>(null);
  readonly selectedLiveSubMode = signal<LiveSubMode>('TEST_LIVE');
  readonly questionCount = signal(8);
  readonly selectedInputMode = signal<'TEXT'>('TEXT');

  readonly isStarting = signal(false);
  readonly isPreparingLive = signal(false);
  readonly preparingMessage = signal('Preparing your live interview...');
  readonly errorMessage = signal<string | null>(null);

  readonly estimatedMinutes = computed(() => this.questionCount() * 3);
  readonly minQuestionCount = computed(() => (this.selectedMode() === 'LIVE' ? 3 : 5));
  readonly maxQuestionCount = computed(() => (this.selectedMode() === 'LIVE' ? 15 : 20));
  readonly canStart = computed(
    () =>
      !!this.userId &&
      !!this.selectedRole() &&
      !!this.selectedType() &&
      !!this.selectedMode() &&
      !this.isStarting() &&
      !this.isPreparingLive()
  );

  readonly roles: RoleCard[] = [
    {
      value: 'SE',
      icon: '⌨️',
      title: 'Software Engineer',
      subtitle: 'Algorithms, system design, coding problems',
    },
    {
      value: 'CLOUD',
      icon: '☁️',
      title: 'Cloud Engineer',
      subtitle: 'Cloud architecture, scalability, fault tolerance',
    },
    {
      value: 'AI',
      icon: '🧠',
      title: 'AI Engineer',
      subtitle: 'ML pipelines, model selection, deployment',
    },
  ];

  readonly types: Array<{ label: string; value: InterviewType }> = [
    { label: 'Behavioral', value: 'BEHAVIORAL' },
    { label: 'Technical', value: 'TECHNICAL' },
    { label: 'Mixed', value: 'MIXED' },
  ];

  ngOnInit(): void {
    this.selectedRole.set('SE');
    this.selectedType.set('TECHNICAL');
    this.selectedMode.set('PRACTICE');

    this.route.queryParamMap.subscribe((params) => {
      const mode = this.normalizeMode(params.get('mode'));
      const role = this.normalizeRole(params.get('role'));
      const type = this.normalizeType(params.get('type'));

      if (mode) {
        this.selectedMode.set(mode);
      }

      if (role) {
        this.selectedRole.set(role);
      }

      if (type) {
        this.selectedType.set(type);
      }
    });
  }

  setRole(role: RoleType): void {
    this.selectedRole.set(role);
  }

  setType(type: InterviewType): void {
    this.selectedType.set(type);
  }

  setMode(mode: InterviewMode): void {
    this.selectedMode.set(mode);
    const min = this.minQuestionCount();
    const max = this.maxQuestionCount();
    const clamped = Math.min(max, Math.max(min, this.questionCount()));
    if (clamped !== this.questionCount()) {
      this.questionCount.set(clamped);
    }
  }

  setLiveSubMode(mode: LiveSubMode): void {
    this.selectedLiveSubMode.set(mode);
  }

  setQuestionCount(event: Event): void {
    const target = event.target as HTMLInputElement;
    const min = this.minQuestionCount();
    const max = this.maxQuestionCount();
    const value = Number(target.value);
    this.questionCount.set(Math.min(max, Math.max(min, value)));
  }

  startInterview(): void {
    if (!this.canStart()) {
      if (!this.userId) {
        this.errorMessage.set('No active user found. Please sign in before starting an interview.');
      }
      return;
    }

    const role = this.selectedRole();
    const type = this.selectedType();
    const mode = this.selectedMode();
    if (!role || !type || !mode) {
      return;
    }

    if (mode === 'LIVE') {
      this.startLiveInterview(role);
      return;
    }

    this.isStarting.set(true);
    this.errorMessage.set(null);

    this.api
      .startSession({
        userId: this.userId!,
        careerPathId: 1,
        role,
        roleType: role,
        mode,
        type,
        questionCount: this.questionCount(),
      })
      .subscribe({
        next: (session) => {
          if (!session?.id) {
            this.isStarting.set(false);
            this.errorMessage.set('Session was created but no id was returned.');
            return;
          }

          this.isStarting.set(false);
          this.navigateAfterStart(session.id, role, type, mode);
        },
        error: (error: HttpErrorResponse) => {
          this.isStarting.set(false);
          const backendMessage = this.extractBackendErrorMessage(error);
          this.errorMessage.set(
            backendMessage
              ? `Unable to start interview session: ${backendMessage}`
              : 'Unable to start interview session. Please try again.'
          );
        },
      });
  }

  private startLiveInterview(role: RoleType): void {
    this.isStarting.set(true);
    this.errorMessage.set(null);

    const request = {
      userId: this.userId!,
      careerPathId: 1,
      liveSubMode: this.selectedLiveSubMode(),
      questionCount: Math.min(15, Math.max(3, this.questionCount())),
      companyName: 'Tech Company',
      targetRole: this.roleLabel(role),
    };

    this.api
      .startLiveSession(request)
      .subscribe({
        next: (response) => {
          const sessionId = response?.sessionId;
          if (!sessionId) {
            this.isStarting.set(false);
            this.errorMessage.set('Live session was created but no session id was returned.');
            return;
          }

          void this.prepareLiveSessionAndNavigate(sessionId, this.selectedLiveSubMode(), {
            companyName: request.companyName,
            targetRole: request.targetRole,
          });
        },
        error: async (error: HttpErrorResponse) => {
          const backendMessage = this.extractBackendErrorMessage(error);

          if (error.status === 409) {
            const resolved = await this.resolveLiveConflictAndRetry(request, backendMessage ?? '');
            if (resolved) {
              this.isStarting.set(false);
              return;
            }
          }

          this.isStarting.set(false);
          this.errorMessage.set(
            backendMessage
              ? `Unable to start live session: ${backendMessage}`
              : 'Unable to start live session. Please try again.'
          );
        },
      });
  }

  private async resolveLiveConflictAndRetry(request: {
    userId: number;
    careerPathId: number;
    liveSubMode: LiveSubMode;
    questionCount: number;
    companyName: string;
    targetRole: string;
  }, backendMessage: string): Promise<boolean> {
    let activeSessionId = this.extractActiveSessionIdFromMessage(backendMessage);
    let activeMode = '';

    try {
      const active = await firstValueFrom(this.api.getActiveSession(request.userId));
      if (active?.id) {
        activeSessionId = active.id;
        activeMode = String(active.mode ?? '').toUpperCase();
      }
    } catch {
      // Ignore lookup issues and fallback to id parsed from conflict payload.
    }

    if (!activeSessionId) {
      return false;
    }

    if (!activeMode) {
      try {
        const byId = await firstValueFrom(this.api.getSessionById(activeSessionId));
        activeMode = String(byId.mode ?? '').toUpperCase();
      } catch {
        activeMode = '';
      }
    }

    if (activeMode === 'LIVE') {
      await this.prepareLiveSessionAndNavigate(activeSessionId, request.liveSubMode, {
        companyName: request.companyName,
        targetRole: request.targetRole,
      });
      return true;
    }

    try {
      await firstValueFrom(this.api.abandonSession(activeSessionId));
      const retried = await firstValueFrom(this.api.startLiveSession(request));
      if (retried?.sessionId) {
        await this.prepareLiveSessionAndNavigate(retried.sessionId, request.liveSubMode, {
          companyName: request.companyName,
          targetRole: request.targetRole,
        });
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }

  private async prepareLiveSessionAndNavigate(
    sessionId: number,
    subMode: LiveSubMode,
    context?: { companyName?: string; targetRole?: string }
  ): Promise<void> {
    this.isStarting.set(false);
    this.isPreparingLive.set(true);
    this.errorMessage.set(null);
    this.preparingMessage.set('Preparing your session...');

    const preparedAudio = await this.waitForLiveGreetingAudio(sessionId, context);
    if (!preparedAudio) {
      this.isPreparingLive.set(false);
      this.errorMessage.set(
        'Your session started, but greeting audio is still preparing. Please try Start Interview again in a few seconds.'
      );
      return;
    }

    this.preparingMessage.set('Audio is ready. Opening your live room...');
    await this.navigateToLiveRoom(sessionId, subMode, context, preparedAudio);
    this.isPreparingLive.set(false);
  }

  private async waitForLiveGreetingAudio(
    sessionId: number,
    context?: { companyName?: string; targetRole?: string }
  ): Promise<PreparedLiveAudio | null> {
    const maxAttempts = 25;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      this.preparingMessage.set(`Preparing your session audio (${attempt}/${maxAttempts})...`);

      try {
        const bootstrap = await firstValueFrom(
          this.api.getLiveBootstrap(sessionId, {
            companyName: context?.companyName,
            targetRole: context?.targetRole,
            candidateName: 'Candidate',
          })
        );

        const greetingAudioUrl = (bootstrap?.greetingAudioUrl ?? '').trim();
        if (greetingAudioUrl) {
          const resolvedGreetingAudioUrl = this.api.resolveBackendAssetUrl(greetingAudioUrl);
          const audioReady = await this.isGreetingAudioReachable(resolvedGreetingAudioUrl);
          if (audioReady) {
            return {
              greetingAudioUrl,
              resolvedGreetingAudioUrl,
              bootstrap,
            };
          }
        }
      } catch {
        // Keep waiting because TTS can become available a few seconds later.
      }

      await this.sleep(1200);
    }

    return null;
  }

  private async isGreetingAudioReachable(resolvedUrl: string): Promise<boolean> {
    try {
      const response = await fetch(resolvedUrl, { method: 'GET', cache: 'no-store' });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private async navigateAfterStart(
    sessionId: number,
    role: RoleType,
    type: InterviewType,
    mode: InterviewMode,
  ): Promise<void> {
    if (mode === 'PRACTICE') {
      const navigated = await this.safeNavigate(`/dashboard/interview/session/${sessionId}`);
      if (!navigated) {
        this.errorMessage.set('Session started, but navigation failed. Open it from Interview Hub.');
      }
      return;
    }

    const targets: string[] = [];

    if (role === 'SE' && type === 'TECHNICAL') {
      targets.push(`/dashboard/interview/session/${sessionId}/code`);
    }

    if (role === 'CLOUD') {
      targets.push(`/dashboard/interview/session/${sessionId}/cloud`);
    }

    if (role === 'AI') {
      targets.push(`/dashboard/interview/session/${sessionId}/ml`);
    }

    targets.push(`/dashboard/interview/session/${sessionId}`);

    for (const target of targets) {
      const navigated = await this.safeNavigate(target);
      if (navigated) {
        return;
      }
    }

    this.errorMessage.set('Session started, but navigation failed. Open it from Interview Hub.');
  }

  private async safeNavigate(target: string): Promise<boolean> {
    try {
      const navigated = await this.router.navigateByUrl(target, { replaceUrl: true });
      if (navigated) {
        return true;
      }
    } catch (error) {
      console.error('[InterviewSetup] router navigation failed', { target, error });
    }

    try {
      globalThis.location.assign(target);
      return true;
    } catch {
      return false;
    }
  }

  private async navigateToLiveRoom(
    sessionId: number,
    subMode: LiveSubMode,
    context?: { companyName?: string; targetRole?: string },
    preparedAudio?: PreparedLiveAudio
  ): Promise<void> {
    const dashboardTarget = `/dashboard/interview/live/${sessionId}`;
    const topLevelTarget = `/interview/live/${sessionId}`;
    const query = new URLSearchParams({ subMode });
    if (context?.companyName) {
      query.set('company', context.companyName);
    }
    if (context?.targetRole) {
      query.set('targetRole', context.targetRole);
    }
    if (preparedAudio?.greetingAudioUrl) {
      query.set('preparedGreetingUrl', preparedAudio.greetingAudioUrl);
      query.set('preparedResolvedGreetingUrl', preparedAudio.resolvedGreetingAudioUrl);
    }
    const queryString = query.toString();

    try {
      const routed = await this.router.navigateByUrl(
        `${dashboardTarget}?${queryString}`,
        { replaceUrl: true }
      );
      if (routed) {
        return;
      }
    } catch {
      // Fallback handled below.
    }

    try {
      const routed = await this.router.navigate(['/dashboard/interview/live', sessionId], {
        queryParams: {
          subMode,
          company: context?.companyName,
          targetRole: context?.targetRole,
          preparedGreetingUrl: preparedAudio?.greetingAudioUrl,
          preparedResolvedGreetingUrl: preparedAudio?.resolvedGreetingAudioUrl,
        },
        replaceUrl: true,
      });
      if (routed) {
        return;
      }
    } catch {
      // Fallback handled below.
    }

    try {
      const routed = await this.router.navigateByUrl(
        `${topLevelTarget}?${queryString}`,
        { replaceUrl: true }
      );
      if (routed) {
        return;
      }
    } catch {
      // Final fallback handled below.
    }

    try {
      const routed = await this.router.navigate(['/interview/live', sessionId], {
        queryParams: {
          subMode,
          company: context?.companyName,
          targetRole: context?.targetRole,
          preparedGreetingUrl: preparedAudio?.greetingAudioUrl,
          preparedResolvedGreetingUrl: preparedAudio?.resolvedGreetingAudioUrl,
        },
        replaceUrl: true,
      });
      if (routed) {
        return;
      }
    } catch {
      // Final fallback handled below.
    }

    this.errorMessage.set(`Live session started, but navigation failed. Open: ${dashboardTarget}?subMode=${subMode}`);
  }

  private normalizeMode(raw: string | null): InterviewMode | null {
    const value = (raw ?? '').trim().toUpperCase();
    if (!value) {
      return null;
    }

    if (value === 'LIVE' || value.startsWith('LIVE')) {
      return 'LIVE';
    }

    if (value === 'TEST' || value.startsWith('TEST')) {
      return 'TEST';
    }

    if (value === 'PRACTICE' || value === 'PRACTICAL' || value.startsWith('PRACTIC')) {
      return 'PRACTICE';
    }

    return null;
  }

  private roleLabel(role: RoleType): string {
    switch (role) {
      case 'SE':
        return 'Software Engineer';
      case 'CLOUD':
        return 'Cloud Engineer';
      case 'AI':
        return 'AI Engineer';
      default:
        return 'Software Engineer';
    }
  }

  private normalizeRole(raw: string | null): RoleType | null {
    const value = (raw ?? '').trim().toUpperCase();
    if (value === 'SE' || value === 'CLOUD' || value === 'AI' || value === 'ALL') {
      return value;
    }

    return null;
  }

  private normalizeType(raw: string | null): InterviewType | null {
    const value = (raw ?? '').trim().toUpperCase();
    if (value === 'TECHNICAL' || value === 'BEHAVIORAL' || value === 'MIXED') {
      return value;
    }

    return null;
  }

  private extractBackendErrorMessage(error: HttpErrorResponse): string | null {
    const payload = error.error;

    if (!payload) {
      return null;
    }

    if (typeof payload === 'string') {
      return payload.trim() || null;
    }

    if (typeof payload === 'object') {
      const message = (payload as { message?: unknown; detail?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message.trim();
      }

      const detail = (payload as { detail?: unknown }).detail;
      if (typeof detail === 'string' && detail.trim()) {
        return detail.trim();
      }
    }

    return null;
  }

  private extractActiveSessionIdFromMessage(message: string): number | null {
    const match = /active session:\s*(\d+)/i.exec(message ?? '');
    if (!match) {
      return null;
    }

    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
