import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { UnifiedAssessmentService } from '../../services/unified-assessment.service';
import { ASSESSMENT_PLACEHOLDER_USER_ID } from '../../assessment-placeholder-user';
import { ProfileApiService } from '../../../profile/profile-api.service';
import {
  careerPathToAssessmentSkill,
  retakeCountToLevel,
} from '../../../onboarding/onboarding-assessment-mapping';

@Component({
  selector: 'app-unified-assessment-start',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './unified-assessment-start.component.html',
  styleUrl: './unified-assessment-start.component.scss',
})
export class UnifiedAssessmentStartComponent implements OnInit {
  private readonly api = inject(UnifiedAssessmentService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly profileApi = inject(ProfileApiService);

  /** Coding + quiz only — no separate language track. */
  skill = 'FULLSTACK';
  level = 'JUNIOR';
  codingCount = 6;
  quizCount = 4;
  timeLimitSec: number | null = null;
  readonly tracks: string[] = ['CODING', 'QUIZ'];
  loading = signal(false);
  error = signal<string | null>(null);
  adaptiveHint = signal<string | null>(null);

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const skImmediate = q.get('skill')?.trim();
    if (skImmediate) {
      this.skill = skImmediate.toUpperCase();
    }
    let skillFromQuery = skImmediate;
    const situation = q.get('situation');
    const careerPath = q.get('careerPath');
    this.profileApi.getProfile().subscribe({
      next: (p) => {
        if (!skillFromQuery && p.onboardingJson) {
          try {
            const o = JSON.parse(p.onboardingJson) as { careerPath?: string };
            if (o.careerPath) {
              skillFromQuery = careerPathToAssessmentSkill(o.careerPath);
            }
          } catch {
            /* ignore */
          }
        }
        if (skillFromQuery) {
          this.skill = skillFromQuery.toUpperCase();
        }
        let ctx = '';
        if (situation && careerPath) {
          ctx = `Your setup: ${situation.replace(/-/g, ' ')} · target ${careerPath.replace(/-/g, ' ')}. `;
        } else if (p.onboardingJson) {
          try {
            const o = JSON.parse(p.onboardingJson) as { situation?: string; careerPath?: string };
            if (o.situation && o.careerPath) {
              ctx = `Your setup: ${o.situation} · ${o.careerPath}. `;
            }
          } catch {
            /* ignore */
          }
        }
        const n = this.countCompletedSessions(p.assessmentSkillsJson);
        this.level = retakeCountToLevel(n);
        if (n > 0) {
          this.adaptiveHint.set(
            ctx +
              `Adaptive difficulty: ${n} completed run(s) → level ${this.level}. Retakes increase challenge.`
          );
        } else if (ctx) {
          this.adaptiveHint.set(ctx + 'Tasks and quiz are aligned with this focus.');
        }
      },
      error: () => {
        this.level = 'JUNIOR';
        const sk = q.get('skill');
        if (sk?.trim()) {
          this.skill = sk.trim().toUpperCase();
        }
      },
    });
  }

  private countCompletedSessions(raw: string | null | undefined): number {
    if (!raw?.trim()) return 0;
    try {
      const o = JSON.parse(raw) as Record<string, unknown>;
      return Object.keys(o).filter((k) => k.startsWith('codingSession_')).length;
    } catch {
      return 0;
    }
  }

  start(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .start({
        userId: ASSESSMENT_PLACEHOLDER_USER_ID,
        skill: this.skill.trim() || 'FULLSTACK',
        level: this.level,
        tracks: this.tracks,
        codingTaskCount: this.codingCount,
        quizQuestionCount: this.quizCount,
        languageQuestionCount: 0,
        timeLimitSeconds: this.timeLimitSec ?? undefined,
      })
      .subscribe({
        next: (s) => {
          this.loading.set(false);
          const sid = s.id ?? s.sessionId;
          if (sid == null || Number.isNaN(Number(sid))) {
            this.error.set('Invalid session id from server.');
            return;
          }
          void this.router.navigate(['/dashboard/assessment/unified', String(sid)]);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.error.set(this.msg(err));
        },
      });
  }

  private msg(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? String(err.status);
    }
    return err instanceof Error ? err.message : 'Request failed';
  }
}
