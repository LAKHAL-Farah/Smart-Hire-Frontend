import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LUCIDE_ICONS } from '../../../../../shared/lucide-icons';
import { InterviewAnswerResultDto, InterviewSessionDto, RoadmapApiService } from '../../../../../services/roadmap-api.service';
import { resolveRoadmapUserId } from '../../roadmap/roadmap-user-context';

/* ── Types ── */
interface DimensionScore {
  label: string;
  score: number;
  outOf: number;
  color: string;
}

interface QuestionReview {
  number: number;
  text: string;
  answer: string;
  dimensions: { label: string; score: number; color: string }[];
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface RecommendedAction {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-interview-report',
  standalone: true,
  imports: [CommonModule, LUCIDE_ICONS],
  templateUrl: './interview-report.component.html',
  styleUrl: './interview-report.component.scss'
})
export class InterviewReportComponent implements OnInit {
  private readonly roadmapApi = inject(RoadmapApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = true;
  errorMessage: string | null = null;

  sessionDate = 'N/A';
  sessionType = 'Session';
  questionType = 'Interview';
  careerPath = 'Career Path';
  duration = 'N/A';
  finalScore = 0;
  percentile = 50;

  dimensions: DimensionScore[] = [
    { label: 'Content', score: 0, outOf: 10, color: '#2ee8a5' },
    { label: 'Clarity', score: 0, outOf: 10, color: '#3b82f6' },
    { label: 'Confidence', score: 0, outOf: 10, color: '#10b981' },
    { label: 'Tone', score: 0, outOf: 10, color: '#8b5cf6' },
    { label: 'Non-verbal', score: 0, outOf: 10, color: '#f59e0b' },
  ];

  radarPoints = this.computeRadar();

  strengths: string[] = [];
  areasToImprove: string[] = [];
  recommendations: RecommendedAction[] = [];

  /* ── Question-by-question ── */
  expandedQuestion = signal<number | null>(null);

  questions: QuestionReview[] = [];

  ngOnInit(): void {
    const sessionIdParam = this.route.snapshot.paramMap.get('id');
    const sessionId = sessionIdParam ? Number(sessionIdParam) : NaN;
    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      this.loading = false;
      this.errorMessage = 'Invalid interview session id.';
      return;
    }

    const userId = resolveRoadmapUserId();
    if (!userId) {
      this.loading = false;
      this.errorMessage = 'No authenticated user found. Please sign in again.';
      return;
    }

    this.roadmapApi.getInterviewSessions(userId).subscribe({
      next: (sessions) => {
        const session = sessions.find((item) => item.id === sessionId);
        if (session) {
          this.applySessionMetadata(session);
        }
        this.loadScore(sessionId);
      },
      error: () => {
        this.loadScore(sessionId);
      },
    });
  }

  toggleQuestion(n: number): void {
    this.expandedQuestion.update(v => v === n ? null : n);
  }

  retakeSession(): void {
    void this.router.navigate(['/dashboard/interview']);
  }

  private loadScore(sessionId: number): void {
    this.roadmapApi.getInterviewScore(sessionId).subscribe({
      next: (result) => {
        const score = this.normalizeScore(result.finalScore);
        this.finalScore = score;
        this.percentile = this.computePercentile(score);

        this.dimensions = this.buildDimensionScores(score);
        this.radarPoints = this.computeRadar();

        this.questions = (result.answers || []).map((answer, index) => this.mapAnswer(index + 1, answer));
        this.strengths = this.questions.flatMap((q) => q.strengths).slice(0, 4);
        this.areasToImprove = this.questions.flatMap((q) => q.improvements).slice(0, 4);
        this.recommendations = this.buildRecommendations(this.areasToImprove);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Could not load report data from backend.';
      },
    });
  }

  private applySessionMetadata(session: InterviewSessionDto): void {
    this.sessionDate = session.startedAt
      ? new Date(session.startedAt).toLocaleDateString('en-US', {
          month: 'long',
          day: '2-digit',
          year: 'numeric',
        })
      : 'N/A';
    this.sessionType = (session.status || '').toUpperCase() === 'COMPLETED' ? 'Completed' : 'In Progress';
    this.questionType = session.difficulty || 'Interview';
    this.careerPath = session.careerPath || 'Career Path';

    if (session.startedAt && session.completedAt) {
      const start = new Date(session.startedAt).getTime();
      const end = new Date(session.completedAt).getTime();
      this.duration = this.formatDuration(Math.max(0, end - start));
    }
  }

  private mapAnswer(number: number, answer: InterviewAnswerResultDto): QuestionReview {
    const score = this.normalizeScore(answer.score);
    const dims = this.buildQuestionDimensions(score);
    const feedback = this.extractFeedback(answer.evaluation);

    return {
      number,
      text: answer.questionText || `Question ${number}`,
      answer: answer.userAnswer || 'No answer captured.',
      dimensions: dims,
      feedback: feedback || answer.evaluation || 'No evaluation available.',
      strengths: feedback ? [feedback] : [],
      improvements: score < 7 ? ['Improve depth and precision in your response.'] : [],
    };
  }

  private buildDimensionScores(score: number): DimensionScore[] {
    return [
      { label: 'Content', score, outOf: 10, color: '#2ee8a5' },
      { label: 'Clarity', score: Math.max(0, score - 0.3), outOf: 10, color: '#3b82f6' },
      { label: 'Confidence', score: Math.max(0, score - 0.6), outOf: 10, color: '#10b981' },
      { label: 'Tone', score: Math.max(0, score - 0.2), outOf: 10, color: '#8b5cf6' },
      { label: 'Non-verbal', score: Math.max(0, score - 1.0), outOf: 10, color: '#f59e0b' },
    ];
  }

  private buildQuestionDimensions(score: number): { label: string; score: number; color: string }[] {
    const percent = Math.round((score / 10) * 100);
    return [
      { label: 'Content', score: percent, color: '#2ee8a5' },
      { label: 'Clarity', score: Math.max(0, percent - 4), color: '#3b82f6' },
      { label: 'Confidence', score: Math.max(0, percent - 8), color: '#10b981' },
      { label: 'Tone', score: Math.max(0, percent - 2), color: '#8b5cf6' },
      { label: 'Non-verbal', score: Math.max(0, percent - 12), color: '#f59e0b' },
    ];
  }

  private buildRecommendations(improvements: string[]): RecommendedAction[] {
    return improvements.slice(0, 3).map((item, index) => ({
      icon: index === 0 ? '🎯' : index === 1 ? '📚' : '🔁',
      title: `Next action ${index + 1}`,
      description: item,
    }));
  }

  private extractFeedback(evaluation: string | undefined): string {
    if (!evaluation) {
      return '';
    }
    const marker = 'Feedback:';
    const idx = evaluation.indexOf(marker);
    return idx === -1 ? evaluation : evaluation.substring(idx + marker.length).trim();
  }

  private normalizeScore(score: number | undefined): number {
    if (typeof score !== 'number') {
      return 0;
    }
    return Number(Math.max(0, Math.min(10, score)).toFixed(1));
  }

  private computePercentile(score: number): number {
    return Math.max(1, Math.min(99, Math.round(score * 10)));
  }

  private formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} min ${seconds} sec`;
  }

  private computeRadar(): string {
    const cx = 100, cy = 100, r = 70;
    const scores = this.dimensions.map(d => d.score / d.outOf);
    const angleStep = (2 * Math.PI) / scores.length;
    const points = scores.map((s, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x = cx + r * s * Math.cos(angle);
      const y = cy + r * s * Math.sin(angle);
      return `${x},${y}`;
    });
    return points.join(' ');
  }

  getRadarAxisPoints(): { label: string; x: number; y: number; lx: number; ly: number }[] {
    const cx = 100, cy = 100, r = 70;
    const n = this.dimensions.length;
    const angleStep = (2 * Math.PI) / n;
    return this.dimensions.map((d, i) => {
      const angle = angleStep * i - Math.PI / 2;
      return {
        label: d.label,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        lx: cx + (r + 18) * Math.cos(angle),
        ly: cy + (r + 18) * Math.sin(angle),
      };
    });
  }

  getGridPolygon(scale: number): string {
    const cx = 100, cy = 100, r = 70;
    const n = this.dimensions.length;
    const angleStep = (2 * Math.PI) / n;
    const points: string[] = [];
    for (let i = 0; i < n; i++) {
      const angle = angleStep * i - Math.PI / 2;
      points.push(`${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`);
    }
    return points.join(' ');
  }

  getDimensionDots(q: QuestionReview): string {
    return q.dimensions.map(d => d.color).join(',');
  }
}
