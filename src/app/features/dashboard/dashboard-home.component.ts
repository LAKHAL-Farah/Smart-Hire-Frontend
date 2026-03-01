import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ════════ READINESS SCORE ════════ -->
    <section class="readiness">
      <div class="readiness__ring-wrap">
        <svg class="readiness__ring" width="110" height="110" viewBox="0 0 110 110">
          <defs>
            <linearGradient id="readGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#2ee8a5"/>
              <stop offset="100%" stop-color="#14b8a6"/>
            </linearGradient>
          </defs>
          <circle cx="55" cy="55" r="50" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>
          <circle cx="55" cy="55" r="50" fill="none" stroke="url(#readGrad)" stroke-width="8"
            stroke-linecap="round"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="dashOffset"
            style="transform: rotate(-90deg); transform-origin: center;"
          />
        </svg>
        <span class="readiness__pct">{{ readinessScore }}%</span>
      </div>
      <div class="readiness__info">
        <h2 class="readiness__title">Career Readiness Score</h2>
        <p class="readiness__ai">Based on your skill assessments, interview practice, and roadmap progress, you are <strong>above average</strong> for your target role.</p>
        <div class="readiness__links">
          <a class="readiness__link" href="javascript:void(0)">View full report</a>
          <a class="readiness__link" href="javascript:void(0)">Improve score</a>
        </div>
      </div>
    </section>

    <!-- ════════ STAT CARDS ════════ -->
    <section class="stats">
      @for (s of statCards; track s.label) {
        <div class="stat-card">
          <div class="stat-card__icon" [innerHTML]="s.icon"></div>
          <div class="stat-card__body">
            <span class="stat-card__value">{{ s.value }}</span>
            <span class="stat-card__label">{{ s.label }}</span>
          </div>
          <span class="stat-card__trend" [class.stat-card__trend--up]="s.up" [class.stat-card__trend--down]="!s.up">
            {{ s.up ? '&#9650;' : '&#9660;' }} {{ s.trend }}
          </span>
        </div>
      }
    </section>

    <!-- ════════ TWO-COLUMN LAYOUT ════════ -->
    <section class="columns">
      <!-- LEFT (60 %) -->
      <div class="col-left">
        <!-- AI Recommendations -->
        <div class="card">
          <div class="card__header">
            <h3 class="card__title">
              <svg class="card__title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2ee8a5" stroke-width="1.8"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              AI Recommendations
            </h3>
            <button class="card__header-btn">View All</button>
          </div>
          <div class="recs">
            @for (r of recommendations; track r.title) {
              <div class="rec">
                <span class="rec__badge" [style.background]="r.badgeColor">{{ r.priority }}</span>
                <div class="rec__body">
                  <span class="rec__title">{{ r.title }}</span>
                  <span class="rec__desc">{{ r.desc }}</span>
                </div>
                <span class="rec__time">{{ r.time }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Skill Gap Summary -->
        <div class="card">
          <div class="card__header">
            <h3 class="card__title">
              <svg class="card__title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Skill Gap Summary
            </h3>
          </div>
          <div class="skills">
            @for (sk of skills; track sk.name) {
              <div class="skill-row">
                <div class="skill-row__meta">
                  <span class="skill-row__name">{{ sk.name }}</span>
                  <span class="skill-row__pct">{{ sk.pct }}%</span>
                </div>
                <div class="skill-row__track">
                  <div class="skill-row__fill" [style.width.%]="sk.pct" [style.background]="sk.color"></div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- RIGHT (40 %) -->
      <div class="col-right">
        <!-- Upcoming Steps -->
        <div class="card">
          <div class="card__header">
            <h3 class="card__title">
              <svg class="card__title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Upcoming Steps
            </h3>
          </div>
          <div class="steps">
            @for (st of upcomingSteps; track st.text) {
              <label class="step-item">
                <input type="checkbox" [checked]="st.done" (change)="st.done = !st.done" />
                <span class="step-item__check"></span>
                <div class="step-item__body">
                  <span class="step-item__text" [class.step-item__text--done]="st.done">{{ st.text }}</span>
                  <span class="step-item__due">{{ st.due }}</span>
                </div>
              </label>
            }
          </div>
        </div>

        <!-- Streak Tracker -->
        <div class="card">
          <div class="card__header">
            <h3 class="card__title">
              <span class="streak-flame">&#x1F525;</span>
              Streak Tracker
            </h3>
            <span class="streak-count">{{ streakDays }}-day streak</span>
          </div>
          <div class="streak-days">
            @for (d of weekDays; track d.day) {
              <div class="streak-day" [class.streak-day--active]="d.active" [class.streak-day--today]="d.today">
                <span class="streak-day__label">{{ d.day }}</span>
                <div class="streak-day__circle">
                  @if (d.active) {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card">
          <div class="card__header">
            <h3 class="card__title">
              <svg class="card__title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Recent Activity
            </h3>
          </div>
          <div class="activity">
            @for (a of activities; track a.text) {
              <div class="activity-row">
                <span class="activity-row__dot" [style.background]="a.color"></span>
                <span class="activity-row__text">{{ a.text }}</span>
                <span class="activity-row__time">{{ a.time }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      padding: 32px;
      max-width: 1280px;
    }

    /* ─── Readiness ─── */
    .readiness {
      display: flex;
      align-items: center;
      gap: 28px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 28px 32px;
      margin-bottom: 24px;
    }
    .readiness__ring-wrap {
      position: relative;
      flex-shrink: 0;
      width: 110px;
      height: 110px;
    }
    .readiness__ring { display: block; }
    .readiness__pct {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 26px;
      color: var(--accent-teal);
    }
    .readiness__info { flex: 1; }
    .readiness__title {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 700;
      font-size: 18px;
      color: var(--text-primary);
      margin-bottom: 8px;
    }
    .readiness__ai {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .readiness__ai strong { color: var(--accent-teal); font-weight: 600; }
    .readiness__links { display: flex; gap: 20px; }
    .readiness__link {
      font-size: 13px;
      font-weight: 500;
      color: var(--accent-teal);
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .readiness__link:hover { opacity: 0.7; }

    /* ─── Stats ─── */
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      position: relative;
    }
    .stat-card__icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(46,232,165,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--accent-teal);
    }
    .stat-card__body { flex: 1; }
    .stat-card__value {
      display: block;
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 26px;
      color: var(--text-primary);
      line-height: 1.2;
    }
    .stat-card__label {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .stat-card__trend {
      position: absolute;
      top: 16px;
      right: 16px;
      font-size: 11px;
      font-weight: 600;
    }
    .stat-card__trend--up { color: #2ee8a5; }
    .stat-card__trend--down { color: #f44336; }

    /* ─── Two-column layout ─── */
    .columns {
      display: grid;
      grid-template-columns: 6fr 4fr;
      gap: 24px;
    }

    /* ─── Card shared ─── */
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px 24px;
      margin-bottom: 20px;
    }
    .card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .card__title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 15px;
      color: var(--text-primary);
    }
    .card__title-icon { flex-shrink: 0; }
    .card__header-btn {
      background: none;
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 4px 12px;
      font-size: 11px;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
    }
    .card__header-btn:hover { color: var(--text-primary); border-color: rgba(255,255,255,0.12); }

    /* ─── Recommendations ─── */
    .recs { display: flex; flex-direction: column; gap: 10px; }
    .rec {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border-radius: var(--radius-md);
      background: var(--bg-tertiary);
      transition: background 0.15s;
    }
    .rec:hover { background: rgba(255,255,255,0.04); }
    .rec__badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      color: var(--bg-primary);
      text-transform: uppercase;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .rec__body { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .rec__title { font-size: 13px; font-weight: 500; color: var(--text-primary); }
    .rec__desc { font-size: 12px; color: var(--text-muted); line-height: 1.4; }
    .rec__time { font-size: 11px; color: var(--text-muted); white-space: nowrap; flex-shrink: 0; }

    /* ─── Skills ─── */
    .skills { display: flex; flex-direction: column; gap: 14px; }
    .skill-row__meta { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .skill-row__name { font-size: 13px; color: var(--text-secondary); }
    .skill-row__pct { font-size: 12px; font-weight: 600; color: var(--text-muted); }
    .skill-row__track {
      height: 6px;
      border-radius: 3px;
      background: rgba(255,255,255,0.06);
      overflow: hidden;
    }
    .skill-row__fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.5s ease;
    }

    /* ─── Upcoming Steps ─── */
    .steps { display: flex; flex-direction: column; gap: 8px; }
    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      transition: background 0.15s;
    }
    .step-item:hover { background: rgba(255,255,255,0.02); }
    .step-item input { display: none; }
    .step-item__check {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      border: 1.5px solid rgba(255,255,255,0.15);
      flex-shrink: 0;
      margin-top: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .step-item input:checked + .step-item__check {
      background: var(--accent-teal);
      border-color: var(--accent-teal);
    }
    .step-item input:checked + .step-item__check::after {
      content: '\\2713';
      color: var(--bg-primary);
      font-size: 11px;
      font-weight: 700;
    }
    .step-item__body { flex: 1; }
    .step-item__text { font-size: 13px; color: var(--text-primary); display: block; }
    .step-item__text--done { text-decoration: line-through; opacity: 0.5; }
    .step-item__due { font-size: 11px; color: var(--text-muted); margin-top: 2px; display: block; }

    /* ─── Streak ─── */
    .streak-flame { font-size: 16px; }
    .streak-count {
      font-size: 12px;
      font-weight: 600;
      color: var(--accent-teal);
    }
    .streak-days {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .streak-day {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .streak-day__label {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .streak-day__circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
      border: 1.5px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--bg-primary);
      transition: all 0.2s;
    }
    .streak-day--active .streak-day__circle {
      background: var(--accent-teal);
      border-color: var(--accent-teal);
    }
    .streak-day--today .streak-day__label {
      color: var(--accent-teal);
    }

    /* ─── Activity ─── */
    .activity { display: flex; flex-direction: column; gap: 6px; }
    .activity-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-subtle);
    }
    .activity-row:last-child { border-bottom: none; }
    .activity-row__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .activity-row__text {
      flex: 1;
      font-size: 13px;
      color: var(--text-secondary);
    }
    .activity-row__time {
      font-size: 11px;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    /* ─── Responsive ─── */
    @media (max-width: 1024px) {
      .stats { grid-template-columns: repeat(2, 1fr); }
      .columns { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardHomeComponent {
  readinessScore = 62;
  circumference = 2 * Math.PI * 50;            // ≈ 314.16
  get dashOffset(): number {
    return this.circumference * (1 - this.readinessScore / 100);
  }

  statCards = [
    {
      label: 'Interview Sessions',
      value: '4',
      trend: '+2 this week',
      up: true,
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
    },
    {
      label: 'Roadmap Progress',
      value: '67%',
      trend: '+8%',
      up: true,
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
    },
    {
      label: 'Skills Acquired',
      value: '12',
      trend: '+3 new',
      up: true,
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
    },
    {
      label: 'Applications Sent',
      value: '3',
      trend: '-1',
      up: false,
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>'
    }
  ];

  recommendations = [
    { priority: 'High', badgeColor: '#ef4444', title: 'Complete Docker Fundamentals', desc: 'Critical skill gap for your target DevOps role.', time: '2h ago' },
    { priority: 'Medium', badgeColor: '#f59e0b', title: 'Practice System Design Interview', desc: 'Schedule a mock session to improve your score.', time: '5h ago' },
    { priority: 'High', badgeColor: '#ef4444', title: 'Update your CV summary section', desc: 'AI detected outdated experience section.', time: '1d ago' },
    { priority: 'Low', badgeColor: '#6366f1', title: 'Explore new job matches', desc: '3 new openings match your profile.', time: '2d ago' }
  ];

  skills = [
    { name: 'JavaScript', pct: 78, color: '#f59e0b' },
    { name: 'Docker', pct: 34, color: '#ef4444' },
    { name: 'System Design', pct: 45, color: '#f97316' },
    { name: 'SQL', pct: 82, color: '#2ee8a5' },
    { name: 'TypeScript', pct: 61, color: '#3b82f6' }
  ];

  upcomingSteps = [
    { text: 'Complete Docker module 3/5', due: 'Due tomorrow', done: false },
    { text: 'Take JavaScript assessment', due: 'Due in 3 days', done: false },
    { text: 'Review CV with AI feedback', due: 'Due next week', done: true }
  ];

  streakDays = 5;
  weekDays = [
    { day: 'Mon', active: true, today: false },
    { day: 'Tue', active: true, today: false },
    { day: 'Wed', active: true, today: false },
    { day: 'Thu', active: true, today: false },
    { day: 'Fri', active: true, today: true },
    { day: 'Sat', active: false, today: false },
    { day: 'Sun', active: false, today: false }
  ];

  activities = [
    { text: 'Completed "Intro to Docker" lesson', time: '10 min ago', color: '#2ee8a5' },
    { text: 'Scored 8.4/10 on mock interview', time: '1 hour ago', color: '#8b5cf6' },
    { text: 'Updated profile skills section', time: '3 hours ago', color: '#3b82f6' },
    { text: 'Applied to Frontend Dev @ Spotify', time: 'Yesterday', color: '#f59e0b' },
    { text: 'Completed TypeScript assessment', time: '2 days ago', color: '#6366f1' }
  ];
}
