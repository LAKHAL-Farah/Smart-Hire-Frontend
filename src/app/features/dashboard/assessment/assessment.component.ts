import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/* ── Types ── */
interface Skill { name: string; score: number; }
interface AssessmentHistory { date: string; score: number; }
interface CareerPath { name: string; pct: number; color: string; }
interface QuizQuestion {
  text: string;
  options: { letter: string; text: string }[];
  difficulty: number;
  difficultyLabel: string;
}

@Component({
  selector: 'app-assessment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ══════ QUIZ MODE ══════ -->
    @if (quizActive()) {
      <div class="quiz-mode">
        <p class="quiz-mode__warning">Assessment in progress — do not close this tab</p>

        <div class="quiz-wrap">
          <!-- Progress dots -->
          <div class="progress-dots">
            @for (q of quizQuestions; track q.text; let i = $index) {
              <div class="progress-dot"
                [class.progress-dot--done]="i < currentQuestion()"
                [class.progress-dot--active]="i === currentQuestion()">
              </div>
            }
          </div>

          <!-- Question card -->
          <div class="q-card">
            <span class="q-card__label">Question {{ currentQuestion() + 1 }} of {{ quizQuestions.length }}</span>
            <h2 class="q-card__text">{{ quizQuestions[currentQuestion()].text }}</h2>

            <div class="q-card__options">
              @for (opt of quizQuestions[currentQuestion()].options; track opt.letter) {
                <button class="q-option"
                  [class.q-option--active]="selectedAnswer() === opt.letter"
                  (click)="selectAnswer(opt.letter)">
                  <span class="q-option__letter" [class.q-option__letter--active]="selectedAnswer() === opt.letter">{{ opt.letter }}</span>
                  <span class="q-option__text">{{ opt.text }}</span>
                </button>
              }
            </div>

            <div class="q-card__diff">
              @for (d of [1,2,3]; track d) {
                <span class="diff-dot" [class.diff-dot--filled]="d <= quizQuestions[currentQuestion()].difficulty"></span>
              }
              <span class="diff-label">{{ quizQuestions[currentQuestion()].difficultyLabel }}</span>
            </div>
          </div>

          <!-- Nav buttons -->
          <div class="quiz-nav">
            <button class="btn-ghost" (click)="cancelQuiz()">Cancel</button>
            <button class="btn-primary-grad"
              [disabled]="!selectedAnswer()"
              (click)="nextQuestion()">
              {{ currentQuestion() < quizQuestions.length - 1 ? 'Next' : 'Finish' }}
            </button>
          </div>
        </div>
      </div>
    } @else {

    <!-- ══════ HUB VIEW ══════ -->
    <div class="hub">
      <!-- Page Header -->
      <section class="page-header">
        <h1 class="page-header__title">Skill Assessment</h1>
        <button class="btn-primary-grad" (click)="startQuiz()">Retake Assessment</button>
      </section>

      <!-- Summary Card -->
      <section class="summary-card">
        <div class="summary-card__left">
          <!-- Radar chart (reused from onboarding step-results) -->
          <div class="radar-wrap">
            <svg viewBox="0 0 300 260" class="radar-svg">
              <defs>
                <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#2ee8a5" stop-opacity="0.25"/>
                  <stop offset="100%" stop-color="#10b981" stop-opacity="0.08"/>
                </linearGradient>
                <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#2ee8a5"/>
                  <stop offset="100%" stop-color="#10b981"/>
                </linearGradient>
              </defs>

              @for (ring of [0.33, 0.66, 1]; track ring) {
                <polygon
                  [attr.points]="getHexPoints(150, 125, 100 * ring)"
                  fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
              }

              @for (i of axisIndices; track i) {
                <line x1="150" y1="125"
                  [attr.x2]="getAxisPoint(i, 100).x"
                  [attr.y2]="getAxisPoint(i, 100).y"
                  stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
              }

              <polygon [attr.points]="dataPoints()" fill="url(#radarGrad)" stroke="url(#radarStroke)" stroke-width="1.5"/>

              @for (skill of skills; track skill.name; let i = $index) {
                <circle [attr.cx]="getAxisPoint(i, skill.score).x" [attr.cy]="getAxisPoint(i, skill.score).y" r="3.5" fill="#2ee8a5"/>
              }

              @for (skill of skills; track skill.name; let i = $index) {
                <text [attr.x]="getAxisPoint(i, 118).x" [attr.y]="getAxisPoint(i, 118).y"
                  text-anchor="middle" dominant-baseline="middle"
                  fill="#6b6b80" font-size="10.5" font-family="Inter, sans-serif">{{ skill.name }}</text>
              }
            </svg>
          </div>
        </div>

        <div class="summary-card__right">
          <span class="summary-card__overall-label">Overall Score</span>
          <span class="summary-card__score">{{ overallScore }}%</span>
          <span class="summary-card__date">Last assessed: {{ lastDate }}</span>

          <div class="summary-pills">
            <span class="summary-pills__label">Top Strengths</span>
            <div class="summary-pills__row">
              @for (s of strengths; track s) {
                <span class="pill pill--green">{{ s }}</span>
              }
            </div>
          </div>

          <div class="summary-pills">
            <span class="summary-pills__label">Areas to Improve</span>
            <div class="summary-pills__row">
              @for (w of weaknesses; track w) {
                <span class="pill pill--orange">{{ w }}</span>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Career Path Alignment -->
      <section class="career-section">
        <h2 class="section-title">Career Path Alignment</h2>
        <div class="career-cards">
          @for (cp of careerPaths; track cp.name) {
            <div class="career-card">
              <span class="career-card__name">{{ cp.name }}</span>
              <div class="career-card__bar-track">
                <div class="career-card__bar-fill" [style.width.%]="cp.pct" [style.background]="cp.color"></div>
              </div>
              <span class="career-card__pct">{{ cp.pct }}%</span>
            </div>
          }
        </div>
      </section>

      <!-- History -->
      <section class="history-section">
        <h2 class="section-title">Assessment History</h2>
        <div class="history-table-wrap">
          <table class="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Overall Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (h of history; track h.date) {
                <tr>
                  <td>{{ h.date }}</td>
                  <td>
                    <span class="score-cell">{{ h.score }}%</span>
                  </td>
                  <td class="td-right">
                    <a href="javascript:void(0)" class="view-link">View Report</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
    }
  `,
  styles: [`
    :host { display: block; padding: 32px; max-width: 1280px; }

    /* ══════════════════════════
       SHARED BUTTONS
    ══════════════════════════ */
    .btn-primary-grad {
      padding: 9px 22px;
      border: none;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #2ee8a5, #14b8a6);
      color: var(--bg-primary);
      font-size: 13px;
      font-family: var(--font-sans);
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-primary-grad:hover { opacity: 0.88; }
    .btn-primary-grad:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-ghost {
      padding: 9px 22px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-muted);
      font-size: 13px;
      font-family: var(--font-sans);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-ghost:hover { border-color: var(--border-hover); color: var(--text-primary); }

    /* ══════════════════════════
       PAGE HEADER
    ══════════════════════════ */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
    }
    .page-header__title {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 1.3rem;
      color: var(--text-primary);
    }

    /* ══════════════════════════
       SUMMARY CARD
    ══════════════════════════ */
    .summary-card {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
      margin-bottom: 32px;
    }

    .summary-card__left {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
      border-right: 1px solid var(--border-subtle);
    }

    .radar-wrap { display: flex; justify-content: center; width: 100%; }
    .radar-svg { width: 100%; max-width: 300px; }

    .summary-card__right {
      padding: 32px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .summary-card__overall-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin-bottom: 4px;
    }

    .summary-card__score {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 48px;
      color: var(--text-primary);
      line-height: 1.1;
      margin-bottom: 4px;
    }

    .summary-card__date {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 24px;
    }

    .summary-pills {
      margin-bottom: 16px;
    }
    .summary-pills__label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
    }
    .summary-pills__row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .pill {
      padding: 4px 12px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 600;
    }
    .pill--green {
      background: rgba(16, 185, 129, 0.12);
      color: #10b981;
    }
    .pill--orange {
      background: rgba(249, 115, 22, 0.12);
      color: #f97316;
    }

    /* ══════════════════════════
       CAREER PATH ALIGNMENT
    ══════════════════════════ */
    .section-title {
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 16px;
      color: var(--text-primary);
      margin-bottom: 16px;
    }

    .career-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 36px;
    }

    .career-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .career-card__name {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
    }

    .career-card__bar-track {
      height: 6px;
      border-radius: 3px;
      background: rgba(255,255,255,0.06);
      overflow: hidden;
    }
    .career-card__bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.8s ease;
    }

    .career-card__pct {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 700;
      font-size: 20px;
      color: var(--accent-teal);
    }

    /* ══════════════════════════
       HISTORY TABLE
    ══════════════════════════ */
    .history-table-wrap {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .history-table {
      width: 100%;
      border-collapse: collapse;
    }
    .history-table th {
      text-align: left;
      padding: 14px 24px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(255,255,255,0.015);
    }
    .history-table td {
      padding: 14px 24px;
      font-size: 13px;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-subtle);
    }
    .history-table tr:last-child td { border-bottom: none; }

    .td-right { text-align: right; }

    .score-cell {
      font-weight: 600;
      color: var(--accent-teal);
    }

    .view-link {
      font-size: 12px;
      font-weight: 500;
      color: var(--accent-teal);
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .view-link:hover { opacity: 0.7; }

    /* ══════════════════════════
       QUIZ MODE
    ══════════════════════════ */
    .quiz-mode {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .quiz-mode__warning {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 32px;
      text-align: center;
    }

    .quiz-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      max-width: 600px;
    }

    /* Progress dots */
    .progress-dots {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 32px;
    }
    .progress-dot {
      width: 28px;
      height: 4px;
      border-radius: 2px;
      background: var(--border-subtle);
      transition: all 0.4s ease;
    }
    .progress-dot--active { width: 40px; background: var(--accent-teal); }
    .progress-dot--done { background: #10b981; }

    /* Question card */
    .q-card {
      width: 100%;
      background: rgba(19, 19, 29, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 36px;
      text-align: left;
    }
    .q-card__label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
    }
    .q-card__text {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 700;
      font-size: clamp(1rem, 1.15rem, 1.25rem);
      line-height: 1.45;
      color: var(--text-primary);
      margin: 16px 0 24px;
    }
    .q-card__options {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .q-option {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      background: transparent;
      border: 1.5px solid var(--border-subtle);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.25s ease;
      font-family: var(--font-sans);
      color: var(--text-primary);
    }
    .q-option:hover { border-color: rgba(46, 232, 165, 0.35); }
    .q-option--active {
      border-color: var(--accent-teal) !important;
      background: rgba(46, 232, 165, 0.04);
    }
    .q-option__letter {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      background: var(--bg-tertiary);
      border: 1px solid var(--border-subtle);
      flex-shrink: 0;
      transition: all 0.25s ease;
    }
    .q-option__letter--active {
      background: var(--accent-teal) !important;
      color: var(--bg-primary) !important;
      border-color: var(--accent-teal) !important;
    }
    .q-option__text {
      font-size: 0.88rem;
      color: var(--text-primary);
    }

    /* Difficulty */
    .q-card__diff {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border-subtle);
    }
    .diff-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--border-subtle);
      transition: background 0.3s;
    }
    .diff-dot--filled { background: var(--accent-teal); }
    .diff-label {
      font-size: 12px;
      color: var(--text-muted);
      margin-left: 6px;
    }

    /* Quiz navigation */
    .quiz-nav {
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-top: 24px;
    }

    /* Responsive */
    @media (max-width: 860px) {
      .summary-card { grid-template-columns: 1fr; }
      .summary-card__left { border-right: none; border-bottom: 1px solid var(--border-subtle); }
      .career-cards { grid-template-columns: 1fr; }
    }
  `]
})
export class AssessmentComponent {
  /* ── Hub state ── */
  quizActive = signal(false);

  /* ── Radar chart data (same as onboarding step-results) ── */
  skills: Skill[] = [
    { name: 'Frontend', score: 75 },
    { name: 'Backend', score: 52 },
    { name: 'DevOps', score: 35 },
    { name: 'Algorithms', score: 60 },
    { name: 'Databases', score: 48 },
    { name: 'Soft Skills', score: 82 },
  ];
  axisIndices = [0, 1, 2, 3, 4, 5];

  overallScore = 62;
  lastDate = 'January 15, 2026';
  strengths = ['Soft Skills', 'Frontend', 'Algorithms'];
  weaknesses = ['DevOps', 'Databases', 'Backend'];

  careerPaths: CareerPath[] = [
    { name: 'Frontend Engineer', pct: 87, color: 'linear-gradient(90deg, #2ee8a5, #14b8a6)' },
    { name: 'Full-Stack Developer', pct: 68, color: 'linear-gradient(90deg, #3b82f6, #6366f1)' },
    { name: 'Backend Engineer', pct: 52, color: 'linear-gradient(90deg, #f59e0b, #f97316)' },
  ];

  history: AssessmentHistory[] = [
    { date: 'January 15, 2026', score: 62 },
    { date: 'November 3, 2025', score: 55 },
    { date: 'September 20, 2025', score: 41 },
  ];

  /* ── Radar helpers ── */
  dataPoints = signal(this.computeDataPoints());

  getHexPoints(cx: number, cy: number, r: number): string {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
  }

  getAxisPoint(index: number, radius: number): { x: number; y: number } {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    return {
      x: 150 + radius * Math.cos(angle),
      y: 125 + radius * Math.sin(angle),
    };
  }

  private computeDataPoints(): string {
    return this.skills.map((s, i) => {
      const p = this.getAxisPoint(i, s.score);
      return `${p.x},${p.y}`;
    }).join(' ');
  }

  /* ── Quiz state ── */
  currentQuestion = signal(0);
  selectedAnswer = signal<string | null>(null);

  quizQuestions: QuizQuestion[] = [
    {
      text: 'You are building a REST API that returns a paginated list of items. The client requests page 5 with 20 items per page. Which SQL clause combination correctly retrieves the data?',
      options: [
        { letter: 'A', text: 'SELECT * FROM items LIMIT 20 OFFSET 80' },
        { letter: 'B', text: 'SELECT * FROM items LIMIT 80 OFFSET 20' },
        { letter: 'C', text: 'SELECT * FROM items WHERE page = 5 LIMIT 20' },
        { letter: 'D', text: 'SELECT TOP 20 FROM items SKIP 80' },
      ],
      difficulty: 2, difficultyLabel: 'Intermediate'
    },
    {
      text: 'Your microservice architecture has Service A calling Service B synchronously. Service B is experiencing high latency. Which pattern best prevents cascading failures across your system?',
      options: [
        { letter: 'A', text: 'Increase the timeout on Service A requests to Service B' },
        { letter: 'B', text: 'Implement a circuit breaker pattern on Service A' },
        { letter: 'C', text: 'Add more replicas of Service B behind a load balancer' },
        { letter: 'D', text: 'Cache all Service B responses indefinitely' },
      ],
      difficulty: 3, difficultyLabel: 'Advanced'
    },
    {
      text: 'You have a React component that re-renders excessively. The component receives a callback prop from its parent. What is the most effective approach to prevent unnecessary re-renders?',
      options: [
        { letter: 'A', text: 'Wrap the child component in React.memo and the callback in useCallback' },
        { letter: 'B', text: 'Use shouldComponentUpdate to compare props manually' },
        { letter: 'C', text: 'Move all state to a global store like Redux' },
        { letter: 'D', text: 'Convert the component to a class component for better control' },
      ],
      difficulty: 2, difficultyLabel: 'Intermediate'
    },
    {
      text: 'You need to design an idempotent API endpoint for processing payments. Which strategy ensures that retrying the same request does not charge the customer twice?',
      options: [
        { letter: 'A', text: 'Use a unique idempotency key sent by the client and check it before processing' },
        { letter: 'B', text: 'Rely on database unique constraints on the amount and timestamp' },
        { letter: 'C', text: 'Disable retry logic on the client side entirely' },
        { letter: 'D', text: 'Return HTTP 409 Conflict for any duplicate request body' },
      ],
      difficulty: 3, difficultyLabel: 'Advanced'
    },
    {
      text: 'A Docker container running your Node.js app consumes 1.8 GB of memory and eventually crashes with an OOM error. The app processes large CSV files. What is the most likely root cause?',
      options: [
        { letter: 'A', text: 'Reading the entire CSV file into memory with fs.readFileSync' },
        { letter: 'B', text: 'The Docker container does not have enough CPU cores allocated' },
        { letter: 'C', text: 'Node.js garbage collector is disabled by default in Docker' },
        { letter: 'D', text: 'The CSV parser library has a known memory leak in all versions' },
      ],
      difficulty: 2, difficultyLabel: 'Intermediate'
    },
    {
      text: 'You are implementing authentication with JWTs. The access token has a short expiry of 15 minutes. What is the standard approach to maintain the user session without forcing re-login?',
      options: [
        { letter: 'A', text: 'Issue a long-lived refresh token stored in an HttpOnly cookie' },
        { letter: 'B', text: 'Set the access token expiry to 30 days instead' },
        { letter: 'C', text: 'Store the user password encrypted in localStorage for re-authentication' },
        { letter: 'D', text: 'Use session cookies and abandon JWTs entirely' },
      ],
      difficulty: 2, difficultyLabel: 'Intermediate'
    },
    {
      text: 'Your PostgreSQL query performs a sequential scan on a table with 10 million rows, taking 8 seconds. The WHERE clause filters on a non-indexed column. What is the first optimization step?',
      options: [
        { letter: 'A', text: 'Create a B-tree index on the filtered column' },
        { letter: 'B', text: 'Increase the shared_buffers PostgreSQL configuration' },
        { letter: 'C', text: 'Rewrite the query using a subquery instead of WHERE' },
        { letter: 'D', text: 'Partition the table by primary key range' },
      ],
      difficulty: 2, difficultyLabel: 'Intermediate'
    },
    {
      text: 'In a CI/CD pipeline, what is the primary purpose of running integration tests in a staging environment before deploying to production?',
      options: [
        { letter: 'A', text: 'To verify that all services interact correctly in a production-like environment' },
        { letter: 'B', text: 'To replace the need for unit tests entirely' },
        { letter: 'C', text: 'To test the UI layout across different screen sizes' },
        { letter: 'D', text: 'To generate code coverage reports for the team' },
      ],
      difficulty: 1, difficultyLabel: 'Beginner'
    },
    {
      text: 'You need to implement real-time notifications in a web application. Which technology is most appropriate for pushing server events to the client with minimal overhead?',
      options: [
        { letter: 'A', text: 'WebSockets for bidirectional persistent connection' },
        { letter: 'B', text: 'Long polling with XMLHttpRequest every 500ms' },
        { letter: 'C', text: 'Server-Sent Events for unidirectional server push' },
        { letter: 'D', text: 'REST API polling with setInterval every second' },
      ],
      difficulty: 2, difficultyLabel: 'Intermediate'
    },
    {
      text: 'Your team uses Git. A feature branch has diverged significantly from main. Multiple team members have committed to both. Which merge strategy preserves the full commit history while integrating changes?',
      options: [
        { letter: 'A', text: 'git merge main into the feature branch to create a merge commit' },
        { letter: 'B', text: 'git rebase main to replay feature commits on top' },
        { letter: 'C', text: 'git cherry-pick each commit from main individually' },
        { letter: 'D', text: 'Delete the feature branch and recreate it from main' },
      ],
      difficulty: 1, difficultyLabel: 'Beginner'
    },
  ];

  /* ── Quiz actions ── */
  startQuiz(): void {
    this.currentQuestion.set(0);
    this.selectedAnswer.set(null);
    this.quizActive.set(true);
  }

  cancelQuiz(): void {
    this.quizActive.set(false);
  }

  selectAnswer(letter: string): void {
    this.selectedAnswer.set(letter);
  }

  nextQuestion(): void {
    if (this.currentQuestion() < this.quizQuestions.length - 1) {
      this.currentQuestion.update(v => v + 1);
      this.selectedAnswer.set(null);
    } else {
      // Quiz finished — return to hub view
      this.quizActive.set(false);
    }
  }
}
