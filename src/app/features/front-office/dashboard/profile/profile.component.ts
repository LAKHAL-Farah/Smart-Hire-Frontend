import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';
import { ProfileApiResponse, ProfileApiService } from '../../profile/profile-api.service';
import {
  CvVersionDto,
  GitHubRepositoryDto,
  ProfileOptimizationApiService,
  ProfileOptimizationSnapshot,
  ProfileTipDto,
} from '../../profile/profile-optimization-api.service';

type ProfileTab = 'overview' | 'cv' | 'linkedin' | 'github' | 'tips';

interface OnboardingSnapshot {
  situation?: string;
  careerPath?: string;
  developmentPlanNotes?: string;
  completedAt?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LUCIDE_ICONS],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly profileApi = inject(ProfileApiService);
  private readonly optimizationApi = inject(ProfileOptimizationApiService);

  activeTab = signal<ProfileTab>('overview');
  tabs: { id: ProfileTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'cv', label: 'Smart CV' },
    { id: 'linkedin', label: 'LinkedIn Score' },
    { id: 'github', label: 'GitHub Audit' },
    { id: 'tips', label: 'Action Plan' },
  ];

  apiProfile = signal<ProfileApiResponse | null>(null);
  onboardingSnap = signal<OnboardingSnapshot | null>(null);
  optimization = signal<ProfileOptimizationSnapshot | null>(null);

  profileLoading = signal(true);
  optimizationLoading = signal(true);
  profileError = signal<string | null>(null);
  optimizationError = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  actionError = signal<string | null>(null);
  busyAction = signal<'cv' | 'linkedin' | 'github' | null>(null);

  ringCircum = 2 * Math.PI * 42;

  cvJobTitle = 'Senior Full-stack Engineer';
  cvCompany = 'Target company';
  cvSourceUrl = '';
  cvJobOfferText = '';
  linkedinTargetRole = 'Senior Full-stack Engineer';
  githubUsername = '';

  displayName = computed(() => {
    const profile = this.apiProfile();
    if (profile?.firstName || profile?.lastName) {
      return [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    }
    return 'Candidate profile';
  });

  displayInitials = computed(() => {
    const profile = this.apiProfile();
    const initials = `${profile?.firstName?.charAt(0) ?? ''}${profile?.lastName?.charAt(0) ?? ''}`.toUpperCase();
    return initials || 'SH';
  });

  displayHeadline = computed(() => {
    const profile = this.apiProfile();
    if (profile?.headline?.trim()) {
      return profile.headline;
    }
    return this.optimization()?.linkedin.optimizedHeadline || 'Professional makeover engine ready for optimization';
  });

  displayLocation = computed(() => this.apiProfile()?.location?.trim() ?? '');
  readinessPct = computed(() => this.optimization()?.readiness.globalScore ?? 0);

  scoreCards = computed(() => {
    const snapshot = this.optimization();
    if (!snapshot) {
      return [] as { label: string; score: number; icon: string; hint: string }[];
    }
    return [
      {
        label: 'CV',
        score: snapshot.readiness.cvScore ?? 0,
        icon: 'file-text',
        hint: `${snapshot.activeCvScore.keywordMatchRate}% keyword match`,
      },
      {
        label: 'LinkedIn',
        score: snapshot.readiness.linkedinScore ?? 0,
        icon: 'linkedin',
        hint: `${this.linkedinSectionRows().length} sections analyzed`,
      },
      {
        label: 'GitHub',
        score: snapshot.readiness.githubScore ?? 0,
        icon: 'github',
        hint: `${snapshot.github.repoCount ?? 0} repos audited`,
      },
    ];
  });

  activeCv = computed(() => {
    const snapshot = this.optimization();
    if (!snapshot) {
      return null;
    }
    return snapshot.cvs.find((cv) => cv.isActive) ?? snapshot.cvs[0] ?? null;
  });

  activeCvVersions = computed(() => {
    const snapshot = this.optimization();
    const cv = this.activeCv();
    if (!snapshot || !cv) {
      return [] as CvVersionDto[];
    }
    return snapshot.versionsByCvId[cv.id] ?? [];
  });

  latestCvVersion = computed(() => this.activeCvVersions()[0] ?? null);

  linkedinSectionRows = computed(() => {
    const sections = this.optimization()?.linkedin.sectionScores ?? {};
    return Object.entries(sections).map(([section, score]) => ({
      section: this.toTitleCase(section),
      score,
    }));
  });

  githubLanguages = computed(() => this.optimization()?.github.topLanguages ?? []);
  githubRepositories = computed(() => this.optimization()?.github.repositories ?? []);

  topTips = computed(() => {
    const tips = [...(this.optimization()?.tips ?? [])];
    return tips.sort((a, b) => this.tipPriorityWeight(b.priority) - this.tipPriorityWeight(a.priority)).slice(0, 4);
  });

  unresolvedTips = computed(() => (this.optimization()?.tips ?? []).filter((tip) => !tip.isResolved));

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.profileLoading.set(true);
    this.profileError.set(null);
    this.profileApi.getProfile().subscribe({
      next: (profile) => {
        this.apiProfile.set(profile);
        this.onboardingSnap.set(this.parseOnboarding(profile.onboardingJson));
        this.profileLoading.set(false);
        this.loadOptimization(profile);
      },
      error: () => {
        this.profileLoading.set(false);
        this.profileError.set(
          'Could not load your user profile from MS-User. The M4 module will use local demo data until the profile service is reachable.'
        );
        this.loadOptimization(null);
      },
    });
  }

  loadOptimization(profile: ProfileApiResponse | null): void {
    this.optimizationLoading.set(true);
    this.optimizationError.set(null);
    this.optimizationApi
      .getSnapshot(profile?.userId, {
        linkedinUrl: profile?.linkedinUrl,
        githubUrl: profile?.githubUrl,
      })
      .subscribe({
        next: (snapshot) => {
          this.optimization.set(snapshot);
          this.optimizationLoading.set(false);
          this.cvJobTitle = snapshot.latestJobOffer?.title ?? this.cvJobTitle;
          this.cvCompany = snapshot.latestJobOffer?.company ?? this.cvCompany;
          this.cvSourceUrl = snapshot.latestJobOffer?.sourceUrl ?? this.cvSourceUrl;
          this.cvJobOfferText = snapshot.latestJobOffer?.rawDescription ?? this.cvJobOfferText;
          this.githubUsername = snapshot.github.githubUsername || this.extractGithubUsername(profile?.githubUrl) || '';
        },
        error: () => {
          this.optimizationLoading.set(false);
          this.optimizationError.set('Could not load profile optimization data. Check the M4 service configuration and try again.');
        },
      });
  }

  tailorCv(): void {
    const cv = this.activeCv();
    if (!cv || !this.cvJobOfferText.trim()) {
      this.actionError.set('Select a CV and provide a target job offer before running Smart CV tailoring.');
      return;
    }
    this.busyAction.set('cv');
    this.actionError.set(null);
    this.actionMessage.set(null);
    this.optimizationApi
      .tailorCv({
        cvId: cv.id,
        jobOfferTitle: this.cvJobTitle,
        company: this.cvCompany,
        sourceUrl: this.cvSourceUrl || undefined,
        jobOfferText: this.cvJobOfferText,
      })
      .subscribe({
        next: () => {
          this.busyAction.set(null);
          this.actionMessage.set('Smart CV tailoring finished. The ATS score and version history were refreshed.');
          this.loadOptimization(this.apiProfile());
          this.activeTab.set('cv');
        },
        error: () => {
          this.busyAction.set(null);
          this.actionError.set('CV tailoring failed. Verify that the M4 backend endpoint /cv/tailor is available.');
        },
      });
  }

  analyzeLinkedin(): void {
    const profileUrl = this.apiProfile()?.linkedinUrl?.trim() ?? this.optimization()?.linkedin.profileUrl ?? '';
    if (!profileUrl) {
      this.actionError.set('No LinkedIn URL is available yet. Add one to the profile service before running analysis.');
      return;
    }
    this.busyAction.set('linkedin');
    this.actionError.set(null);
    this.actionMessage.set(null);
    this.optimizationApi
      .analyzeLinkedIn({
        userId: this.apiProfile()?.userId,
        profileUrl,
        targetRole: this.linkedinTargetRole,
      })
      .subscribe({
        next: (result) => {
          this.busyAction.set(null);
          this.actionMessage.set(`LinkedIn analysis completed with score ${result.globalScore ?? 0}/100.`);
          this.loadOptimization(this.apiProfile());
          this.activeTab.set('linkedin');
        },
        error: () => {
          this.busyAction.set(null);
          this.actionError.set('LinkedIn analysis failed. Verify that the M4 backend endpoint /linkedin/analyze is available.');
        },
      });
  }

  auditGithub(): void {
    const username = this.githubUsername.trim() || this.extractGithubUsername(this.apiProfile()?.githubUrl);
    if (!username) {
      this.actionError.set('No GitHub username could be resolved. Add a GitHub profile URL or enter a username.');
      return;
    }
    this.busyAction.set('github');
    this.actionError.set(null);
    this.actionMessage.set(null);
    this.optimizationApi.auditGithub(username, this.apiProfile()?.userId).subscribe({
      next: (result) => {
        this.busyAction.set(null);
        this.githubUsername = result.githubUsername;
        this.actionMessage.set(`GitHub audit completed for ${result.githubUsername}.`);
        this.loadOptimization(this.apiProfile());
        this.activeTab.set('github');
      },
      error: () => {
        this.busyAction.set(null);
        this.actionError.set('GitHub audit failed. Verify that the M4 backend endpoint /github/audit/{username} is available.');
      },
    });
  }

  scoreTone(score: number | null | undefined): 'high' | 'mid' | 'low' {
    const value = score ?? 0;
    if (value >= 80) {
      return 'high';
    }
    if (value >= 60) {
      return 'mid';
    }
    return 'low';
  }

  profileTypeLabel(type: ProfileTipDto['profileType']): string {
    if (type === 'CV') {
      return 'Smart CV';
    }
    if (type === 'LINKEDIN') {
      return 'LinkedIn';
    }
    return 'GitHub';
  }

  trackRepo(_: number, repo: GitHubRepositoryDto): string {
    return repo.id;
  }

  private parseOnboarding(raw: string | null | undefined): OnboardingSnapshot | null {
    if (!raw?.trim()) {
      return null;
    }
    try {
      return JSON.parse(raw) as OnboardingSnapshot;
    } catch {
      return null;
    }
  }

  private extractGithubUsername(url?: string | null): string {
    const match = url?.match(/github\.com\/([^/?#]+)/i);
    return match?.[1] ?? '';
  }

  private toTitleCase(value: string): string {
    return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private tipPriorityWeight(priority: ProfileTipDto['priority']): number {
    if (priority === 'HIGH') {
      return 3;
    }
    if (priority === 'MEDIUM') {
      return 2;
    }
    return 1;
  }
}