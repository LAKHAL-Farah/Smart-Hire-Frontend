import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { InterviewApiService } from '../interview-api.service';
import { InterviewMode, InterviewType, RoleType } from '../interview.models';
import { resolveCurrentUserId } from '../interview-user.util';

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
  readonly questionCount = signal(8);
  readonly selectedInputMode = signal<'TEXT'>('TEXT');

  readonly isStarting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly estimatedMinutes = computed(() => this.questionCount() * 3);
  readonly canStart = computed(
    () => !!this.userId && !!this.selectedRole() && !!this.selectedType() && !!this.selectedMode() && !this.isStarting()
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
      const mode = params.get('mode');
      const role = params.get('role');
      const type = params.get('type');

      if (mode === 'PRACTICE' || mode === 'TEST') {
        this.selectedMode.set(mode);
      }

      if (role === 'SE' || role === 'CLOUD' || role === 'AI' || role === 'ALL') {
        this.selectedRole.set(role);
      }

      if (type === 'TECHNICAL' || type === 'BEHAVIORAL' || type === 'MIXED') {
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
  }

  setQuestionCount(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.questionCount.set(Number(target.value));
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

    this.isStarting.set(true);
    this.errorMessage.set(null);

    this.api
      .startSession({
        userId: this.userId!,
        careerPathId: 1,
        role,
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
          this.navigateAfterStart(session.id, role, type);
        },
        error: (error: HttpErrorResponse) => {
          this.isStarting.set(false);
          const backendMessage =
            (error.error && typeof error.error === 'object' && (error.error.message || error.error.detail)) ||
            null;
          this.errorMessage.set(
            backendMessage
              ? `Unable to start interview session: ${backendMessage}`
              : 'Unable to start interview session. Please try again.'
          );
        },
      });
  }

  private async navigateAfterStart(sessionId: number, role: RoleType, type: InterviewType): Promise<void> {
    const targets: string[][] = [];

    if (role === 'SE' && type === 'TECHNICAL') {
      targets.push(['/dashboard/interview/session', String(sessionId), 'code']);
    }

    if (role === 'CLOUD') {
      targets.push(['/dashboard/interview/session', String(sessionId), 'cloud']);
    }

    if (role === 'AI') {
      targets.push(['/dashboard/interview/session', String(sessionId), 'ml']);
    }

    targets.push(['/dashboard/interview/session', String(sessionId)]);

    for (const target of targets) {
      const navigated = await this.router.navigate(target);
      if (navigated) {
        return;
      }
    }

    this.errorMessage.set('Session started, but navigation failed. Open it from Interview Hub.');
  }
}
