import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StepSituationComponent } from './steps/step-situation.component';
import { StepCareerGoalComponent } from './steps/step-career-goal.component';
import { StepSkillCheckComponent } from './steps/step-skill-check.component';
import { StepResultsComponent } from './steps/step-results.component';
import { LUCIDE_ICONS } from '../../../shared/lucide-icons';

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
    LUCIDE_ICONS,
  ],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss'
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
