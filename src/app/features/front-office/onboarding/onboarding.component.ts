import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { isLocalDemoMode } from '../profile/profile-user-id';
import { StepSituationComponent } from './steps/step-situation.component';
import { StepCareerGoalComponent } from './steps/step-career-goal.component';
import { LUCIDE_ICONS } from '../../../shared/lucide-icons';
import { ProfileApiService } from '../profile/profile-api.service';
import { getUserRoleFromToken, getUserDataFromToken } from '../profile/profile-user-id';
import { CandidateAssignmentApiService } from '../assessments/candidate-assignment-api.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, RouterLink, StepSituationComponent, StepCareerGoalComponent, LUCIDE_ICONS],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent implements OnInit {
  totalSteps = 2;

  localDemoBanner = signal(false);

  currentStep = signal(1);

  situationSelection = signal<string | null>(null);
  careerSelection = signal<string | null>(null);
  customSituation = signal<string>('');
  customCareerPath = signal<string>('');

  stepMeta = [
    { num: 1, label: 'Who you are' },
    { num: 2, label: 'Your target' },
  ];

  saving = signal(false);
  saveError = signal<string | null>(null);

  constructor(
    private readonly profileApi: ProfileApiService,
    private readonly assignmentApi: CandidateAssignmentApiService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.localDemoBanner.set(isLocalDemoMode());
  }

  canProceed = computed(() => {
    const step = this.currentStep();
    if (step === 1) {
      const situation = this.situationSelection();
      if (!situation) return false;
      if (situation === 'other') return this.customSituation().trim().length > 0;
      return true;
    }
    if (step === 2) {
      const career = this.careerSelection();
      if (!career) return false;
      if (career === 'other') return this.customCareerPath().trim().length > 0;
      return true;
    }
    return false;
  });

  goNext(): void {
    const step = this.currentStep();
    if (step === 1) {
      this.currentStep.set(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (step === 2) {
      void this.savePreferencesAndFinish();
    }
  }

  goBack(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  skip(): void {
    if (this.currentStep() === 1) {
      this.currentStep.set(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private savePreferencesAndFinish(): void {
    const situation = this.situationSelection() || 'student';
    const careerPath = this.careerSelection() || 'fullstack';
    const customSit = this.customSituation();
    const customCareer = this.customCareerPath();

    // Get headline from local profile (set during registration)
    const localProfile = localStorage.getItem('smarthire_local_profile');
    let headline = '';
    if (localProfile) {
      try {
        const profile = JSON.parse(localProfile);
        headline = profile.headline || '';
      } catch (e) {
        console.warn('Could not parse local profile for headline');
      }
    }

    // Get user data from existing JWT token structure (without modifying auth system)
    const userData = getUserDataFromToken();
    const userRole = getUserRoleFromToken();

    if (!userData?.id) {
      this.saveError.set('User not authenticated. Please login again.');
      this.saving.set(false);
      return;
    }

    this.saveError.set(null);
    this.saving.set(true);

    if (userRole === 'recruiter') {
      // For recruiters, try to save to MS-User profile service, but continue even if it fails
      this.profileApi
        .completeOnboarding({
          situation,
          careerPath,
          answers: [],
          skillScores: {},
          developmentPlanNotes: 'Preferences saved. You can extend your profile from the dashboard.',
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            void this.router.navigate(['/dashboard']);
          },
          error: () => {
            // MS-User service not available, but continue anyway for recruiters
            console.warn('MS-User service not available, continuing without profile save');
            this.saving.set(false);
            void this.router.navigate(['/dashboard']);
          },
        });
      return;
    }

    // For candidates, register directly with assessment service using MS-User ID
    const userId = userData.id;
    this.assignmentApi.register(userId, situation, careerPath, headline, customSit, customCareer).subscribe({
      next: () => {
        // Try to save to MS-User profile service as well, but don't block on failure
        this.profileApi
          .completeOnboarding({
            situation,
            careerPath,
            answers: [],
            skillScores: {},
            developmentPlanNotes: 'Preferences saved. You can extend your profile from the dashboard.',
          })
          .subscribe({
            next: () => {
              console.log('Profile also saved to MS-User service');
            },
            error: () => {
              console.warn('MS-User service not available, but assessment registration succeeded');
            },
          });
        
        this.saving.set(false);
        void this.router.navigate(['login']);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        const msg =
          err && typeof err === 'object' && 'error' in err
            ? JSON.stringify((err as { error: unknown }).error)
            : 'Could not register for assessments. Is MS-Assessment service running?';
        this.saveError.set(msg);
      },
    });
  }
}
