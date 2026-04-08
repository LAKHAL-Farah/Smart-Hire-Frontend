import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';
import {
  ProfileApiService,
  ProfileApiResponse,
} from '../../profile/profile-api.service';
import {
  CandidateSessionApiService,
  isSessionCompleted,
  isSessionPublished,
  SessionResponseDto,
} from '../../assessments/candidate-session-api.service';
import { CandidateAssignmentApiService } from '../../assessments/candidate-assignment-api.service';
import { collectCandidateUserIdsForSessions } from '../../assessments/assessment-canonical-user';
import { getAssessmentUserId } from '../../profile/profile-user-id';

type ProfileTab = 'overview' | 'experience' | 'projects' | 'assessments';

interface OnboardingSnapshot {
  situation?: string;
  careerPath?: string;
  answers?: string[];
  skillScores?: Record<string, number>;
  preferencesOnly?: boolean;
  developmentPlanNotes?: string;
  completedAt?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, LUCIDE_ICONS],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly profileApi = inject(ProfileApiService);
  private readonly sessionApi = inject(CandidateSessionApiService);
  private readonly assignmentApi = inject(CandidateAssignmentApiService);

  activeTab = signal<ProfileTab>('overview');
  tabs: { id: ProfileTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'assessments', label: 'Assessments' },
  ];

  apiProfile = signal<ProfileApiResponse | null>(null);
  profileLoading = signal(true);
  profileError = signal<string | null>(null);
  onboardingSnap = signal<OnboardingSnapshot | null>(null);
  /** Live from MS-Assessment — drives skill bars & readiness */
  assessmentSessions = signal<SessionResponseDto[]>([]);

  ringCircum = 2 * Math.PI * 42;

  skillGroups = [
    {
      category: 'Frontend',
      skills: [
        { name: 'Angular', level: 88 },
        { name: 'React', level: 72 },
        { name: 'TypeScript', level: 90 },
      ],
    },
    {
      category: 'Backend',
      skills: [
        { name: 'Node.js', level: 82 },
        { name: 'Python', level: 60 },
        { name: 'PostgreSQL', level: 75 },
      ],
    },
    {
      category: 'DevOps',
      skills: [
        { name: 'Docker', level: 70 },
        { name: 'AWS', level: 55 },
        { name: 'CI/CD', level: 65 },
      ],
    },
  ];

  badges = [
    { name: 'Early Adopter', icon: '🚀' },
    { name: 'Code Streak 30', icon: '🔥' },
    { name: 'Quiz Master', icon: '🧠' },
    { name: 'Profile Complete', icon: '✅' },
    { name: 'Open Source', icon: '💎' },
    { name: 'Team Player', icon: '🤝' },
  ];

  languages = [
    { name: 'TypeScript', pct: 42, color: '#3178c6' },
    { name: 'Python', pct: 22, color: '#3572A5' },
    { name: 'JavaScript', pct: 18, color: '#f1e05a' },
    { name: 'SCSS', pct: 10, color: '#c6538c' },
    { name: 'Go', pct: 8, color: '#00ADD8' },
  ];

  topRepos = [
    { name: 'smarthire-platform', stars: 234, lang: 'TypeScript', color: '#3178c6' },
    { name: 'devsync-editor', stars: 189, lang: 'TypeScript', color: '#3178c6' },
    { name: 'ml-pipeline-utils', stars: 97, lang: 'Python', color: '#3572A5' },
    { name: 'infra-terraform', stars: 54, lang: 'Go', color: '#00ADD8' },
  ];

  linkedinScores = [
    { section: 'Headline', score: 90 },
    { section: 'Summary', score: 78 },
    { section: 'Experience', score: 85 },
    { section: 'Skills', score: 65 },
    { section: 'Education', score: 92 },
  ];

  experiences = [
    {
      company: 'TechCorp',
      role: 'Software Engineer',
      dateRange: 'Mar 2023 – Present',
      bullets: [
        'Architected microservices processing 50k+ daily requests',
        'Led monolith-to-event-driven migration reducing latency 60%',
        'Reduced CI/CD pipeline time by 40% via parallel test execution',
      ],
    },
    {
      company: 'StartupXYZ',
      role: 'Junior Developer',
      dateRange: 'Jun 2021 – Feb 2023',
      bullets: [
        'Built RESTful APIs and React dashboards for internal tools',
        'Increased code coverage from 30% to 85% with automated tests',
        'Implemented OAuth2 login flow serving 12k+ users',
      ],
    },
    {
      company: 'University of Technology',
      role: 'Teaching Assistant — CS301',
      dateRange: 'Sep 2020 – May 2021',
      bullets: [
        'Led labs for Distributed Systems course (40 students)',
        'Authored automated grading scripts in Python',
      ],
    },
  ];

  projects = [
    { name: 'SmartHire Platform', techStack: ['Angular', 'NestJS', 'PostgreSQL', 'Docker'], aiScore: 88 },
    { name: 'DevSync Editor', techStack: ['TypeScript', 'WebSockets', 'OT', 'Redis'], aiScore: 82 },
    { name: 'ML Pipeline Utils', techStack: ['Python', 'PyTorch', 'FastAPI', 'Docker'], aiScore: 71 },
    { name: 'Infra Terraform Modules', techStack: ['Terraform', 'AWS', 'Go'], aiScore: 64 },
    { name: 'CLI Task Runner', techStack: ['Go', 'Cobra', 'SQLite'], aiScore: 52 },
    { name: 'Portfolio Site', techStack: ['Next.js', 'Tailwind', 'Vercel'], aiScore: 45 },
  ];

  radarAxes = [
    { label: 'Frontend', value: 85 },
    { label: 'Backend', value: 72 },
    { label: 'DevOps', value: 58 },
    { label: 'Algorithms', value: 65 },
    { label: 'Databases', value: 75 },
    { label: 'Soft Skills', value: 80 },
  ];

  scoreHistory = [
    { date: 'Feb 20, 2026', score: 72 },
    { date: 'Jan 15, 2026', score: 65 },
    { date: 'Dec 10, 2025', score: 58 },
    { date: 'Nov 5, 2025', score: 52 },
    { date: 'Oct 1, 2025', score: 44 },
  ];

  displayName = computed(() => {
    const p = this.apiProfile();
    if (p?.firstName || p?.lastName) {
      return [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
    }
    return 'Your profile';
  });

  displayInitials = computed(() => {
    const p = this.apiProfile();
    const f = p?.firstName?.charAt(0) ?? '';
    const l = p?.lastName?.charAt(0) ?? '';
    const s = `${f}${l}`.toUpperCase();
    return s || '?';
  });

  displayHeadline = computed(() => {
    const p = this.apiProfile();
    if (p?.headline?.trim()) return p.headline;
    return 'Complete onboarding to personalize your headline';
  });

  displayLocation = computed(() => this.apiProfile()?.location?.trim() ?? '');

  skillGroupsForSidebar = computed(() => {
    const sessions = this.assessmentSessions().filter(
      (s) => isSessionCompleted(s) && isSessionPublished(s) && s.scorePercent != null
    );
    if (sessions.length === 0) {
      return this.skillGroups;
    }
    const bestByTitle = new Map<string, number>();
    for (const s of sessions) {
      const prev = bestByTitle.get(s.categoryTitle) ?? 0;
      bestByTitle.set(s.categoryTitle, Math.max(prev, s.scorePercent ?? 0));
    }
    const skills = [...bestByTitle.entries()].map(([name, level]) => ({ name, level }));
    return [{ category: 'Skill assessments', skills }];
  });

  readinessPct = computed(() => {
    const sessions = this.assessmentSessions().filter(
      (s) => isSessionCompleted(s) && isSessionPublished(s) && s.scorePercent != null
    );
    if (sessions.length === 0) {
      return 72;
    }
    const sum = sessions.reduce((a, s) => a + (s.scorePercent ?? 0), 0);
    return Math.round(sum / sessions.length);
  });

  /** Best score per category for the bar chart */
  skillBarRows = computed(() => {
    const sessions = this.assessmentSessions().filter(
      (s) => isSessionCompleted(s) && isSessionPublished(s) && s.scorePercent != null
    );
    const best = new Map<string, number>();
    for (const s of sessions) {
      const prev = best.get(s.categoryTitle) ?? 0;
      best.set(s.categoryTitle, Math.max(prev, s.scorePercent ?? 0));
    }
    return [...best.entries()].map(([categoryTitle, score]) => ({ categoryTitle, score }));
  });

  developmentPlanText = computed(() => {
    const n = this.onboardingSnap()?.developmentPlanNotes?.trim();
    if (n) return n;
    return '';
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.profileLoading.set(true);
    this.profileError.set(null);
    const baseUid = getAssessmentUserId();

    this.profileApi
      .getProfile()
      .pipe(
        switchMap((profile) => {
          if (!baseUid) {
            return of({ profile, sessions: [] as SessionResponseDto[] });
          }
          return this.assignmentApi.getStatus(baseUid).pipe(
            catchError((err: unknown) => {
              if (err instanceof HttpErrorResponse && err.status === 404) {
                return of(null);
              }
              return throwError(() => err);
            }),
            switchMap((plan) => {
              const ids = collectCandidateUserIdsForSessions(plan, baseUid);
              return this.sessionApi.listForUserMergedDistinct(ids).pipe(
                catchError(() => of([] as SessionResponseDto[])),
                map((sessions) => ({ profile, sessions }))
              );
            })
          );
        })
      )
      .subscribe({
        next: ({ profile, sessions }) => {
          this.apiProfile.set(profile);
          this.onboardingSnap.set(this.parseOnboarding(profile.onboardingJson));
          this.assessmentSessions.set(sessions);
          this.profileLoading.set(false);
          if (baseUid && sessions.length > 0) {
            const attempts = sessions
              .filter((s) => isSessionCompleted(s))
              .map((s) => ({
                sessionId: s.id,
                categoryTitle: s.categoryTitle,
                categoryCode: s.categoryCode ?? '',
                scorePercent: s.scorePercent,
                completedAt: s.completedAt,
                scoreReleased: s.scoreReleased,
                adminFeedback: s.adminFeedback ?? null,
              }));
            this.profileApi.syncSkillAssessments(baseUid, { attempts }).subscribe({ error: () => {} });
          }
        },
        error: () => {
          this.profileLoading.set(false);
          this.profileError.set(
            'Could not load your profile from MS-User. Ensure the service is running (port 8082) and you are logged in.'
          );
        },
      });
  }

  sessionCompleted(s: SessionResponseDto): boolean {
    return isSessionCompleted(s);
  }

  sessionPublished(s: SessionResponseDto): boolean {
    return isSessionPublished(s);
  }

  private parseOnboarding(raw: string | null | undefined): OnboardingSnapshot | null {
    if (!raw?.trim()) return null;
    try {
      return JSON.parse(raw) as OnboardingSnapshot;
    } catch {
      return null;
    }
  }
}
