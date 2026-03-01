import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';

/* ── Types ── */
interface CvCard {
  id: number;
  title: string;
  version: number;
  date: string;
  atsScore: number;
  isDefault: boolean;
}

interface CvSection {
  name: string;
  score: number;
  content: string;
}

interface Enhancement {
  jobTitle: string;
  date: string;
  scoreBefore: number;
  scoreAfter: number;
}

type TabId = 'preview' | 'sections' | 'enhancements';

@Component({
  selector: 'app-cv-optimizer',
  standalone: true,
  imports: [CommonModule, FormsModule, LUCIDE_ICONS],
  templateUrl: './cv-optimizer.component.html',
  styleUrl: './cv-optimizer.component.scss'
})
export class CvOptimizerComponent {
  /* ── State ── */
  selectedCvId = signal(1);
  activeTab = signal<TabId>('preview');

  tabs: { id: TabId; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'sections', label: 'Sections' },
    { id: 'enhancements', label: 'Enhancements' },
  ];

  /* ── Mini ring math ── */
  miniCircum = 2 * Math.PI * 20; // ≈ 125.66

  /* ── CV Cards ── */
  cvCards: CvCard[] = [
    { id: 1, title: 'Software Engineer CV', version: 3, date: 'Feb 20, 2026', atsScore: 82, isDefault: true },
    { id: 2, title: 'Frontend Developer CV', version: 2, date: 'Jan 14, 2026', atsScore: 74, isDefault: false },
    { id: 3, title: 'Full-Stack Resume', version: 1, date: 'Dec 5, 2025', atsScore: 45, isDefault: false },
  ];

  /* ── CV Sections (preview / edit) ── */
  cvSections: CvSection[] = [
    {
      name: 'Summary', score: 78,
      content: 'Passionate software engineer with 3+ years of experience building scalable web applications. Proficient in TypeScript, Angular, Node.js, and cloud infrastructure. Focused on delivering clean, tested code and improving developer experience across teams.'
    },
    {
      name: 'Experience', score: 85,
      content: 'Software Engineer — TechCorp (2023 – Present)\nBuilt and maintained microservices handling 50k+ requests/day. Led migration from monolith to event-driven architecture. Reduced CI/CD pipeline time by 40% through parallel test execution.\n\nJunior Developer — StartupXYZ (2021 – 2023)\nDeveloped RESTful APIs and React dashboards for internal tools. Implemented automated testing, increasing code coverage from 30% to 85%.'
    },
    {
      name: 'Education', score: 90,
      content: 'B.Sc. Computer Science — University of Technology (2017 – 2021)\nGraduated with honors. Coursework in algorithms, distributed systems, and software engineering. Senior thesis on real-time collaborative editing.'
    },
    {
      name: 'Skills', score: 65,
      content: 'Languages: TypeScript, JavaScript, Python, SQL\nFrameworks: Angular, React, Node.js, Express, NestJS\nTools: Docker, Kubernetes, GitHub Actions, AWS (EC2, S3, Lambda)\nDatabases: PostgreSQL, MongoDB, Redis'
    },
    {
      name: 'Projects', score: 52,
      content: 'SmartHire — AI-powered career platform built with Angular 18 and NestJS. Features include skill assessment engine, roadmap generator, and ATS-optimized CV builder.\n\nDevSync — Real-time collaborative code editor using WebSockets and OT algorithms. Supports 20+ concurrent users with sub-100ms latency.'
    },
  ];

  /* ── Enhancements ── */
  enhancements: Enhancement[] = [
    { jobTitle: 'Senior Frontend Engineer — Spotify', date: 'Feb 18, 2026', scoreBefore: 68, scoreAfter: 82 },
    { jobTitle: 'Full-Stack Developer — Stripe', date: 'Jan 28, 2026', scoreBefore: 55, scoreAfter: 74 },
    { jobTitle: 'Backend Engineer — Datadog', date: 'Jan 10, 2026', scoreBefore: 48, scoreAfter: 67 },
    { jobTitle: 'Software Engineer — Google', date: 'Dec 20, 2025', scoreBefore: 42, scoreAfter: 61 },
  ];

  /* ── Actions ── */
  onUploadNew(): void {
    console.log('Upload new CV');
  }
}
