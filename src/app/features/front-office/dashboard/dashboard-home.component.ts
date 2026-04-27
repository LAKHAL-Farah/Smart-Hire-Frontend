import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { LUCIDE_ICONS } from '../../../shared/lucide-icons';
import {
  MilestoneDto,
  NotificationDto,
  ProgressSummaryDto,
  RoadmapApiService,
  RoadmapNodeDto,
  RoadmapVisualResponse,
} from '../../../services/roadmap-api.service';
import { resolveRoadmapUserId } from './roadmap/roadmap-user-context';
import {
  CandidateSessionApiService,
  SessionResponseDto,
  isSessionCompleted,
  isSessionPublished,
} from '../assessments/candidate-session-api.service';
import { CandidateAssignmentApiService } from '../assessments/candidate-assignment-api.service';
import { SkillProfileApiService, SkillProfileDto } from '../assessments/skill-profile-api.service';
import { getMsUserIdFromToken } from '../profile/profile-user-id';
import { InterviewApiService } from './interview/interview-api.service';
import { JobService } from '../../../services/job.service';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface SkillGapItem {
  code: string;
  title: string;
  score: number;           // 0-100 from assessment
  roadmapCoverage: number; // 0-100 how much roadmap covers this
  gap: number;             // 100 - score = gap to fill
  color: string;
  status: 'strong' | 'learning' | 'gap';
}

interface LearningPathStep {
  id: number;
  title: string;
  status: 'done' | 'active' | 'next' | 'locked';
  estimatedDays: number;
  technologies: string[];
  linkedSkill: string | null; // assessment category this step addresses
}

interface ActionItem {
  type: 'assessment' | 'roadmap' | 'interview' | 'job';
  priority: 1 | 2 | 3;
  icon: string;
  color: string;
  title: string;
  desc: string;
  cta: string;
  route: string;
  badge?: string;
}

interface WeekDay {
  day: string;
  active: boolean;
  today: boolean;
}

interface ActivityItem {
  icon: string;
  color: string;
  text: string;
  time: string;
  timestamp: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LUCIDE_ICONS],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
})
export class DashboardHomeComponent implements OnInit {
  private readonly roadmapApi    = inject(RoadmapApiService);
  private readonly sessionApi    = inject(CandidateSessionApiService);
  private readonly assignmentApi = inject(CandidateAssignmentApiService);
  private readonly skillProfileApi = inject(SkillProfileApiService);
  private readonly interviewApi  = inject(InterviewApiService);
  private readonly jobService    = inject(JobService);

  // ── Loading state ──
  roadmapLoading = true;
  assessmentLoading = true;

  get loading(): boolean { return this.roadmapLoading || this.assessmentLoading; }

  // ── Readiness ring ──
  readonly circumference = 2 * Math.PI * 54;
  readinessScore = 0;
  get dashOffset(): number { return this.circumference * (1 - this.readinessScore / 100); }
  get readinessLabel(): string {
    if (this.readinessScore >= 80) return 'Job-ready';
    if (this.readinessScore >= 60) return 'On track';
    if (this.readinessScore >= 35) return 'Building up';
    return 'Getting started';
  }
  get readinessColor(): string {
    if (this.readinessScore >= 70) return '#2ee8a5';
    if (this.readinessScore >= 40) return '#f59e0b';
    return '#ef4444';
  }

  // ── Assessment data ──
  skillProfile: SkillProfileDto | null = null;
  assessmentSessions: SessionResponseDto[] = [];
  assignedCategories: { id: number; code: string; title: string }[] = [];
  assessmentStatus: 'PENDING' | 'APPROVED' | null = null;
  pendingPublishCount = 0;

  get publishedSessions(): SessionResponseDto[] {
    return this.assessmentSessions.filter(s => isSessionCompleted(s) && isSessionPublished(s) && s.scorePercent != null);
  }
  get avgScore(): number | null {
    const p = this.publishedSessions;
    if (!p.length) return null;
    return Math.round(p.reduce((s, x) => s + (x.scorePercent ?? 0), 0) / p.length);
  }
  get completedCount(): number { return this.assessmentSessions.filter(s => isSessionCompleted(s)).length; }

  // ── Roadmap data ──
  roadmapNodes: RoadmapNodeDto[] = [];
  roadmapProgress = 0;
  roadmapTotal = 0;
  roadmapCompleted = 0;
  streakDays = 0;
  weekDays: WeekDay[] = this.buildWeekDays(0);
  activities: Omit<ActivityItem, 'timestamp'>[] = [];

  // ── Derived: skill gap (assessment ↔ roadmap) ──
  skillGaps: SkillGapItem[] = [];

  // ── Derived: learning path ──
  learningPath: LearningPathStep[] = [];

  // ── Derived: action items ──
  actionItems: ActionItem[] = [];

  // ── Interview ──
  interviewSessionCount = 0;
  interviewStreak = 0;

  // ── Jobs ──
  topJob: { title: string; company: string; matchScore: number } | null = null;
  jobCount = 0;

  // ── User ──
  get userName(): string {
    return localStorage.getItem('userName')?.trim().split(/\s+/)[0] ?? 'there';
  }
  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  // ─────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadAssessments();
    this.loadRoadmap();
    this.loadInterview();
    this.loadJobs();
  }

  // ── Load assessments ──────────────────────────────────────────────────────

  private loadAssessments(): void {
    const uid = getMsUserIdFromToken();
    if (!uid || uid === '00000000-0000-4000-8000-000000000001') {
      this.assessmentLoading = false;
      return;
    }

    forkJoin({
      plan: this.assignmentApi.getStatus(uid).pipe(catchError(() => of(null))),
      sessions: this.sessionApi.listForUser(uid).pipe(catchError(() => of([]))),
      profile: this.skillProfileApi.getForUser(uid).pipe(catchError(() => of(null))),
    }).subscribe(({ plan, sessions, profile }) => {
      this.assessmentStatus = plan?.status ?? null;
      this.assignedCategories = plan?.assignedCategories ?? [];
      this.assessmentSessions = sessions;
      this.pendingPublishCount = sessions.filter(s => isSessionCompleted(s) && !isSessionPublished(s)).length;
      this.skillProfile = profile;
      this.assessmentLoading = false;
      this.rebuildDerived();
    });
  }

  // ── Load roadmap ──────────────────────────────────────────────────────────

  private loadRoadmap(): void {
    const userId = resolveRoadmapUserId();
    if (!userId) {
      this.roadmapLoading = false;
      this.rebuildDerived();
      return;
    }

    this.roadmapApi.getUserRoadmap(userId).pipe(
      switchMap(roadmap => forkJoin({
        progress: this.roadmapApi.getProgressSummary(roadmap.id).pipe(catchError(() => of(null as ProgressSummaryDto | null))),
        graph:    this.roadmapApi.getRoadmapGraph(roadmap.id).pipe(catchError(() => of(null as RoadmapVisualResponse | null))),
        streak:   this.roadmapApi.getStreakInfo(userId, roadmap.id).pipe(catchError(() => of({ currentStreak: 0 }))),
        notifs:   this.roadmapApi.getRoadmapNotifications(roadmap.id, userId).pipe(catchError(() => of([] as NotificationDto[]))),
        milestones: this.roadmapApi.getMilestones(roadmap.id).pipe(catchError(() => of([] as MilestoneDto[]))),
      })),
      finalize(() => { this.roadmapLoading = false; })
    ).subscribe({
      next: ({ progress, graph, streak, notifs, milestones }) => {
        const nodes = (graph?.nodes ?? []).slice().sort((a, b) => a.stepOrder - b.stepOrder);
        this.roadmapNodes = nodes;
        this.roadmapTotal = (progress?.totalSteps ?? 0) > 0 ? progress!.totalSteps : nodes.length;
        this.roadmapCompleted = (progress?.completedSteps ?? 0) > 0 ? progress!.completedSteps : nodes.filter(n => this.isDone(n.status)).length;
        this.roadmapProgress = this.roadmapTotal > 0 ? Math.round((this.roadmapCompleted / this.roadmapTotal) * 100) : 0;
        if ((progress?.progressPercent ?? 0) > 0) this.roadmapProgress = Math.round(progress!.progressPercent);
        if ((graph?.progressPercent ?? 0) > 0 && this.roadmapProgress === 0) this.roadmapProgress = Math.round(graph!.progressPercent);
        this.streakDays = streak.currentStreak ?? 0;
        this.weekDays = this.buildWeekDays(this.streakDays);
        this.activities = this.buildActivity(notifs, milestones);
        this.rebuildDerived();
      },
      error: () => { this.rebuildDerived(); },
    });
  }

  // ── Load interview ────────────────────────────────────────────────────────

  private loadInterview(): void {
    const uid = resolveRoadmapUserId();
    if (!uid) return;
    this.interviewApi.getSessionsByUser(uid).pipe(catchError(() => of([]))).subscribe((s: any[]) => {
      this.interviewSessionCount = s.length;
    });
    this.interviewApi.getStreak(uid).pipe(catchError(() => of({ currentStreak: 0 }))).subscribe((s: any) => {
      this.interviewStreak = s.currentStreak ?? 0;
    });
  }

  // ── Load jobs ─────────────────────────────────────────────────────────────

  private loadJobs(): void {
    this.jobService.getJobs().pipe(catchError(() => of([]))).subscribe((jobs: any[]) => {
      this.jobCount = jobs.length;
      const sorted = [...jobs].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
      if (sorted.length > 0) {
        this.topJob = { title: sorted[0].title, company: sorted[0].company, matchScore: sorted[0].matchScore ?? 0 };
      }
    });
  }

  // ── Rebuild derived data (runs after both loads complete) ─────────────────

  private rebuildDerived(): void {
    this.buildSkillGaps();
    this.buildLearningPath();
    this.buildActionItems();
    this.buildReadiness();
  }

  // ── Skill gaps: assessment scores ↔ roadmap technologies ─────────────────

  private buildSkillGaps(): void {
    const palette = ['#2ee8a5', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#ec4899'];

    // Source 1: skill profile from MS-Assessment (most accurate)
    if (this.skillProfile?.domains?.length) {
      this.skillGaps = this.skillProfile.domains.map((d, i) => {
        const score = d.scorePercent;
        const gap = Math.max(0, 100 - score);
        // Check if roadmap has nodes covering this skill
        const roadmapCoverage = this.roadmapNodes.some(n =>
          (n.technologies || '').toLowerCase().includes(d.code.toLowerCase()) ||
          (n.title || '').toLowerCase().includes(d.title.toLowerCase().split(' ')[0])
        ) ? Math.min(100, score + 20) : 0;

        return {
          code: d.code,
          title: d.title,
          score,
          roadmapCoverage,
          gap,
          color: palette[i % palette.length],
          status: score >= 70 ? 'strong' : score >= 40 ? 'learning' : 'gap',
        } as SkillGapItem;
      }).sort((a, b) => a.score - b.score); // weakest first
      return;
    }

    // Source 2: raw sessions if no skill profile yet
    const sessionMap = new Map<string, { title: string; scores: number[] }>();
    for (const s of this.publishedSessions) {
      if (!sessionMap.has(s.categoryCode ?? s.categoryTitle)) {
        sessionMap.set(s.categoryCode ?? s.categoryTitle, { title: s.categoryTitle, scores: [] });
      }
      sessionMap.get(s.categoryCode ?? s.categoryTitle)!.scores.push(s.scorePercent ?? 0);
    }

    this.skillGaps = [...sessionMap.entries()].map(([code, { title, scores }], i) => {
      const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      return {
        code, title, score,
        roadmapCoverage: 0,
        gap: Math.max(0, 100 - score),
        color: palette[i % palette.length],
        status: score >= 70 ? 'strong' : score >= 40 ? 'learning' : 'gap',
      } as SkillGapItem;
    }).sort((a, b) => a.score - b.score);
  }

  // ── Learning path: roadmap nodes enriched with assessment context ─────────

  private buildLearningPath(): void {
    const weakSkills = this.skillGaps.filter(g => g.status === 'gap' || g.status === 'learning').map(g => g.title.toLowerCase());

    this.learningPath = this.roadmapNodes.slice(0, 6).map(n => {
      const techs = (n.technologies || '').split(',').map(t => t.trim()).filter(Boolean);
      // Find if this node addresses a weak skill
      const linkedSkill = weakSkills.find(skill =>
        techs.some(t => t.toLowerCase().includes(skill.split(' ')[0])) ||
        n.title.toLowerCase().includes(skill.split(' ')[0])
      ) ?? null;

      let status: LearningPathStep['status'] = 'locked';
      if (this.isDone(n.status)) status = 'done';
      else if (this.isActive(n.status)) status = 'active';
      else if (n.status === 'AVAILABLE') status = 'next';

      return { id: n.id, title: n.title, status, estimatedDays: n.estimatedDays ?? 1, technologies: techs.slice(0, 3), linkedSkill };
    });
  }

  // ── Action items: smart prioritised to-do list ────────────────────────────

  private buildActionItems(): void {
    const items: ActionItem[] = [];

    // 1. Weak assessments → take quiz
    const weakGaps = this.skillGaps.filter(g => g.status === 'gap');
    if (weakGaps.length > 0) {
      items.push({
        type: 'assessment', priority: 1,
        icon: 'brain-circuit', color: '#ef4444',
        title: `Improve ${weakGaps[0].title}`,
        desc: `Your score is ${weakGaps[0].score}% — retake or study this topic to strengthen your profile.`,
        cta: 'Go to assessments', route: '/dashboard/assessments',
        badge: `${weakGaps[0].score}%`,
      });
    }

    // 2. Active roadmap step
    const activeNode = this.roadmapNodes.find(n => this.isActive(n.status));
    if (activeNode) {
      items.push({
        type: 'roadmap', priority: 1,
        icon: 'play-circle', color: '#2ee8a5',
        title: `Continue: ${activeNode.title}`,
        desc: `This step is in progress. Completing it unlocks the next node on your path.`,
        cta: 'Open roadmap', route: '/dashboard/roadmap',
      });
    }

    // 3. Next available roadmap step
    const nextNode = this.roadmapNodes.find(n => n.status === 'AVAILABLE');
    if (nextNode && !activeNode) {
      items.push({
        type: 'roadmap', priority: 2,
        icon: 'map-pin', color: '#3b82f6',
        title: `Start: ${nextNode.title}`,
        desc: `This step is unlocked and ready. Estimated ~${nextNode.estimatedDays ?? 1} day(s).`,
        cta: 'Open roadmap', route: '/dashboard/roadmap',
      });
    }

    // 4. Pending assessment publish
    if (this.pendingPublishCount > 0) {
      items.push({
        type: 'assessment', priority: 2,
        icon: 'clock', color: '#f59e0b',
        title: `${this.pendingPublishCount} result(s) pending review`,
        desc: 'Your completed quizzes are waiting for admin to publish your scores.',
        cta: 'Check assessments', route: '/dashboard/assessments',
        badge: 'Pending',
      });
    }

    // 5. No assessments yet
    if (this.assessmentSessions.length === 0 && this.assessmentStatus === 'APPROVED') {
      items.push({
        type: 'assessment', priority: 1,
        icon: 'zap', color: '#8b5cf6',
        title: 'Start your first assessment',
        desc: 'You have assigned quizzes. Complete them to build your skill profile and unlock roadmap recommendations.',
        cta: 'Take assessment', route: '/dashboard/assessments',
      });
    }

    // 6. Interview practice
    if (this.interviewSessionCount === 0) {
      items.push({
        type: 'interview', priority: 3,
        icon: 'mic', color: '#6366f1',
        title: 'Practice interview skills',
        desc: 'AI-powered mock interviews help you prepare for real job interviews.',
        cta: 'Start practice', route: '/dashboard/interview',
      });
    }

    // 7. Top job match
    if (this.topJob && this.topJob.matchScore >= 60) {
      items.push({
        type: 'job', priority: 3,
        icon: 'briefcase', color: '#f59e0b',
        title: `${this.topJob.matchScore}% match: ${this.topJob.title}`,
        desc: `${this.topJob.company} — strong match based on your skill profile.`,
        cta: 'View jobs', route: '/dashboard/jobs',
        badge: `${this.topJob.matchScore}%`,
      });
    }

    this.actionItems = items.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }

  // ── Readiness score ───────────────────────────────────────────────────────

  private buildReadiness(): void {
    let score = 0;

    // Roadmap progress (40%)
    score += this.roadmapProgress * 0.40;

    // Assessment avg score (35%)
    if (this.avgScore != null) {
      score += this.avgScore * 0.35;
    }

    // Streak bonus (15%)
    score += Math.min(this.streakDays, 14) * (15 / 14);

    // Interview bonus (10%)
    if (this.interviewSessionCount > 0) {
      score += Math.min(this.interviewSessionCount, 5) * 2;
    }

    this.readinessScore = Math.max(0, Math.min(100, Math.round(score)));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildWeekDays(streak: number): WeekDay[] {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayIdx = (new Date().getDay() + 6) % 7;
    const active = new Set<number>();
    for (let i = 0; i < Math.min(streak, 7); i++) active.add((todayIdx - i + 7) % 7);
    return labels.map((day, i) => ({ day, active: active.has(i), today: i === todayIdx }));
  }

  private buildActivity(notifs: NotificationDto[], milestones: MilestoneDto[]): Omit<ActivityItem, 'timestamp'>[] {
    const all: ActivityItem[] = [
      ...notifs.map(n => ({
        icon: this.notifIcon(n.type), color: this.notifColor(n.type),
        text: n.message, time: this.relTime(n.createdAt),
        timestamp: new Date(n.createdAt).getTime() || 0,
      })),
      ...milestones.filter(m => !!m.reachedAt).map(m => ({
        icon: 'trophy', color: '#2ee8a5',
        text: `Milestone: ${m.title}`, time: this.relTime(m.reachedAt!),
        timestamp: new Date(m.reachedAt!).getTime() || 0,
      })),
      ...this.publishedSessions.map(s => ({
        icon: 'check-circle', color: '#8b5cf6',
        text: `Assessment published: ${s.categoryTitle} — ${s.scorePercent}%`,
        time: this.relTime(s.completedAt ?? ''),
        timestamp: new Date(s.completedAt ?? '').getTime() || 0,
      })),
    ];
    return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, 8).map(({ timestamp: _t, ...rest }) => rest);
  }

  private notifIcon(type: string): string {
    const t = (type || '').toUpperCase();
    if (t.includes('MILESTONE')) return 'trophy';
    if (t.includes('STEP')) return 'check-circle';
    if (t.includes('ALERT')) return 'alert-circle';
    return 'bell';
  }

  private notifColor(type: string): string {
    const t = (type || '').toUpperCase();
    if (t.includes('MILESTONE')) return '#2ee8a5';
    if (t.includes('STEP')) return '#3b82f6';
    if (t.includes('ALERT')) return '#f59e0b';
    return '#8b5cf6';
  }

  private relTime(value: string): string {
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'recently';
    const mins = Math.max(1, Math.floor((Date.now() - d.getTime()) / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  private isDone(s: string | undefined): boolean {
    const n = (s || '').toUpperCase();
    return n === 'COMPLETED' || n === 'SKIPPED' || n === 'DONE';
  }

  private isActive(s: string | undefined): boolean {
    return (s || '').toUpperCase() === 'IN_PROGRESS';
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  get strongCount(): number { return this.skillGaps.filter(g => g.status === 'strong').length; }
  get learningCount(): number { return this.skillGaps.filter(g => g.status === 'learning').length; }
  get gapCount(): number { return this.skillGaps.filter(g => g.status === 'gap').length; }

  trackByTitle(_: number, item: { title: string }): string { return item.title; }
  trackByCode(_: number, item: { code: string }): string { return item.code; }
  trackById(_: number, item: { id: number }): number { return item.id; }
}
