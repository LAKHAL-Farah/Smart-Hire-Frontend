import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/* ── Types ── */
interface Resource {
  type: 'video' | 'article' | 'course';
  title: string;
  source: string;
  url: string;
}

interface Step {
  number: number;
  title: string;
  description: string;
  status: 'done' | 'in-progress' | 'pending';
  estimatedTime: string;
  resources: Resource[];
}

type FilterTab = 'all' | 'todo' | 'in-progress' | 'completed';

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roadmap.component.html',
  styleUrl: './roadmap.component.scss'
})
export class RoadmapComponent implements OnInit {
  /* ── Filter state ── */
  activeFilter = signal<FilterTab>('all');
  expandedStep = signal<number | null>(null);

  filterTabs: { label: string; value: FilterTab }[] = [
    { label: 'All Steps', value: 'all' },
    { label: 'To Do', value: 'todo' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' },
  ];

  /* ── Steps data ── */
  steps: Step[] = [
    {
      number: 1, title: 'Programming Foundations', description: 'Master core programming concepts, data structures, and algorithms.',
      status: 'done', estimatedTime: '~4h',
      resources: [
        { type: 'video', title: 'Data Structures & Algorithms Crash Course', source: 'freeCodeCamp', url: '#' },
        { type: 'article', title: 'Big-O Notation Explained', source: 'Medium', url: '#' },
        { type: 'course', title: 'CS50 Introduction to Computer Science', source: 'Harvard / edX', url: '#' },
      ]
    },
    {
      number: 2, title: 'Version Control with Git', description: 'Learn branching, merging, rebasing, and collaborative Git workflows.',
      status: 'done', estimatedTime: '~2h',
      resources: [
        { type: 'video', title: 'Git & GitHub for Beginners', source: 'Traversy Media', url: '#' },
        { type: 'article', title: 'Git Branching Strategies', source: 'Atlassian', url: '#' },
        { type: 'course', title: 'Introduction to Git and GitHub', source: 'Google / Coursera', url: '#' },
      ]
    },
    {
      number: 3, title: 'RESTful API Design', description: 'Build and design robust REST APIs following best practices and standards.',
      status: 'done', estimatedTime: '~3h',
      resources: [
        { type: 'video', title: 'REST API Design Best Practices', source: 'Academind', url: '#' },
        { type: 'article', title: 'RESTful API Design Guide', source: 'Microsoft Docs', url: '#' },
        { type: 'course', title: 'Designing RESTful APIs', source: 'Udacity', url: '#' },
      ]
    },
    {
      number: 4, title: 'Database Fundamentals', description: 'Master SQL, relational modeling, indexing, and query optimization.',
      status: 'done', estimatedTime: '~5h',
      resources: [
        { type: 'video', title: 'SQL Tutorial for Beginners', source: 'Programming with Mosh', url: '#' },
        { type: 'article', title: 'Database Indexing Explained', source: 'Use The Index, Luke', url: '#' },
        { type: 'course', title: 'Databases: Relational Databases and SQL', source: 'Stanford / edX', url: '#' },
        { type: 'video', title: 'PostgreSQL Full Course', source: 'Amigoscode', url: '#' },
      ]
    },
    {
      number: 5, title: 'Docker & Containerization', description: 'Containerize applications with Docker, manage images, and use Docker Compose.',
      status: 'in-progress', estimatedTime: '~3h',
      resources: [
        { type: 'video', title: 'Docker Tutorial for Beginners', source: 'TechWorld with Nana', url: '#' },
        { type: 'article', title: 'Dockerfile Best Practices', source: 'Docker Docs', url: '#' },
        { type: 'course', title: 'Docker Mastery', source: 'Bret Fisher / Udemy', url: '#' },
      ]
    },
    {
      number: 6, title: 'CI/CD Pipelines', description: 'Set up continuous integration and delivery workflows with GitHub Actions.',
      status: 'pending', estimatedTime: '~3h',
      resources: [
        { type: 'video', title: 'GitHub Actions Tutorial', source: 'Fireship', url: '#' },
        { type: 'article', title: 'CI/CD Concepts', source: 'GitLab Docs', url: '#' },
        { type: 'course', title: 'DevOps with GitHub Actions', source: 'LinkedIn Learning', url: '#' },
      ]
    },
    {
      number: 7, title: 'System Design Basics', description: 'Learn scalability patterns, load balancing, caching, and distributed systems.',
      status: 'pending', estimatedTime: '~4h',
      resources: [
        { type: 'video', title: 'System Design Interview Prep', source: 'Gaurav Sen', url: '#' },
        { type: 'article', title: 'System Design Primer', source: 'GitHub', url: '#' },
        { type: 'course', title: 'Grokking System Design', source: 'Educative', url: '#' },
        { type: 'video', title: 'Designing Data-Intensive Applications', source: 'Martin Kleppmann Talks', url: '#' },
      ]
    },
    {
      number: 8, title: 'Authentication & Security', description: 'Implement JWT, OAuth2, and secure your APIs against common vulnerabilities.',
      status: 'pending', estimatedTime: '~3h',
      resources: [
        { type: 'video', title: 'JWT Authentication Tutorial', source: 'Web Dev Simplified', url: '#' },
        { type: 'article', title: 'OWASP Top 10', source: 'OWASP', url: '#' },
        { type: 'course', title: 'Web Security Fundamentals', source: 'Stanford Online', url: '#' },
      ]
    },
    {
      number: 9, title: 'Cloud Deployment & Monitoring', description: 'Deploy to AWS/GCP, set up monitoring, logging, and alerting.',
      status: 'pending', estimatedTime: '~5h',
      resources: [
        { type: 'video', title: 'AWS for Beginners', source: 'freeCodeCamp', url: '#' },
        { type: 'article', title: 'Cloud Architecture Best Practices', source: 'AWS Well-Architected', url: '#' },
        { type: 'course', title: 'Google Cloud Fundamentals', source: 'Google / Coursera', url: '#' },
      ]
    },
  ];

  get completedCount(): number {
    return this.steps.filter(s => s.status === 'done').length;
  }

  progressPct = computed(() => {
    const done = this.steps.filter(s => s.status === 'done').length;
    return Math.round((done / this.steps.length) * 100);
  });

  filteredSteps = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.steps;
    if (f === 'todo') return this.steps.filter(s => s.status === 'pending');
    if (f === 'in-progress') return this.steps.filter(s => s.status === 'in-progress');
    return this.steps.filter(s => s.status === 'done');
  });

  /* Progress ring for mini-panel */
  ringCircum = 2 * Math.PI * 44; // ≈ 276.46
  ringOffset = computed(() => this.ringCircum * (1 - this.progressPct() / 100));

  /* Next 3 upcoming steps (not done) */
  nextThreeSteps = computed(() =>
    this.steps.filter(s => s.status !== 'done').slice(0, 3)
  );

  /* Empty state messages */
  emptyHeading = computed(() => {
    const f = this.activeFilter();
    if (f === 'in-progress') return 'No steps in progress yet';
    if (f === 'completed') return 'No completed steps yet';
    if (f === 'todo') return 'Nothing left to do!';
    return 'No steps found';
  });

  emptySubtext = computed(() => {
    const f = this.activeFilter();
    if (f === 'in-progress') return 'Start your first step to see it here.';
    if (f === 'completed') return 'Complete a step to track your progress.';
    if (f === 'todo') return 'All steps are done or in progress.';
    return 'Try a different filter.';
  });

  ngOnInit(): void {
    // Expand the in-progress step by default
    const inProgress = this.steps.find(s => s.status === 'in-progress');
    if (inProgress) this.expandedStep.set(inProgress.number);
  }

  toggleStep(num: number): void {
    this.expandedStep.update(v => v === num ? null : num);
  }

  markComplete(step: Step): void {
    step.status = 'done';
    this.expandedStep.set(null);
    // Advance next pending step to in-progress
    const nextPending = this.steps.find(s => s.status === 'pending');
    if (nextPending) {
      nextPending.status = 'in-progress';
      this.expandedStep.set(nextPending.number);
    }
  }
}
