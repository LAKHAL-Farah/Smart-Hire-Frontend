import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssessmentQuestionUI, QuestionOption, SkillUI, CareerPathUI } from '../../models';

/**
 * Assessment Host Page Component
 * Main page for the assessment feature, displays assessment hub and quiz
 */
@Component({
  selector: 'app-assessment-host',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assessment-host.component.html',
  styleUrl: './assessment-host.component.scss'
})
export class AssessmentHostComponent {
  /* ── Hub state ── */
  quizActive = signal(false);

  /* ── Radar chart data ── */
  skills: SkillUI[] = [
    { name: 'Frontend', category: 'frontend', score: 75 },
    { name: 'Backend', category: 'backend', score: 52 },
    { name: 'DevOps', category: 'devops', score: 35 },
    { name: 'Algorithms', category: 'algorithms', score: 60 },
    { name: 'Databases', category: 'databases', score: 48 },
    { name: 'Soft Skills', category: 'soft', score: 82 },
  ];
  axisIndices = [0, 1, 2, 3, 4, 5];

  overallScore = 62;
  lastDate = 'January 15, 2026';
  strengths = ['Soft Skills', 'Frontend', 'Algorithms'];
  weaknesses = ['DevOps', 'Databases', 'Backend'];

  careerPaths: CareerPathUI[] = [
    { name: 'Frontend Engineer', description: '', requiredSkills: '', targetRoles: '', averageSalary: 85000, percentage: 87, gradient: 'linear-gradient(90deg, #2ee8a5, #14b8a6)' },
    { name: 'Full-Stack Developer', description: '', requiredSkills: '', targetRoles: '', averageSalary: 95000, percentage: 68, gradient: 'linear-gradient(90deg, #3b82f6, #6366f1)' },
    { name: 'Backend Engineer', description: '', requiredSkills: '', targetRoles: '', averageSalary: 105000, percentage: 52, gradient: 'linear-gradient(90deg, #f59e0b, #f97316)' },
  ];

  history = [
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
      const p = this.getAxisPoint(i, s.score || 0);
      return `${p.x},${p.y}`;
    }).join(' ');
  }

  /* ── Quiz state ── */
  currentQuestion = signal(0);
  selectedAnswer = signal<string | null>(null);

  quizQuestions: AssessmentQuestionUI[] = [
    {
      assessmentId: 0,
      questionText: 'You are building a REST API that returns a paginated list of items. The client requests page 5 with 20 items per page. Which SQL clause combination correctly retrieves the data?',
      category: 'backend',
      difficulty: 2,
      difficultyLabel: 'Intermediate',
      options: [
        { letter: 'A', text: 'SELECT * FROM items LIMIT 20 OFFSET 80' },
        { letter: 'B', text: 'SELECT * FROM items LIMIT 80 OFFSET 20' },
        { letter: 'C', text: 'SELECT * FROM items WHERE page = 5 LIMIT 20' },
        { letter: 'D', text: 'SELECT TOP 20 FROM items SKIP 80' },
      ],
    },
    {
      assessmentId: 0,
      questionText: 'Your microservice architecture has Service A calling Service B synchronously. Service B is experiencing high latency. Which pattern best prevents cascading failures across your system?',
      category: 'architecture',
      difficulty: 3,
      difficultyLabel: 'Advanced',
      options: [
        { letter: 'A', text: 'Increase the timeout on Service A requests to Service B' },
        { letter: 'B', text: 'Implement a circuit breaker pattern on Service A' },
        { letter: 'C', text: 'Add more replicas of Service B behind a load balancer' },
        { letter: 'D', text: 'Cache all Service B responses indefinitely' },
      ],
    },
    {
      assessmentId: 0,
      questionText: 'You have a React component that re-renders excessively. The component receives a callback prop from its parent. What is the most effective approach to prevent unnecessary re-renders?',
      category: 'frontend',
      difficulty: 2,
      difficultyLabel: 'Intermediate',
      options: [
        { letter: 'A', text: 'Wrap the child component in React.memo and the callback in useCallback' },
        { letter: 'B', text: 'Use shouldComponentUpdate to compare props manually' },
        { letter: 'C', text: 'Move all state to a global store like Redux' },
        { letter: 'D', text: 'Convert the component to a class component for better control' },
      ],
    },
    {
      assessmentId: 0,
      questionText: 'You need to design an idempotent API endpoint for processing payments. Which strategy ensures that retrying the same request does not charge the customer twice?',
      category: 'backend',
      difficulty: 3,
      difficultyLabel: 'Advanced',
      options: [
        { letter: 'A', text: 'Use a unique idempotency key sent by the client and check it before processing' },
        { letter: 'B', text: 'Rely on database unique constraints on the amount and timestamp' },
        { letter: 'C', text: 'Disable retry logic on the client side entirely' },
        { letter: 'D', text: 'Return HTTP 409 Conflict for any duplicate request body' },
      ],
    },
    {
      assessmentId: 0,
      questionText: 'A Docker container running your Node.js app consumes 1.8 GB of memory and eventually crashes with an OOM error. The app processes large CSV files. What is the most likely root cause?',
      category: 'devops',
      difficulty: 2,
      difficultyLabel: 'Intermediate',
      options: [
        { letter: 'A', text: 'Reading the entire CSV file into memory with fs.readFileSync' },
        { letter: 'B', text: 'The Docker container does not have enough CPU cores allocated' },
        { letter: 'C', text: 'Node.js garbage collector is disabled by default in Docker' },
        { letter: 'D', text: 'The CSV parser library has a known memory leak in all versions' },
      ],
    },
    {
      assessmentId: 0,
      questionText: 'You are implementing authentication with JWTs. The access token has a short expiry of 15 minutes. What is the standard approach to maintain the user session without forcing re-login?',
      category: 'backend',
      difficulty: 2,
      difficultyLabel: 'Intermediate',
      options: [
        { letter: 'A', text: 'Issue a long-lived refresh token stored in an HttpOnly cookie' },
        { letter: 'B', text: 'Set the access token expiry to 30 days instead' },
        { letter: 'C', text: 'Store the user password encrypted in localStorage for re-authentication' },
        { letter: 'D', text: 'Use session cookies and abandon JWTs entirely' },
      ],
    },
    {
      assessmentId: 0,
      questionText: 'Your PostgreSQL query performs a sequential scan on a table with 10 million rows, taking 8 seconds. The WHERE clause filters on a non-indexed column. What is the first optimization step?',
      category: 'databases',
      difficulty: 2,
      difficultyLabel: 'Intermediate',
      options: [
        { letter: 'A', text: 'Create a B-tree index on the filtered column' },
        { letter: 'B', text: 'Increase the shared_buffers PostgreSQL configuration' },
        { letter: 'C', text: 'Rewrite the query using a subquery instead of WHERE' },
        { letter: 'D', text: 'Partition the table by primary key range' },
      ],
    },
    {
      assessmentId: 0,
      questionText: 'In a CI/CD pipeline, what is the primary purpose of running integration tests in a staging environment before deploying to production?',
      category: 'devops',
      difficulty: 1,
      difficultyLabel: 'Beginner',
      options: [
        { letter: 'A', text: 'To verify that all services interact correctly in a production-like environment' },
        { letter: 'B', text: 'To replace the need for unit tests entirely' },
        { letter: 'C', text: 'To test the UI layout across different screen sizes' },
        { letter: 'D', text: 'To generate code coverage reports for the team' },
      ],
    },
    {
      assessmentId: 0,
      questionText: 'You need to implement real-time notifications in a web application. Which technology is most appropriate for pushing server events to the client with minimal overhead?',
      category: 'frontend',
      difficulty: 2,
      difficultyLabel: 'Intermediate',
      options: [
        { letter: 'A', text: 'WebSockets for bidirectional persistent connection' },
        { letter: 'B', text: 'Long polling with XMLHttpRequest every 500ms' },
        { letter: 'C', text: 'Server-Sent Events for unidirectional server push' },
        { letter: 'D', text: 'REST API polling with setInterval every second' },
      ],
    },
    {
      assessmentId: 0,
      questionText: 'Your team uses Git. A feature branch has diverged significantly from main. Multiple team members have committed to both. Which merge strategy preserves the full commit history while integrating changes?',
      category: 'devops',
      difficulty: 1,
      difficultyLabel: 'Beginner',
      options: [
        { letter: 'A', text: 'git merge main into the feature branch to create a merge commit' },
        { letter: 'B', text: 'git rebase main to replay feature commits on top' },
        { letter: 'C', text: 'git cherry-pick each commit from main individually' },
        { letter: 'D', text: 'Delete the feature branch and recreate it from main' },
      ],
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
