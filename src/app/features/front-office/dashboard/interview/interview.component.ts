import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';

/* ── Types ── */
interface SessionHistory {
  id: string;
  mode: 'practice' | 'test';
  questionType: string;
  careerPath: string;
  date: string;
  score: number;
}

type QuestionType = 'technical' | 'behavioral' | 'mixed';
type Difficulty = 'beginner' | 'easy' | 'intermediate' | 'hard' | 'expert';

@Component({
  selector: 'app-interview',
  standalone: true,
  imports: [CommonModule, LUCIDE_ICONS],
  templateUrl: './interview.component.html',
  styleUrl: './interview.component.scss'
})
export class InterviewComponent {
  /* ── Hub state ── */
  sessionActive = signal(false);
  showModal = signal(false);
  selectedMode = signal<'practice' | 'test'>('practice');

  /* ── Modal config ── */
  questionType = signal<QuestionType>('technical');
  careerPath = signal('backend');
  difficulty = signal<Difficulty>('intermediate');
  questionCount = signal(10);
  videoEnabled = signal(false);
  cameraGranted = signal(false);

  questionTypes: { label: string; value: QuestionType }[] = [
    { label: 'Technical', value: 'technical' },
    { label: 'Behavioral', value: 'behavioral' },
    { label: 'Mixed', value: 'mixed' },
  ];

  careerPaths = [
    { value: 'backend', label: 'Backend Engineer', emoji: '⚙️' },
    { value: 'frontend', label: 'Frontend Engineer', emoji: '🎨' },
    { value: 'fullstack', label: 'Full-Stack Developer', emoji: '🔗' },
    { value: 'devops', label: 'DevOps Engineer', emoji: '🚀' },
    { value: 'data', label: 'Data Scientist', emoji: '📊' },
    { value: 'mobile', label: 'Mobile Developer', emoji: '📱' },
  ];

  difficulties: Difficulty[] = ['beginner', 'easy', 'intermediate', 'hard', 'expert'];
  questionCounts = [5, 10, 15];

  /* ── Streak / Stats ── */
  streak = 9;
  bestStreak = 14;
  avgScore = 7.8;
  scoreTrend = '+0.4';
  sessionsThisMonth = 12;
  lastSession = '2 days ago';

  /* ── Session History ── */
  sessions: SessionHistory[] = [
    { id: 'sess-1', mode: 'practice', questionType: 'Technical', careerPath: 'Backend Engineer', date: 'Feb 27, 2026', score: 8.4 },
    { id: 'sess-2', mode: 'test', questionType: 'Behavioral', careerPath: 'Frontend Engineer', date: 'Feb 25, 2026', score: 7.2 },
    { id: 'sess-3', mode: 'practice', questionType: 'Mixed', careerPath: 'Backend Engineer', date: 'Feb 23, 2026', score: 9.1 },
    { id: 'sess-4', mode: 'test', questionType: 'Technical', careerPath: 'Full-Stack Developer', date: 'Feb 20, 2026', score: 5.8 },
    { id: 'sess-5', mode: 'practice', questionType: 'Behavioral', careerPath: 'Backend Engineer', date: 'Feb 18, 2026', score: 6.5 },
  ];

  selectedCareerPath = computed(() => this.careerPaths.find(c => c.value === this.careerPath()));

  difficultyIndex = computed(() => this.difficulties.indexOf(this.difficulty()));

  openModal(mode: 'practice' | 'test'): void {
    this.selectedMode.set(mode);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  setQuestionType(t: QuestionType): void {
    this.questionType.set(t);
  }

  setDifficulty(d: Difficulty): void {
    this.difficulty.set(d);
  }

  setQuestionCount(n: number): void {
    this.questionCount.set(n);
  }

  toggleVideo(): void {
    this.videoEnabled.update(v => !v);
  }

  beginSession(): void {
    this.showModal.set(false);
    // Navigate to session — in a real app would use Router
    console.log('Begin session:', {
      mode: this.selectedMode(),
      questionType: this.questionType(),
      careerPath: this.careerPath(),
      difficulty: this.difficulty(),
      count: this.questionCount(),
      video: this.videoEnabled(),
    });
  }

  getScoreBorder(score: number): string {
    if (score >= 8) return 'border-green';
    if (score < 6) return 'border-orange';
    return '';
  }
}
