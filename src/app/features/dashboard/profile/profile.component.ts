import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type ProfileTab = 'overview' | 'experience' | 'projects' | 'assessments';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-page">
      <div class="profile-layout">

        <!-- ═══ LEFT SIDEBAR (35%) ═══ -->
        <aside class="profile-sidebar">
          <!-- Avatar -->
          <div class="avatar-wrap">
            <div class="avatar">
              <span class="avatar__initials">AK</span>
            </div>
          </div>
          <h1 class="profile-name">Alex Karev</h1>
          <p class="profile-headline">Full-Stack Engineer &amp; AI Enthusiast</p>
          <div class="profile-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            San Francisco, CA
          </div>

          <!-- Social links -->
          <div class="social-links">
            <a class="social-btn" href="javascript:void(0)" title="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
            <a class="social-btn" href="javascript:void(0)" title="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a class="social-btn" href="javascript:void(0)" title="Portfolio">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </a>
          </div>

          <!-- Readiness Score -->
          <div class="sidebar-card">
            <span class="sidebar-card__label">Overall Readiness</span>
            <div class="readiness-ring">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke="#2ee8a5" stroke-width="6"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="ringCircum"
                  [attr.stroke-dashoffset]="ringCircum * (1 - 0.72)"
                  style="transform: rotate(-90deg); transform-origin: center;"/>
              </svg>
              <span class="readiness-ring__pct">72%</span>
            </div>
          </div>

          <!-- Skills -->
          <div class="sidebar-card">
            <span class="sidebar-card__label">Skills</span>
            @for (group of skillGroups; track group.category) {
              <div class="skill-group">
                <span class="skill-group__cat">{{ group.category }}</span>
                @for (skill of group.skills; track skill.name) {
                  <div class="skill-row">
                    <span class="skill-row__name">{{ skill.name }}</span>
                    <div class="skill-row__bar">
                      <div class="skill-row__fill" [style.width.%]="skill.level"></div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Badges -->
          <div class="sidebar-card">
            <span class="sidebar-card__label">Badges</span>
            <div class="badges-grid">
              @for (badge of badges; track badge.name) {
                <div class="badge-chip" [title]="badge.name">
                  <span class="badge-chip__icon">{{ badge.icon }}</span>
                </div>
              }
            </div>
          </div>
        </aside>

        <!-- ═══ RIGHT: MAIN CONTENT (65%) ═══ -->
        <main class="profile-main">
          <!-- Tab row -->
          <div class="tab-row">
            @for (tab of tabs; track tab.id) {
              <button class="tab-btn"
                [class.tab-btn--active]="activeTab() === tab.id"
                (click)="activeTab.set(tab.id)">{{ tab.label }}</button>
            }
          </div>

          <!-- ══ OVERVIEW TAB ══ -->
          @if (activeTab() === 'overview') {
            <div class="tab-content">
              <!-- Bio -->
              <section class="content-card">
                <h3 class="content-card__title">Bio</h3>
                <p class="content-card__text">
                  I am a full-stack engineer with 4+ years of experience building scalable web applications and AI-powered tools. I specialize in Angular, Node.js, and cloud infrastructure, with a growing focus on machine learning integration. I thrive in fast-paced environments where I can ship impactful features and mentor junior developers.
                </p>
              </section>

              <!-- GitHub Activity -->
              <section class="content-card">
                <h3 class="content-card__title">GitHub Activity</h3>
                <div class="gh-score-row">
                  <span class="gh-score-label">Contribution Score</span>
                  <span class="gh-score-val">847</span>
                </div>
                <!-- Language bar chart -->
                <div class="lang-bars">
                  @for (lang of languages; track lang.name) {
                    <div class="lang-bar-row">
                      <span class="lang-bar-row__name">{{ lang.name }}</span>
                      <div class="lang-bar-row__track">
                        <div class="lang-bar-row__fill" [style.width.%]="lang.pct" [style.background]="lang.color"></div>
                      </div>
                      <span class="lang-bar-row__pct">{{ lang.pct }}%</span>
                    </div>
                  }
                </div>
                <!-- Top repos -->
                <div class="repos-section">
                  <span class="repos-section__label">Top Repositories</span>
                  @for (repo of topRepos; track repo.name) {
                    <div class="repo-row">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                      <span class="repo-row__name">{{ repo.name }}</span>
                      <span class="repo-row__stars">{{ repo.stars }} &#9733;</span>
                      <span class="repo-row__lang" [style.color]="repo.color">{{ repo.lang }}</span>
                    </div>
                  }
                </div>
              </section>

              <!-- LinkedIn Score -->
              <section class="content-card">
                <h3 class="content-card__title">LinkedIn Score</h3>
                <div class="li-scores">
                  @for (s of linkedinScores; track s.section) {
                    <div class="li-score-row">
                      <span class="li-score-row__label">{{ s.section }}</span>
                      <div class="li-score-row__track">
                        <div class="li-score-row__fill" [style.width.%]="s.score"></div>
                      </div>
                      <span class="li-score-row__val">{{ s.score }}%</span>
                    </div>
                  }
                </div>
              </section>
            </div>
          }

          <!-- ══ EXPERIENCE TAB ══ -->
          @if (activeTab() === 'experience') {
            <div class="tab-content">
              <div class="exp-timeline">
                @for (exp of experiences; track exp.company; let last = $last) {
                  <div class="tl-row" [class.tl-row--last]="last">
                    <div class="tl-rail">
                      <div class="tl-line"></div>
                      <div class="tl-node"></div>
                    </div>
                    <div class="exp-card">
                      <div class="exp-card__header">
                        <span class="exp-card__role">{{ exp.role }}</span>
                        <span class="exp-card__date">{{ exp.dateRange }}</span>
                      </div>
                      <span class="exp-card__company">{{ exp.company }}</span>
                      <ul class="exp-card__bullets">
                        @for (b of exp.bullets; track b) {
                          <li>{{ b }}</li>
                        }
                      </ul>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- ══ PROJECTS TAB ══ -->
          @if (activeTab() === 'projects') {
            <div class="tab-content">
              <div class="projects-grid">
                @for (proj of projects; track proj.name) {
                  <div class="proj-card">
                    <div class="proj-card__top">
                      <span class="proj-card__name">{{ proj.name }}</span>
                      <span class="proj-card__score"
                        [class.proj-card__score--high]="proj.aiScore >= 70"
                        [class.proj-card__score--mid]="proj.aiScore >= 50 && proj.aiScore < 70"
                        [class.proj-card__score--low]="proj.aiScore < 50">
                        {{ proj.aiScore }}
                      </span>
                    </div>
                    <div class="proj-card__tags">
                      @for (t of proj.techStack; track t) {
                        <span class="proj-tag">{{ t }}</span>
                      }
                    </div>
                    <a class="proj-card__link" href="javascript:void(0)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                      View on GitHub
                    </a>
                  </div>
                }
              </div>
            </div>
          }

          <!-- ══ ASSESSMENTS TAB ══ -->
          @if (activeTab() === 'assessments') {
            <div class="tab-content">
              <!-- Radar chart -->
              <section class="content-card">
                <h3 class="content-card__title">Skill Radar</h3>
                <div class="radar-wrap">
                  <svg viewBox="0 0 300 300" class="radar-svg">
                    <!-- Grid hexagons -->
                    @for (level of [1, 0.75, 0.5, 0.25]; track level) {
                      <polygon
                        [attr.points]="getHexPoints(150, 150, 120 * level)"
                        fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
                    }
                    <!-- Axes -->
                    @for (i of [0,1,2,3,4,5]; track i) {
                      <line [attr.x1]="150" [attr.y1]="150"
                        [attr.x2]="150 + 120 * cos(i)" [attr.y2]="150 + 120 * sin(i)"
                        stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
                    }
                    <!-- Data polygon -->
                    <polygon [attr.points]="radarPoints" fill="rgba(46,232,165,0.12)" stroke="#2ee8a5" stroke-width="2"/>
                    <!-- Data dots + labels -->
                    @for (axis of radarAxes; track axis.label; let i = $index) {
                      <circle [attr.cx]="150 + axis.value * 1.2 * cos(i)"
                              [attr.cy]="150 + axis.value * 1.2 * sin(i)"
                              r="4" fill="#2ee8a5"/>
                      <text [attr.x]="150 + 140 * cos(i)" [attr.y]="150 + 140 * sin(i)"
                        text-anchor="middle" fill="#a0a0b8" font-size="11" font-family="Inter">
                        {{ axis.label }}
                      </text>
                    }
                  </svg>
                </div>
              </section>

              <!-- Score History -->
              <section class="content-card">
                <h3 class="content-card__title">Score History</h3>
                <div class="score-history">
                  @for (entry of scoreHistory; track entry.date) {
                    <div class="history-row">
                      <span class="history-row__date">{{ entry.date }}</span>
                      <div class="history-row__bar-track">
                        <div class="history-row__bar-fill" [style.width.%]="entry.score"></div>
                      </div>
                      <span class="history-row__score">{{ entry.score }}%</span>
                    </div>
                  }
                </div>
              </section>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 32px; max-width: 1320px; }

    /* ═══ LAYOUT ═══ */
    .profile-layout {
      display: grid;
      grid-template-columns: 35% 1fr;
      gap: 24px;
    }
    @media (max-width: 960px) { .profile-layout { grid-template-columns: 1fr; } }

    /* ═══════════════════════════
       LEFT — PROFILE SIDEBAR
    ═══════════════════════════ */
    .profile-sidebar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    /* Avatar */
    .avatar-wrap { padding-top: 8px; }
    .avatar {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2ee8a5, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .avatar__initials {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 28px;
      color: #fff;
    }

    .profile-name {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 1.25rem;
      color: var(--text-primary);
      text-align: center;
    }
    .profile-headline {
      font-size: 13px;
      color: var(--text-muted);
      text-align: center;
      margin-top: -8px;
    }
    .profile-location {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-muted);
    }

    /* Social links */
    .social-links { display: flex; gap: 10px; }
    .social-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid var(--border-subtle);
      background: var(--bg-card);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      text-decoration: none;
      transition: all 0.2s;
    }
    .social-btn:hover { border-color: var(--accent-teal); color: var(--accent-teal); }

    /* Sidebar cards */
    .sidebar-card {
      width: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .sidebar-card__label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }

    /* Readiness ring */
    .readiness-ring {
      position: relative;
      width: 100px;
      height: 100px;
      align-self: center;
    }
    .readiness-ring svg { display: block; }
    .readiness-ring__pct {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 22px;
      color: var(--text-primary);
    }

    /* Skills */
    .skill-group { display: flex; flex-direction: column; gap: 8px; }
    .skill-group__cat {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .skill-row { display: flex; align-items: center; gap: 10px; }
    .skill-row__name {
      font-size: 12px;
      color: var(--text-muted);
      width: 90px;
      flex-shrink: 0;
    }
    .skill-row__bar {
      flex: 1;
      height: 5px;
      background: rgba(255,255,255,0.06);
      border-radius: 3px;
      overflow: hidden;
    }
    .skill-row__fill {
      height: 100%;
      background: var(--accent-teal);
      border-radius: 3px;
    }

    /* Badges */
    .badges-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .badge-chip {
      width: 40px;
      height: 40px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      cursor: default;
      transition: border-color 0.2s;
    }
    .badge-chip:hover { border-color: rgba(46,232,165,0.3); }

    /* ═══════════════════════════
       RIGHT — MAIN CONTENT
    ═══════════════════════════ */
    .profile-main {
      display: flex;
      flex-direction: column;
    }

    /* Tab bar */
    .tab-row {
      display: flex;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 24px;
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
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Content card */
    .content-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .content-card__title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }
    .content-card__text {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.75;
    }

    /* ─── GitHub Activity ─── */
    .gh-score-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .gh-score-label { font-size: 12px; color: var(--text-muted); }
    .gh-score-val {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 20px;
      color: var(--accent-teal);
    }
    .lang-bars { display: flex; flex-direction: column; gap: 8px; }
    .lang-bar-row { display: flex; align-items: center; gap: 10px; }
    .lang-bar-row__name {
      font-size: 12px;
      color: var(--text-secondary);
      width: 80px;
      flex-shrink: 0;
    }
    .lang-bar-row__track {
      flex: 1;
      height: 6px;
      background: rgba(255,255,255,0.06);
      border-radius: 3px;
      overflow: hidden;
    }
    .lang-bar-row__fill { height: 100%; border-radius: 3px; }
    .lang-bar-row__pct { font-size: 11px; color: var(--text-muted); width: 32px; text-align: right; }

    .repos-section { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
    .repos-section__label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }
    .repo-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--bg-tertiary);
      border-radius: var(--radius-sm);
    }
    .repo-row svg { color: var(--text-muted); flex-shrink: 0; }
    .repo-row__name { font-size: 13px; color: var(--text-primary); flex: 1; }
    .repo-row__stars { font-size: 11px; color: var(--text-muted); }
    .repo-row__lang { font-size: 11px; font-weight: 600; }

    /* ─── LinkedIn Score ─── */
    .li-scores { display: flex; flex-direction: column; gap: 10px; }
    .li-score-row { display: flex; align-items: center; gap: 10px; }
    .li-score-row__label { font-size: 12px; color: var(--text-secondary); width: 100px; flex-shrink: 0; }
    .li-score-row__track {
      flex: 1;
      height: 6px;
      background: rgba(255,255,255,0.06);
      border-radius: 3px;
      overflow: hidden;
    }
    .li-score-row__fill {
      height: 100%;
      background: var(--accent-blue);
      border-radius: 3px;
    }
    .li-score-row__val { font-size: 11px; color: var(--text-muted); width: 32px; text-align: right; }

    /* ─── Experience Timeline ─── */
    .exp-timeline { display: flex; flex-direction: column; }

    .tl-row {
      display: flex;
      position: relative;
    }
    .tl-rail {
      position: relative;
      width: 28px;
      flex-shrink: 0;
      display: flex;
      justify-content: center;
    }
    .tl-line {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      background: var(--border-subtle);
    }
    .tl-row--last .tl-line { height: 20px; }

    .tl-node {
      position: absolute;
      top: 6px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2.5px solid var(--accent-teal);
      background: var(--bg-primary);
      z-index: 2;
    }

    .exp-card {
      flex: 1;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px;
      margin-left: 12px;
      margin-bottom: 16px;
    }
    .exp-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .exp-card__role {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 700;
      font-size: 14px;
      color: var(--text-primary);
    }
    .exp-card__date {
      font-size: 11px;
      color: var(--text-muted);
    }
    .exp-card__company {
      font-size: 12px;
      color: var(--accent-teal);
      margin-bottom: 10px;
      display: block;
    }
    .exp-card__bullets {
      padding-left: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .exp-card__bullets li {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    /* ─── Projects Grid ─── */
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .proj-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.2s;
    }
    .proj-card:hover { border-color: rgba(255,255,255,0.1); }
    .proj-card__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .proj-card__name {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 700;
      font-size: 14px;
      color: var(--text-primary);
    }
    .proj-card__score {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 12px;
    }
    .proj-card__score--high { background: rgba(46,232,165,0.12); color: var(--accent-teal); }
    .proj-card__score--mid { background: rgba(245,158,11,0.12); color: #f59e0b; }
    .proj-card__score--low { background: rgba(239,68,68,0.12); color: #ef4444; }

    .proj-card__tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .proj-tag {
      padding: 3px 10px;
      border-radius: var(--radius-full);
      background: rgba(255,255,255,0.04);
      color: var(--text-muted);
      font-size: 11px;
    }
    .proj-card__link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.2s;
    }
    .proj-card__link:hover { color: var(--accent-teal); }

    /* ─── Radar Chart ─── */
    .radar-wrap {
      display: flex;
      justify-content: center;
      padding: 8px 0;
    }
    .radar-svg {
      width: 260px;
      height: 260px;
    }

    /* ─── Score History ─── */
    .score-history { display: flex; flex-direction: column; gap: 10px; }
    .history-row { display: flex; align-items: center; gap: 12px; }
    .history-row__date {
      font-size: 12px;
      color: var(--text-muted);
      width: 90px;
      flex-shrink: 0;
    }
    .history-row__bar-track {
      flex: 1;
      height: 6px;
      background: rgba(255,255,255,0.06);
      border-radius: 3px;
      overflow: hidden;
    }
    .history-row__bar-fill {
      height: 100%;
      background: var(--accent-teal);
      border-radius: 3px;
    }
    .history-row__score {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-primary);
      width: 36px;
      text-align: right;
    }
  `]
})
export class ProfileComponent {
  activeTab = signal<ProfileTab>('overview');
  tabs: { id: ProfileTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'assessments', label: 'Assessments' },
  ];

  ringCircum = 2 * Math.PI * 42;

  /* ── Skills ── */
  skillGroups = [
    { category: 'Frontend', skills: [
      { name: 'Angular', level: 88 },
      { name: 'React', level: 72 },
      { name: 'TypeScript', level: 90 },
    ]},
    { category: 'Backend', skills: [
      { name: 'Node.js', level: 82 },
      { name: 'Python', level: 60 },
      { name: 'PostgreSQL', level: 75 },
    ]},
    { category: 'DevOps', skills: [
      { name: 'Docker', level: 70 },
      { name: 'AWS', level: 55 },
      { name: 'CI/CD', level: 65 },
    ]},
  ];

  /* ── Badges ── */
  badges = [
    { name: 'Early Adopter', icon: '🚀' },
    { name: 'Code Streak 30', icon: '🔥' },
    { name: 'Quiz Master', icon: '🧠' },
    { name: 'Profile Complete', icon: '✅' },
    { name: 'Open Source', icon: '💎' },
    { name: 'Team Player', icon: '🤝' },
  ];

  /* ── GitHub data ── */
  languages = [
    { name: 'TypeScript', pct: 42, color: '#3178c6' },
    { name: 'Python', pct: 22, color: '#3572A5' },
    { name: 'JavaScript', pct: 18, color: '#f1e05a' },
    { name: 'SCSS', pct: 10, color: '#c6538c' },
    { name: 'Go', pct: 8, color: '#00ADD8' },
  ];

  topRepos = [
    { name: 'smarthire-platform', stars: 234, lang: 'TypeScript', color: '#3178c6' },
    { name: 'devsync-editor', stars: 189, lang: 'TypeScript', color: '#3178c6' },
    { name: 'ml-pipeline-utils', stars: 97, lang: 'Python', color: '#3572A5' },
    { name: 'infra-terraform', stars: 54, lang: 'Go', color: '#00ADD8' },
  ];

  /* ── LinkedIn scores ── */
  linkedinScores = [
    { section: 'Headline', score: 90 },
    { section: 'Summary', score: 78 },
    { section: 'Experience', score: 85 },
    { section: 'Skills', score: 65 },
    { section: 'Education', score: 92 },
  ];

  /* ── Experience ── */
  experiences = [
    {
      company: 'TechCorp',
      role: 'Software Engineer',
      dateRange: 'Mar 2023 – Present',
      bullets: [
        'Architected microservices processing 50k+ daily requests',
        'Led monolith-to-event-driven migration reducing latency 60%',
        'Reduced CI/CD pipeline time by 40% via parallel test execution',
      ],
    },
    {
      company: 'StartupXYZ',
      role: 'Junior Developer',
      dateRange: 'Jun 2021 – Feb 2023',
      bullets: [
        'Built RESTful APIs and React dashboards for internal tools',
        'Increased code coverage from 30% to 85% with automated tests',
        'Implemented OAuth2 login flow serving 12k+ users',
      ],
    },
    {
      company: 'University of Technology',
      role: 'Teaching Assistant — CS301',
      dateRange: 'Sep 2020 – May 2021',
      bullets: [
        'Led labs for Distributed Systems course (40 students)',
        'Authored automated grading scripts in Python',
      ],
    },
  ];

  /* ── Projects ── */
  projects = [
    { name: 'SmartHire Platform', techStack: ['Angular', 'NestJS', 'PostgreSQL', 'Docker'], aiScore: 88 },
    { name: 'DevSync Editor', techStack: ['TypeScript', 'WebSockets', 'OT', 'Redis'], aiScore: 82 },
    { name: 'ML Pipeline Utils', techStack: ['Python', 'PyTorch', 'FastAPI', 'Docker'], aiScore: 71 },
    { name: 'Infra Terraform Modules', techStack: ['Terraform', 'AWS', 'Go'], aiScore: 64 },
    { name: 'CLI Task Runner', techStack: ['Go', 'Cobra', 'SQLite'], aiScore: 52 },
    { name: 'Portfolio Site', techStack: ['Next.js', 'Tailwind', 'Vercel'], aiScore: 45 },
  ];

  /* ── Radar chart ── */
  radarAxes = [
    { label: 'Frontend', value: 85 },
    { label: 'Backend', value: 72 },
    { label: 'DevOps', value: 58 },
    { label: 'Algorithms', value: 65 },
    { label: 'Databases', value: 75 },
    { label: 'Soft Skills', value: 80 },
  ];

  get radarPoints(): string {
    return this.radarAxes.map((a, i) => {
      const x = 150 + a.value * 1.2 * this.cos(i);
      const y = 150 + a.value * 1.2 * this.sin(i);
      return `${x},${y}`;
    }).join(' ');
  }

  cos(i: number): number {
    return Math.cos(Math.PI * 2 * i / 6 - Math.PI / 2);
  }
  sin(i: number): number {
    return Math.sin(Math.PI * 2 * i / 6 - Math.PI / 2);
  }

  getHexPoints(cx: number, cy: number, r: number): string {
    return Array.from({ length: 6 }, (_, i) => {
      const x = cx + r * Math.cos(Math.PI * 2 * i / 6 - Math.PI / 2);
      const y = cy + r * Math.sin(Math.PI * 2 * i / 6 - Math.PI / 2);
      return `${x},${y}`;
    }).join(' ');
  }

  /* ── Score history ── */
  scoreHistory = [
    { date: 'Feb 20, 2026', score: 72 },
    { date: 'Jan 15, 2026', score: 65 },
    { date: 'Dec 10, 2025', score: 58 },
    { date: 'Nov 5, 2025', score: 52 },
    { date: 'Oct 1, 2025', score: 44 },
  ];
}
