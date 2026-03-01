import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StepSituationComponent } from './steps/step-situation.component';
import { StepCareerGoalComponent } from './steps/step-career-goal.component';
import { StepSkillCheckComponent } from './steps/step-skill-check.component';
import { StepResultsComponent } from './steps/step-results.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StepSituationComponent,
    StepCareerGoalComponent,
    StepSkillCheckComponent,
    StepResultsComponent,
  ],
  template: `
    <!-- ────────────── HEADER ────────────── -->
    <header class="ob-header">
      <div class="ob-header__inner">
        <a routerLink="/" class="ob-header__logo">
          <span class="ob-header__logo-text">SmartHire</span>
        </a>

        <div class="ob-header__right">
          <span class="ob-header__step">
            <span class="ob-header__step-num">Step {{ currentStep() }}</span>
            <span class="ob-header__step-of"> of {{ totalSteps }}</span>
          </span>
          @if (currentStep() <= 2) {
            <a class="ob-header__skip" (click)="skip()">Skip for now &rarr;</a>
          }
        </div>
      </div>
    </header>

    <!-- ────────────── STEPPER ────────────── -->
    <div class="ob-stepper-wrap">
      <div class="ob-stepper">
        @for (s of stepMeta; track s.num; let i = $index; let last = $last) {
          <!-- Node -->
          <div class="ob-stepper__node-group">
            <div
              class="ob-stepper__node"
              [class.ob-stepper__node--active]="currentStep() === s.num"
              [class.ob-stepper__node--done]="currentStep() > s.num"
            >
              @if (currentStep() > s.num) {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              } @else {
                <span>{{ s.num }}</span>
              }
            </div>
            <span
              class="ob-stepper__label"
              [class.ob-stepper__label--active]="currentStep() === s.num"
              [class.ob-stepper__label--done]="currentStep() > s.num"
            >{{ s.label }}</span>
          </div>

          <!-- Connector -->
          @if (!last) {
            <div class="ob-stepper__line-wrap">
              <div
                class="ob-stepper__line"
                [class.ob-stepper__line--done]="currentStep() > s.num"
              ></div>
            </div>
          }
        }
      </div>
    </div>

    <!-- ────────────── CONTENT ────────────── -->
    <main class="ob-content" [class.ob-content--results]="currentStep() === 4">
      @switch (currentStep()) {
        @case (1) {
          <app-step-situation
            [selected]="situationSelection()"
            (selectionChange)="situationSelection.set($event)"
          />
        }
        @case (2) {
          <app-step-career-goal
            [selected]="careerSelection()"
            (selectionChange)="careerSelection.set($event)"
          />
        }
        @case (3) {
          <app-step-skill-check
            [currentQuestion]="currentQuestion"
            [selectedAnswer]="currentAnswer"
            (answerSelected)="onAnswerSelected($event)"
          />
        }
        @case (4) {
          <app-step-results />
        }
      }
    </main>

    <!-- ────────────── FOOTER ────────────── -->
    @if (currentStep() < 4) {
      <footer class="ob-footer">
        <div class="ob-footer__inner">
          <!-- Back -->
          @if (currentStep() > 1) {
            <button class="ob-footer__back" (click)="goBack()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
          } @else {
            <div></div>
          }

          <!-- Center hint -->
          <span class="ob-footer__hint">Your progress is saved automatically</span>

          <!-- Next -->
          <button
            class="ob-footer__next"
            [disabled]="!canProceed()"
            (click)="goNext()"
          >
            {{ nextLabel() }}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </footer>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: var(--bg-primary);
    }

    /* ═══════════════════ HEADER ═══════════════════ */
    .ob-header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(10, 10, 15, 0.75);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(46, 232, 165, 0.18);
    }

    .ob-header__inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 24px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .ob-header__logo {
      text-decoration: none;
    }

    .ob-header__logo-text {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 20px;
      background: linear-gradient(135deg, #2ee8a5, #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .ob-header__right {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .ob-header__step {
      font-size: 13px;
    }
    .ob-header__step-num {
      color: var(--text-primary);
      font-weight: 600;
    }
    .ob-header__step-of {
      color: var(--text-muted);
    }

    .ob-header__skip {
      font-size: 13px;
      color: var(--text-muted);
      cursor: pointer;
      transition: color 0.2s;
      text-decoration: none;
    }
    .ob-header__skip:hover {
      color: var(--text-secondary);
    }

    /* ═══════════════════ STEPPER ═══════════════════ */
    .ob-stepper-wrap {
      display: flex;
      justify-content: center;
      padding: 28px 24px;
    }

    .ob-stepper {
      display: flex;
      align-items: flex-start;
      gap: 0;
    }

    .ob-stepper__node-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      min-width: 80px;
    }

    .ob-stepper__node {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1.5px solid var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      background: transparent;
      transition: all 0.35s ease;
    }

    .ob-stepper__node--active {
      border-color: var(--accent-teal);
      color: var(--accent-teal);
      box-shadow: 0 0 0 4px rgba(46, 232, 165, 0.12), 0 0 12px rgba(46, 232, 165, 0.1);
    }

    .ob-stepper__node--done {
      border-color: var(--accent-teal);
      background: var(--accent-teal);
      color: var(--bg-primary);
    }

    .ob-stepper__label {
      font-size: 11px;
      color: var(--text-muted);
      transition: color 0.3s;
      white-space: nowrap;
    }
    .ob-stepper__label--active {
      color: var(--accent-teal);
    }
    .ob-stepper__label--done {
      color: var(--text-secondary);
    }

    .ob-stepper__line-wrap {
      display: flex;
      align-items: center;
      padding-top: 15px;                  /* vertically center with node */
      width: 64px;
      flex-shrink: 0;
    }

    .ob-stepper__line {
      width: 100%;
      height: 1px;
      background: var(--border-subtle);
      position: relative;
      overflow: hidden;
      transition: background 0.4s ease;
    }
    .ob-stepper__line--done {
      background: var(--accent-teal);
    }

    /* ═══════════════════ CONTENT ═══════════════════ */
    .ob-content {
      flex: 1;
      padding: 20px 24px 120px;           /* 120 = footer height buffer */
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
    }
    .ob-content--results {
      padding-bottom: 60px;
    }

    /* ═══════════════════ FOOTER ═══════════════════ */
    .ob-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 40;
      background: rgba(10, 10, 15, 0.85);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-top: 1px solid var(--border-subtle);
    }

    .ob-footer__inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .ob-footer__back {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      background: transparent;
      color: var(--text-muted);
      font-size: 14px;
      font-weight: 500;
      font-family: var(--font-sans);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.25s ease;
    }
    .ob-footer__back:hover {
      border-color: var(--text-muted);
      color: var(--text-secondary);
    }

    .ob-footer__hint {
      font-size: 11px;
      color: var(--text-muted);
    }

    .ob-footer__next {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 11px 24px;
      background: linear-gradient(135deg, #2ee8a5, #10b981);
      color: var(--bg-primary);
      font-family: var(--font-sans);
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .ob-footer__next:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(46, 232, 165, 0.25);
    }
    .ob-footer__next:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* ═══════════════════ RESPONSIVE ═══════════════════ */
    @media (max-width: 640px) {
      .ob-stepper__line-wrap { width: 32px; }
      .ob-stepper__node-group { min-width: 60px; }
      .ob-footer__hint { display: none; }
    }
  `]
})
export class OnboardingComponent {
  totalSteps = 4;

  currentStep  = signal(1);

  /* Step 1 */
  situationSelection = signal<string | null>(null);
  /* Step 2 */
  careerSelection = signal<string | null>(null);
  /* Step 3 */
  currentQuestion = signal(0);
  currentAnswer   = signal<string | null>(null);
  answers: (string | null)[] = [null, null, null, null, null];

  stepMeta = [
    { num: 1, label: 'Who you are' },
    { num: 2, label: 'Career goal' },
    { num: 3, label: 'Skill check' },
    { num: 4, label: 'Your profile' },
  ];

  canProceed = computed(() => {
    const step = this.currentStep();
    if (step === 1) return this.situationSelection() !== null;
    if (step === 2) return this.careerSelection() !== null;
    if (step === 3) return this.currentAnswer() !== null;
    return false;
  });

  nextLabel = computed(() => {
    const step = this.currentStep();
    if (step === 3) {
      return this.currentQuestion() >= 4 ? 'See My Results' : 'Next Question';
    }
    return 'Next';
  });

  goNext(): void {
    const step = this.currentStep();

    if (step === 3) {
      // Save answer
      const qi = this.currentQuestion();
      this.answers[qi] = this.currentAnswer();

      if (qi < 4) {
        this.currentQuestion.set(qi + 1);
        this.currentAnswer.set(null);
        return;
      }
      // Last question → go to results
    }

    if (step < this.totalSteps) {
      this.currentStep.set(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goBack(): void {
    const step = this.currentStep();
    if (step === 3 && this.currentQuestion() > 0) {
      const qi = this.currentQuestion();
      this.currentQuestion.set(qi - 1);
      this.currentAnswer.set(this.answers[qi - 1]);
      return;
    }
    if (step > 1) {
      this.currentStep.set(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  skip(): void {
    const step = this.currentStep();
    if (step <= 2) {
      this.currentStep.set(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onAnswerSelected(letter: string): void {
    this.currentAnswer.set(letter);
  }
}
