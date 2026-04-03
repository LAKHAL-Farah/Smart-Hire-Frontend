import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';
import {
  ProfileApiService,
  ProfileApiResponse,
} from '../../profile/profile-api.service';

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
  assessmentSnap = signal<Record<string, unknown> | null>(null);

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
    return 'Set your goals in onboarding, then complete an assessment to build your profile';
  });

  displayLocation = computed(() => this.apiProfile()?.location?.trim() ?? '');

  /** Skill levels come from assessments only (onboarding no longer runs a skill quiz). */
  mergedSkillRows = computed(() => {
    const assess = this.assessmentSnap();
    let fromAssess: Record<string, number> = {};
    const summary = assess?.['lastAssessmentSummary'];
    if (summary && typeof summary === 'object' && summary !== null && 'skills' in summary) {
      const sk = (summary as { skills?: Record<string, number> }).skills;
      if (sk && typeof sk === 'object') fromAssess = { ...sk };
    }
    if (assess) {
      for (const [k, v] of Object.entries(assess)) {
        if (!k.startsWith('codingSession_') || !v || typeof v !== 'object') continue;
        const sk = (v as { skills?: Record<string, number> }).skills;
        if (!sk || typeof sk !== 'object') continue;
        for (const [skillName, val] of Object.entries(sk)) {
          const n = Number(val);
          if (!Number.isFinite(n)) continue;
          fromAssess[skillName] = Math.max(fromAssess[skillName] ?? 0, n);
        }
      }
    }
    const rows: { name: string; level: number }[] = Object.entries(fromAssess).map(([name, level]) => ({
      name,
      level: Math.min(100, Math.round(level)),
    }));
    rows.sort((x, y) => y.level - x.level);
    if (rows.length === 0) {
      return this.skillGroups.flatMap((g) => g.skills.map((s) => ({ name: s.name, level: s.level })));
    }
    return rows;
  });

  skillGroupsForSidebar = computed(() => {
    const snap = this.assessmentSnap();
    const hasAsm =
      !!snap?.['lastAssessmentSummary'] ||
      !!(snap && Object.keys(snap).some((k) => k.startsWith('codingSession_')));
    if (!hasAsm) return this.skillGroups;
    const rows = this.mergedSkillRows();
    return [{ category: 'Your skills (from assessments)', skills: rows.map((r) => ({ ...r })) }];
  });

  readinessPct = computed(() => {
    const snap = this.assessmentSnap();
    const hasAsm =
      !!snap?.['lastAssessmentSummary'] ||
      !!(snap && Object.keys(snap).some((k) => k.startsWith('codingSession_')));
    if (!hasAsm) return 72;
    const rows = this.mergedSkillRows();
    if (!rows.length) return 72;
    const avg = rows.reduce((s, r) => s + r.level, 0) / rows.length;
    return Math.round(avg);
  });

  developmentPlanText = computed(() => {
    const n = this.onboardingSnap()?.developmentPlanNotes?.trim();
    if (n) return n;
    const s = this.assessmentSnap()?.['lastAssessmentSummary'];
    if (s && typeof s === 'object' && s !== null) {
      const strengths = (s as { strengths?: string[] }).strengths;
      const weaknesses = (s as { weaknesses?: string[] }).weaknesses;
      if (strengths?.length || weaknesses?.length) {
        const parts: string[] = [];
        if (strengths?.length) parts.push('Strengths: ' + strengths.join(', ') + '.');
        if (weaknesses?.length) parts.push('Focus next: ' + weaknesses.join(', ') + '.');
        return parts.join(' ');
      }
    }
    return '';
  });

  radarAxesLive = computed((): { label: string; value: number }[] => {
    const rows = this.mergedSkillRows();
    if (rows.length < 3) return this.radarAxes;
    const mapped = rows.slice(0, 6).map((r) => ({ label: r.name, value: r.level }));
    while (mapped.length < 6) {
      mapped.push({ label: '—', value: 45 });
    }
    return mapped;
  });

  radarPointsStr = computed(() => {
    const axes = this.radarAxesLive();
    const n = axes.length;
    return axes
      .map((a, i) => {
        const x = 150 + a.value * 1.2 * this.cos(i, n);
        const y = 150 + a.value * 1.2 * this.sin(i, n);
        return `${x},${y}`;
      })
      .join(' ');
  });

  scoreHistoryLive = computed(() => {
    const assess = this.assessmentSnap();
    const base = [...this.scoreHistory];
    if (!assess) return base;
    for (const [k, v] of Object.entries(assess)) {
      if (!k.startsWith('codingSession_')) continue;
      if (!v || typeof v !== 'object') continue;
      const obj = v as { overallScore?: number; at?: string };
      if (typeof obj.overallScore !== 'number') continue;
      base.push({
        date: obj.at ? new Date(obj.at).toLocaleDateString() : k.replace('codingSession_', 'Session '),
        score: Math.min(100, Math.round(obj.overallScore)),
      });
    }
    return base.slice(-12);
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.profileLoading.set(true);
    this.profileError.set(null);
    this.profileApi.getProfile().subscribe({
      next: (p) => {
        this.apiProfile.set(p);
        this.onboardingSnap.set(this.parseOnboarding(p.onboardingJson));
        this.assessmentSnap.set(this.parseAssessment(p.assessmentSkillsJson));
        this.profileLoading.set(false);
      },
      error: () => {
        this.profileLoading.set(false);
        this.profileError.set(
          'Could not load your profile from MS-User. Ensure the service is running (port 8082) and you are logged in.'
        );
      },
    });
  }

  private parseOnboarding(raw: string | null | undefined): OnboardingSnapshot | null {
    if (!raw?.trim()) return null;
    try {
      return JSON.parse(raw) as OnboardingSnapshot;
    } catch {
      return null;
    }
  }

  private parseAssessment(raw: string | null | undefined): Record<string, unknown> | null {
    if (!raw?.trim()) return null;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  cos(i: number, n = 6): number {
    return Math.cos((Math.PI * 2 * i) / n - Math.PI / 2);
  }

  sin(i: number, n = 6): number {
    return Math.sin((Math.PI * 2 * i) / n - Math.PI / 2);
  }

  getHexPoints(cx: number, cy: number, r: number): string {
    return Array.from({ length: 6 }, (_, i) => {
      const x = cx + r * Math.cos((Math.PI * 2 * i) / 6 - Math.PI / 2);
      const y = cy + r * Math.sin((Math.PI * 2 * i) / 6 - Math.PI / 2);
      return `${x},${y}`;
    }).join(' ');
  }
}
