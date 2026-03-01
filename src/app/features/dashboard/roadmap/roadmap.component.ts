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
  template: `
    <div class="roadmap-page">
      <div class="roadmap-main">
        <!-- ═══ PAGE HEADER ═══ -->
        <section class="page-header">
          <div class="page-header__left">
            <h1 class="page-header__title">My Learning Roadmap</h1>
            <p class="page-header__sub">Backend Engineer &middot; Estimated 14 weeks &middot; Started Jan 2025</p>
          </div>
          <div class="page-header__right">
            <button class="btn-ghost">Regenerate with AI &#x21BB;</button>
            <button class="btn-primary-grad">Add Custom Step +</button>
          </div>
        </section>

        <!-- ═══ PROGRESS BAR ═══ -->
        <section class="progress-section">
          <div class="progress-section__labels">
            <span class="progress-section__label-left">PROGRESS</span>
            <span class="progress-section__label-right">{{ completedCount }} of {{ steps.length }} steps</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="progressPct()"></div>
            <span class="progress-chip" [style.left.%]="progressPct()">{{ progressPct() }}%</span>
          </div>
        </section>

        <!-- ═══ FILTER / TAB ROW ═══ -->
        <section class="filter-row">
          <div class="filter-tabs">
            @for (tab of filterTabs; track tab.value) {
              <button
                class="filter-tab"
                [class.filter-tab--active]="activeFilter() === tab.value"
                (click)="activeFilter.set(tab.value)">
                {{ tab.label }}
              </button>
            }
          </div>
          <div class="sort-dropdown">
            <span class="sort-label">Sort: Manual Order &#x25BE;</span>
          </div>
        </section>

        <!-- ═══ TIMELINE ═══ -->
        @if (filteredSteps().length > 0) {
          <section class="timeline">
            @for (step of filteredSteps(); track step.number; let i = $index) {
              <div class="tl-row" [class.tl-row--last]="i === filteredSteps().length - 1">
                <!-- Vertical line segment -->
                <div class="tl-rail">
                  <div class="tl-node"
                    [class.tl-node--done]="step.status === 'done'"
                    [class.tl-node--progress]="step.status === 'in-progress'"
                    [class.tl-node--pending]="step.status === 'pending'">
                    @if (step.status === 'done') {
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    }
                  </div>
                </div>
                <!-- Connector + Card -->
                <div class="tl-card-wrap">
                  <div class="tl-connector"></div>
                  <div
                    class="tl-card"
                    [class.tl-card--expanded]="expandedStep() === step.number"
                    [class.tl-card--done]="step.status === 'done'"
                    [class.tl-card--progress]="step.status === 'in-progress'"
                    (click)="toggleStep(step.number)">
                    <!-- Card header (always visible) -->
                    <div class="tl-card__header">
                      <div class="tl-card__left">
                        <div class="tl-card__meta-row">
                          <span class="tl-card__step-num">Step {{ step.number | number: '2.0-0' }}</span>
                          <span class="tl-badge"
                            [class.tl-badge--done]="step.status === 'done'"
                            [class.tl-badge--progress]="step.status === 'in-progress'"
                            [class.tl-badge--pending]="step.status === 'pending'">
                            {{ step.status === 'done' ? 'Completed' : step.status === 'in-progress' ? 'In Progress' : 'Pending' }}
                          </span>
                        </div>
                        <h4 class="tl-card__title">{{ step.title }}</h4>
                        <p class="tl-card__desc">{{ step.description }}</p>
                      </div>
                      <div class="tl-card__right">
                        <div class="tl-card__time">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <span>{{ step.estimatedTime }}</span>
                        </div>
                        <svg class="tl-card__chevron" [class.tl-card__chevron--open]="expandedStep() === step.number" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                    </div>

                    <!-- Expanded content -->
                    @if (expandedStep() === step.number) {
                      <div class="tl-card__body" (click)="$event.stopPropagation()">
                        <div class="tl-card__divider"></div>
                        <span class="tl-card__section-label">LEARNING RESOURCES</span>
                        <div class="tl-resources">
                          @for (res of step.resources; track res.title) {
                            <div class="tl-res">
                              <div class="tl-res__icon" [class]="'tl-res__icon--' + res.type">
                                @if (res.type === 'video') {
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                } @else if (res.type === 'article') {
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                } @else {
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/></svg>
                                }
                              </div>
                              <div class="tl-res__body">
                                <span class="tl-res__title">{{ res.title }}</span>
                                <span class="tl-res__source">{{ res.source }}</span>
                              </div>
                              <a [href]="res.url" target="_blank" class="tl-res__open" (click)="$event.stopPropagation()">Open &rarr;</a>
                            </div>
                          }
                        </div>
                        <div class="tl-card__actions">
                          @if (step.status !== 'done') {
                            <button class="btn-mark-complete" (click)="markComplete(step); $event.stopPropagation()">Mark as Complete &#x2713;</button>
                          }
                          <button class="btn-skip" (click)="$event.stopPropagation()">Skip Step</button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </section>
        } @else {
          <!-- ═══ EMPTY STATE ═══ -->
          <section class="empty-state">
            <svg class="empty-state__svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="rgba(255,255,255,0.06)" stroke-width="2" stroke-dasharray="6 4"/>
              <circle cx="40" cy="40" r="24" stroke="rgba(46,232,165,0.2)" stroke-width="1.5" stroke-dasharray="4 3"/>
              <circle cx="40" cy="16" r="3" fill="#2ee8a5" opacity="0.6"/>
              <circle cx="58" cy="52" r="3" fill="#3b82f6" opacity="0.5"/>
              <circle cx="22" cy="52" r="3" fill="#8b5cf6" opacity="0.5"/>
              <path d="M40 28 L40 52" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M28 40 L52 40" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <h3 class="empty-state__heading">{{ emptyHeading() }}</h3>
            <p class="empty-state__sub">{{ emptySubtext() }}</p>
            <button class="btn-primary-grad empty-state__cta">Begin Step 1 &rarr;</button>
          </section>
        }
      </div>

      <!-- ═══ RIGHT MINI-PANEL ═══ -->
      <aside class="mini-panel">
        <div class="mini-panel__inner">
          <h3 class="mini-panel__career">Backend Engineer</h3>

          <!-- Progress Ring -->
          <div class="mini-panel__ring-wrap">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#2ee8a5"/>
                  <stop offset="100%" stop-color="#14b8a6"/>
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="7"/>
              <circle cx="50" cy="50" r="44" fill="none" stroke="url(#ringGrad)" stroke-width="7"
                stroke-linecap="round"
                [attr.stroke-dasharray]="ringCircum"
                [attr.stroke-dashoffset]="ringOffset()"
                style="transform: rotate(-90deg); transform-origin: center;"
              />
            </svg>
            <span class="mini-panel__ring-pct">{{ progressPct() }}%</span>
          </div>

          <!-- Upcoming Steps -->
          <span class="mini-panel__section-label">NEXT STEPS</span>
          <div class="mini-panel__next-steps">
            @for (s of nextThreeSteps(); track s.number) {
              <div class="mini-panel__step-row">
                <span class="mini-panel__step-num">{{ s.number }}.</span>
                <span class="mini-panel__step-title">{{ s.title }}</span>
              </div>
            }
          </div>

          <!-- Estimate -->
          <div class="mini-panel__estimate">
            <span class="mini-panel__estimate-label">Your Completion Estimate</span>
            <span class="mini-panel__estimate-date">Est. completion: May 2026</span>
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 32px; }

    /* ─── Page layout 70/30 ─── */
    .roadmap-page {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 32px;
      max-width: 1320px;
    }
    @media (max-width: 1200px) {
      .roadmap-page { grid-template-columns: 1fr; }
      .mini-panel { display: none; }
    }

    /* ─── Page Header ─── */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 28px;
    }
    .page-header__title {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 1.3rem;
      color: var(--text-primary);
      line-height: 1.2;
    }
    .page-header__sub {
      font-size: 14px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .page-header__right {
      display: flex;
      gap: 10px;
      flex-shrink: 0;
      align-items: center;
    }

    /* ─── Buttons ─── */
    .btn-ghost {
      padding: 8px 18px;
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

    .btn-primary-grad {
      padding: 8px 20px;
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

    /* ─── Progress Section ─── */
    .progress-section {
      margin-bottom: 24px;
    }
    .progress-section__labels {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .progress-section__label-left {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }
    .progress-section__label-right {
      font-size: 11px;
      color: var(--text-muted);
    }
    .progress-track {
      position: relative;
      height: 6px;
      border-radius: 8px;
      background: var(--border-subtle);
      overflow: visible;
    }
    .progress-fill {
      height: 100%;
      border-radius: 8px;
      background: linear-gradient(90deg, #2ee8a5, #14b8a6);
      transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .progress-chip {
      position: absolute;
      top: -22px;
      transform: translateX(-50%);
      background: var(--accent-teal);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 100px;
      line-height: 1.4;
      white-space: nowrap;
      transition: left 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    }

    /* ─── Filter Tabs ─── */
    .filter-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
    }
    .filter-tabs { display: flex; gap: 8px; }
    .filter-tab {
      padding: 8px 16px;
      border-radius: 100px;
      border: 1px solid var(--border-subtle);
      background: transparent;
      color: var(--text-muted);
      font-size: 13px;
      font-family: var(--font-sans);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-tab:hover { border-color: var(--border-hover); color: var(--text-secondary); }
    .filter-tab--active {
      background: var(--accent-teal) !important;
      border-color: var(--accent-teal) !important;
      color: var(--bg-primary) !important;
      font-weight: 600;
    }
    .sort-dropdown { cursor: pointer; }
    .sort-label {
      font-size: 13px;
      color: var(--text-muted);
    }

    /* ══════════════════════════════
       TIMELINE
    ══════════════════════════════ */
    .timeline {
      position: relative;
    }

    .tl-row {
      display: flex;
      align-items: stretch;
      position: relative;
      min-height: 80px;
    }

    /* Rail (vertical line + node) */
    .tl-rail {
      position: relative;
      width: 28px;
      flex-shrink: 0;
      display: flex;
      justify-content: center;
    }
    .tl-rail::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      background: var(--border-subtle);
    }
    .tl-row--last .tl-rail::before {
      height: 50%;
    }

    .tl-node {
      position: absolute;
      top: 28px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      background: var(--bg-primary);
    }
    .tl-node--done {
      background: #10b981;
    }
    .tl-node--progress {
      background: var(--bg-primary);
      border: 2.5px solid var(--accent-teal);
      animation: pulse-glow 2s ease-in-out infinite;
    }
    .tl-node--pending {
      background: var(--bg-primary);
      border: 2px solid var(--border-subtle);
    }

    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(46,232,165,0.35); }
      50% { box-shadow: 0 0 0 8px rgba(46,232,165,0); }
    }

    /* Connector line from node → card */
    .tl-card-wrap {
      display: flex;
      align-items: flex-start;
      flex: 1;
      padding-bottom: 16px;
      padding-top: 12px;
    }
    .tl-connector {
      width: 20px;
      height: 2px;
      background: var(--border-subtle);
      margin-top: 24px;
      flex-shrink: 0;
    }

    /* Card */
    .tl-card {
      flex: 1;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px 24px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .tl-card:hover {
      border-color: rgba(46, 232, 165, 0.15);
    }
    .tl-card--progress {
      border-color: rgba(46, 232, 165, 0.12);
    }
    .tl-card--done {
      opacity: 0.75;
    }
    .tl-card--done:hover { opacity: 0.9; }

    .tl-card__header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
    }
    .tl-card__left { flex: 1; min-width: 0; }
    .tl-card__meta-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .tl-card__step-num {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* Badges */
    .tl-badge {
      display: inline-flex;
      align-items: center;
      height: 22px;
      padding: 0 10px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 600;
      line-height: 1;
    }
    .tl-badge--done {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10b981;
    }
    .tl-badge--progress {
      background: rgba(46, 232, 165, 0.12);
      border: 1px solid rgba(46, 232, 165, 0.3);
      color: var(--accent-teal);
    }
    .tl-badge--pending {
      background: rgba(30, 58, 95, 0.5);
      color: var(--text-muted);
    }

    .tl-card__title {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 700;
      font-size: 1rem;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    .tl-card__desc {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .tl-card__right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      flex-shrink: 0;
    }
    .tl-card__time {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: var(--text-muted);
    }
    .tl-card__chevron {
      color: var(--text-muted);
      transition: transform 0.2s;
    }
    .tl-card__chevron--open {
      transform: rotate(180deg);
    }

    /* ─── Expanded Body ─── */
    .tl-card__body {
      cursor: default;
    }
    .tl-card__divider {
      height: 1px;
      background: var(--border-subtle);
      margin: 16px 0;
    }
    .tl-card__section-label {
      display: block;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    /* Resources */
    .tl-resources {
      display: flex;
      flex-direction: column;
    }
    .tl-res {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-subtle);
    }
    .tl-res:last-child { border-bottom: none; }

    .tl-res__icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .tl-res__icon--video { background: rgba(59,130,246,0.12); color: #3b82f6; }
    .tl-res__icon--article { background: rgba(249,115,22,0.12); color: #f97316; }
    .tl-res__icon--course { background: rgba(139,92,246,0.12); color: #8b5cf6; }

    .tl-res__body { flex: 1; min-width: 0; }
    .tl-res__title { font-size: 0.875rem; color: var(--text-primary); display: block; }
    .tl-res__source { font-size: 11px; color: var(--text-muted); display: block; margin-top: 1px; }
    .tl-res__open {
      font-size: 12px;
      color: var(--accent-teal);
      text-decoration: none;
      white-space: nowrap;
      font-weight: 500;
      flex-shrink: 0;
      transition: opacity 0.2s;
    }
    .tl-res__open:hover { opacity: 0.7; }

    /* Actions */
    .tl-card__actions {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 18px;
    }
    .btn-mark-complete {
      padding: 8px 20px;
      border: 1.5px solid var(--accent-teal);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--accent-teal);
      font-size: 13px;
      font-family: var(--font-sans);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-mark-complete:hover {
      background: rgba(46,232,165,0.08);
    }
    .btn-skip {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 13px;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: color 0.2s;
    }
    .btn-skip:hover { color: var(--text-secondary); }

    /* ═══ EMPTY STATE ═══ */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 64px 24px;
    }
    .empty-state__svg { margin-bottom: 24px; opacity: 0.8; }
    .empty-state__heading {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 500;
      font-size: 1.1rem;
      color: var(--text-primary);
      margin-bottom: 8px;
    }
    .empty-state__sub {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 20px;
    }
    .empty-state__cta {
      margin-top: 4px;
    }

    /* ═══ MINI PANEL (right sidebar) ═══ */
    .mini-panel {
      position: relative;
    }
    .mini-panel__inner {
      position: sticky;
      top: 96px; /* 64px topbar + 32px padding */
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 24px;
    }
    .mini-panel__career {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 700;
      font-size: 16px;
      color: var(--text-primary);
      margin-bottom: 20px;
      text-align: center;
    }

    .mini-panel__ring-wrap {
      position: relative;
      width: 100px;
      height: 100px;
      margin: 0 auto 24px;
    }
    .mini-panel__ring-wrap svg { display: block; }
    .mini-panel__ring-pct {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 22px;
      color: var(--accent-teal);
    }

    .mini-panel__section-label {
      display: block;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin-bottom: 12px;
    }
    .mini-panel__next-steps {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 24px;
    }
    .mini-panel__step-row {
      display: flex;
      gap: 8px;
      font-size: 13px;
    }
    .mini-panel__step-num { color: var(--text-muted); flex-shrink: 0; }
    .mini-panel__step-title { color: var(--text-secondary); }

    .mini-panel__estimate {
      border-top: 1px solid var(--border-subtle);
      padding-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mini-panel__estimate-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }
    .mini-panel__estimate-date {
      font-size: 13px;
      color: var(--text-secondary);
    }
  `]
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
