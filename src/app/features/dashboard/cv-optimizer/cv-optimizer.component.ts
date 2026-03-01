import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cv-page">
      <!-- ═══ PAGE HEADER ═══ -->
      <section class="page-header">
        <h1 class="page-header__title">CV Optimizer</h1>
        <button class="btn-primary-grad" (click)="onUploadNew()">Upload New CV +</button>
      </section>

      <!-- ═══ TWO-COLUMN LAYOUT ═══ -->
      <div class="cv-layout">

        <!-- ─── LEFT: CV List (35%) ─── -->
        <aside class="cv-list">
          @for (cv of cvCards; track cv.id) {
            <div
              class="cv-card"
              [class.cv-card--active]="selectedCvId() === cv.id"
              (click)="selectedCvId.set(cv.id)">
              <div class="cv-card__left-strip"></div>
              <div class="cv-card__body">
                <div class="cv-card__top">
                  <span class="cv-card__title">{{ cv.title }}</span>
                  <span class="cv-card__version">v{{ cv.version }}</span>
                </div>
                <span class="cv-card__date">{{ cv.date }}</span>
                <div class="cv-card__bottom">
                  <!-- Mini score ring -->
                  <div class="mini-ring">
                    <svg width="48" height="48" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="4"/>
                      <circle cx="24" cy="24" r="20" fill="none"
                        [attr.stroke]="cv.atsScore >= 70 ? '#2ee8a5' : cv.atsScore >= 50 ? '#f59e0b' : '#ef4444'"
                        stroke-width="4" stroke-linecap="round"
                        [attr.stroke-dasharray]="miniCircum"
                        [attr.stroke-dashoffset]="miniCircum * (1 - cv.atsScore / 100)"
                        style="transform: rotate(-90deg); transform-origin: center;"/>
                    </svg>
                    <span class="mini-ring__pct">{{ cv.atsScore }}</span>
                  </div>
                  <!-- Icon buttons -->
                  <div class="cv-card__actions">
                    <button class="cv-card__icon-btn" title="Edit">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="cv-card__icon-btn" title="Enhance with AI">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </button>
                    <button class="cv-card__icon-btn" title="Set as Default" [class.cv-card__icon-btn--default]="cv.isDefault">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Upload dashed card -->
          <button class="cv-upload-card" (click)="onUploadNew()">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2ee8a5" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span class="cv-upload-card__text">Upload CV</span>
          </button>
        </aside>

        <!-- ─── RIGHT: Preview & Analysis (65%) ─── -->
        <main class="cv-panel">
          <!-- Tab row -->
          <div class="tab-row">
            @for (tab of tabs; track tab.id) {
              <button
                class="tab-btn"
                [class.tab-btn--active]="activeTab() === tab.id"
                (click)="activeTab.set(tab.id)">
                {{ tab.label }}
              </button>
            }
          </div>

          <!-- ══ Preview Tab ══ -->
          @if (activeTab() === 'preview') {
            <div class="tab-content">
              @for (sec of cvSections; track sec.name) {
                <div class="preview-section">
                  <div class="preview-section__header">
                    <span class="preview-section__label">{{ sec.name }}</span>
                    <span class="preview-section__score"
                      [class.preview-section__score--high]="sec.score >= 70"
                      [class.preview-section__score--mid]="sec.score >= 50 && sec.score < 70"
                      [class.preview-section__score--low]="sec.score < 50">
                      {{ sec.score }}%
                    </span>
                  </div>
                  <div class="preview-section__body">
                    @for (line of sec.content.split('\\n'); track line) {
                      <p class="preview-section__line">{{ line }}</p>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- ══ Sections Tab ══ -->
          @if (activeTab() === 'sections') {
            <div class="tab-content">
              @for (sec of cvSections; track sec.name) {
                <div class="edit-section">
                  <div class="edit-section__header">
                    <span class="edit-section__label">{{ sec.name }}</span>
                    <span class="edit-section__score"
                      [class.edit-section__score--high]="sec.score >= 70"
                      [class.edit-section__score--mid]="sec.score >= 50 && sec.score < 70"
                      [class.edit-section__score--low]="sec.score < 50">
                      {{ sec.score }}%
                    </span>
                  </div>
                  <textarea
                    class="edit-section__textarea"
                    [(ngModel)]="sec.content"
                    rows="5">
                  </textarea>
                  <button class="btn-ai-improve">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    AI Improve This Section
                  </button>
                </div>
              }
            </div>
          }

          <!-- ══ Enhancements Tab ══ -->
          @if (activeTab() === 'enhancements') {
            <div class="tab-content">
              @if (enhancements.length === 0) {
                <div class="empty-enhance">
                  <p class="empty-enhance__text">No enhancements yet. Use the AI to improve a section.</p>
                </div>
              } @else {
                <div class="enhance-list">
                  @for (e of enhancements; track e.jobTitle + e.date) {
                    <div class="enhance-row">
                      <div class="enhance-row__info">
                        <span class="enhance-row__job">{{ e.jobTitle }}</span>
                        <span class="enhance-row__date">{{ e.date }}</span>
                      </div>
                      <div class="enhance-row__scores">
                        <span class="enhance-row__before">{{ e.scoreBefore }}%</span>
                        <svg class="enhance-row__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        <span class="enhance-row__after">{{ e.scoreAfter }}%</span>
                      </div>
                      <a href="javascript:void(0)" class="enhance-row__link">View Changes</a>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 32px; max-width: 1320px; }

    /* ═══ Shared buttons ═══ */
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

    /* ═══ Page Header ═══ */
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

    /* ═══ Layout ═══ */
    .cv-layout {
      display: grid;
      grid-template-columns: 35% 1fr;
      gap: 24px;
    }
    @media (max-width: 960px) {
      .cv-layout { grid-template-columns: 1fr; }
    }

    /* ═══════════════════════════
       LEFT — CV LIST
    ═══════════════════════════ */
    .cv-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cv-card {
      position: relative;
      display: flex;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s;
    }
    .cv-card:hover { border-color: rgba(255,255,255,0.1); }

    .cv-card__left-strip {
      width: 4px;
      flex-shrink: 0;
      background: transparent;
      transition: background 0.2s;
    }
    .cv-card--active {
      border-color: rgba(46,232,165,0.2) !important;
    }
    .cv-card--active .cv-card__left-strip {
      background: var(--accent-teal);
    }

    .cv-card__body {
      flex: 1;
      padding: 16px 20px;
    }
    .cv-card__top {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .cv-card__title {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
    }
    .cv-card__version {
      padding: 1px 7px;
      border-radius: var(--radius-full);
      background: rgba(46,232,165,0.1);
      color: var(--accent-teal);
      font-size: 10px;
      font-weight: 700;
    }
    .cv-card__date {
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 12px;
      display: block;
    }
    .cv-card__bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Mini score ring */
    .mini-ring {
      position: relative;
      width: 48px;
      height: 48px;
    }
    .mini-ring svg { display: block; }
    .mini-ring__pct {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 13px;
      color: var(--text-primary);
    }

    /* Icon buttons */
    .cv-card__actions {
      display: flex;
      gap: 6px;
    }
    .cv-card__icon-btn {
      width: 30px;
      height: 30px;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      background: transparent;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .cv-card__icon-btn:hover {
      color: var(--text-primary);
      border-color: rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.03);
    }
    .cv-card__icon-btn--default {
      color: var(--accent-teal) !important;
      border-color: rgba(46,232,165,0.3) !important;
    }

    /* Upload dashed card */
    .cv-upload-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 24px;
      border: 2px dashed rgba(46,232,165,0.3);
      border-radius: var(--radius-lg);
      background: transparent;
      cursor: pointer;
      transition: all 0.2s;
    }
    .cv-upload-card:hover {
      border-color: var(--accent-teal);
      background: rgba(46,232,165,0.03);
    }
    .cv-upload-card__text {
      font-size: 13px;
      font-weight: 500;
      color: var(--accent-teal);
    }

    /* ═══════════════════════════
       RIGHT — PANEL
    ═══════════════════════════ */
    .cv-panel {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Tab row */
    .tab-row {
      display: flex;
      border-bottom: 1px solid var(--border-subtle);
      padding: 0 24px;
      gap: 0;
    }
    .tab-btn {
      padding: 14px 20px;
      font-size: 13px;
      font-weight: 500;
      font-family: var(--font-sans);
      color: var(--text-muted);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: -1px;
    }
    .tab-btn:hover { color: var(--text-secondary); }
    .tab-btn--active {
      color: var(--accent-teal) !important;
      border-bottom-color: var(--accent-teal) !important;
    }

    .tab-content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
      max-height: calc(100vh - 200px);
    }

    /* ─── Preview tab ─── */
    .preview-section {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .preview-section__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .preview-section__label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }
    .preview-section__score {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: var(--radius-full);
    }
    .preview-section__score--high { background: rgba(16,185,129,0.12); color: #10b981; }
    .preview-section__score--mid { background: rgba(245,158,11,0.12); color: #f59e0b; }
    .preview-section__score--low { background: rgba(239,68,68,0.12); color: #ef4444; }

    .preview-section__body { padding: 16px 20px; }
    .preview-section__line {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.7;
    }
    .preview-section__line + .preview-section__line { margin-top: 6px; }

    /* ─── Sections (edit) tab ─── */
    .edit-section {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 20px;
    }
    .edit-section__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .edit-section__label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }
    .edit-section__score {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: var(--radius-full);
    }
    .edit-section__score--high { background: rgba(16,185,129,0.12); color: #10b981; }
    .edit-section__score--mid { background: rgba(245,158,11,0.12); color: #f59e0b; }
    .edit-section__score--low { background: rgba(239,68,68,0.12); color: #ef4444; }

    .edit-section__textarea {
      width: 100%;
      padding: 14px 16px;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: var(--bg-card);
      color: var(--text-primary);
      font-family: var(--font-sans);
      font-size: 13px;
      line-height: 1.7;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s;
      margin-bottom: 12px;
    }
    .edit-section__textarea:focus {
      border-color: var(--accent-teal);
      box-shadow: 0 0 0 3px rgba(46,232,165,0.08);
    }

    .btn-ai-improve {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border: 1.5px solid var(--accent-teal);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--accent-teal);
      font-size: 12px;
      font-weight: 600;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-ai-improve:hover {
      background: rgba(46,232,165,0.06);
    }

    /* ─── Enhancements tab ─── */
    .enhance-list {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .enhance-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid var(--border-subtle);
    }
    .enhance-row:last-child { border-bottom: none; }

    .enhance-row__info { flex: 1; min-width: 0; }
    .enhance-row__job {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
    }
    .enhance-row__date {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
      display: block;
    }

    .enhance-row__scores {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .enhance-row__before {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
    }
    .enhance-row__arrow { color: var(--text-muted); }
    .enhance-row__after {
      font-size: 14px;
      font-weight: 700;
      color: var(--accent-teal);
    }

    .enhance-row__link {
      font-size: 12px;
      font-weight: 500;
      color: var(--accent-teal);
      text-decoration: none;
      white-space: nowrap;
      flex-shrink: 0;
      transition: opacity 0.2s;
    }
    .enhance-row__link:hover { opacity: 0.7; }

    .empty-enhance {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
    }
    .empty-enhance__text {
      font-size: 13px;
      color: var(--text-muted);
    }
  `]
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
