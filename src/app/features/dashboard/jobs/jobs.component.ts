import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/* ── Types ── */
interface Job {
  id: number;
  title: string;
  company: string;
  companyInitials: string;
  companyColor: string;
  verified: boolean;
  locationType: string;
  contractType: string;
  salaryRange: string;
  experienceLevel: string;
  skills: string[];
  matchScore: number;
  postedDate: string;
  description: string;
  saved: boolean;
}

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="jobs-page">
      <!-- ═══ THREE-COLUMN LAYOUT ═══ -->
      <div class="jobs-layout">

        <!-- ─── LEFT: Filter Panel (260px) ─── -->
        <aside class="filter-panel">
          <div class="filter-panel__inner">
            <!-- Search -->
            <div class="filter-search">
              <svg class="filter-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input class="filter-search__input" type="text" placeholder="Search jobs…"
                [(ngModel)]="searchQuery" (input)="applySearch()"/>
            </div>

            <!-- Location Type -->
            <div class="filter-group">
              <span class="filter-group__label">Location Type</span>
              <div class="filter-pills">
                @for (opt of locationOptions; track opt) {
                  <button class="filter-pill"
                    [class.filter-pill--active]="locationFilters().includes(opt)"
                    (click)="toggleFilter('location', opt)">{{ opt }}</button>
                }
              </div>
            </div>

            <!-- Contract Type -->
            <div class="filter-group">
              <span class="filter-group__label">Contract Type</span>
              <div class="filter-checks">
                @for (opt of contractOptions; track opt) {
                  <label class="filter-check">
                    <input type="checkbox"
                      [checked]="contractFilters().includes(opt)"
                      (change)="toggleFilter('contract', opt)"/>
                    <span class="filter-check__box"></span>
                    <span class="filter-check__text">{{ opt }}</span>
                  </label>
                }
              </div>
            </div>

            <!-- Experience Level -->
            <div class="filter-group">
              <span class="filter-group__label">Experience Level</span>
              <div class="filter-pills">
                @for (opt of experienceOptions; track opt) {
                  <button class="filter-pill"
                    [class.filter-pill--active]="experienceFilters().includes(opt)"
                    (click)="toggleFilter('experience', opt)">{{ opt }}</button>
                }
              </div>
            </div>

            <!-- Salary Range -->
            <div class="filter-group">
              <span class="filter-group__label">Salary Range</span>
              <div class="salary-slider">
                <div class="salary-slider__track">
                  <div class="salary-slider__fill"
                    [style.left.%]="salaryMin() / 2000"
                    [style.width.%]="(salaryMax() - salaryMin()) / 2000">
                  </div>
                </div>
                <input type="range" class="salary-slider__input salary-slider__input--min"
                  min="0" max="200000" step="5000"
                  [ngModel]="salaryMin()"
                  (ngModelChange)="onSalaryMinChange($event)"/>
                <input type="range" class="salary-slider__input salary-slider__input--max"
                  min="0" max="200000" step="5000"
                  [ngModel]="salaryMax()"
                  (ngModelChange)="onSalaryMaxChange($event)"/>
              </div>
              <div class="salary-labels">
                <span class="salary-labels__val">\${{ (salaryMin() / 1000) }}k</span>
                <span class="salary-labels__val">\${{ (salaryMax() / 1000) }}k</span>
              </div>
            </div>

            <!-- Tech Stack -->
            <div class="filter-group">
              <span class="filter-group__label">Tech Stack</span>
              <div class="tech-input-wrap">
                <input class="tech-input" type="text" placeholder="Type a skill…"
                  [(ngModel)]="techQuery"
                  (keydown.enter)="addTechTag()" />
              </div>
              @if (techSuggestions().length > 0) {
                <div class="tech-suggestions">
                  @for (s of techSuggestions(); track s) {
                    <button class="tech-suggestion" (click)="pickTechTag(s)">{{ s }}</button>
                  }
                </div>
              }
              <div class="tech-tags">
                @for (tag of techFilters(); track tag) {
                  <span class="tech-tag">
                    {{ tag }}
                    <button class="tech-tag__remove" (click)="removeTechTag(tag)">&times;</button>
                  </span>
                }
              </div>
            </div>

            <!-- Action buttons -->
            <div class="filter-actions">
              <button class="btn-apply-filters" (click)="applySearch()">Apply Filters</button>
              <button class="btn-clear-all" (click)="clearFilters()">Clear all</button>
            </div>
          </div>
        </aside>

        <!-- ─── CENTER: Job List ─── -->
        <section class="job-list">
          <div class="job-list__header">
            <span class="job-list__count">{{ filteredJobs().length }} open positions</span>
            <div class="job-list__sort">
              <span class="job-list__sort-label">Sort by:</span>
              <select class="job-list__sort-select" [(ngModel)]="sortOption">
                <option value="match">Best Match</option>
                <option value="recent">Most Recent</option>
                <option value="salary">Highest Salary</option>
              </select>
            </div>
          </div>

          <div class="job-list__cards">
            @for (job of filteredJobs(); track job.id) {
              <div class="job-card"
                [class.job-card--selected]="selectedJobId() === job.id"
                (click)="selectedJobId.set(job.id)">
                <div class="job-card__strip"></div>
                <div class="job-card__body">
                  <!-- Top row -->
                  <div class="job-card__top">
                    <div class="job-card__logo" [style.background]="job.companyColor">
                      {{ job.companyInitials }}
                    </div>
                    <div class="job-card__info">
                      <span class="job-card__title">{{ job.title }}</span>
                      <span class="job-card__company">{{ job.company }}</span>
                    </div>
                    <div class="match-badge"
                      [class.match-badge--high]="job.matchScore >= 70"
                      [class.match-badge--mid]="job.matchScore >= 50 && job.matchScore < 70"
                      [class.match-badge--low]="job.matchScore < 50">
                      <svg width="40" height="40" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3"/>
                        <circle cx="20" cy="20" r="16" fill="none"
                          [attr.stroke]="job.matchScore >= 70 ? '#2ee8a5' : job.matchScore >= 50 ? '#f59e0b' : '#6b6b80'"
                          stroke-width="3" stroke-linecap="round"
                          [attr.stroke-dasharray]="matchCircum"
                          [attr.stroke-dashoffset]="matchCircum * (1 - job.matchScore / 100)"
                          style="transform: rotate(-90deg); transform-origin: center;"/>
                      </svg>
                      <span class="match-badge__pct">{{ job.matchScore }}</span>
                    </div>
                  </div>
                  <!-- Info chips -->
                  <div class="job-card__chips">
                    <span class="info-chip">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {{ job.locationType }}
                    </span>
                    <span class="info-chip">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                      {{ job.contractType }}
                    </span>
                    <span class="info-chip">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      {{ job.salaryRange }}
                    </span>
                  </div>
                  <!-- Skill tags -->
                  <div class="job-card__skills">
                    @for (skill of job.skills; track skill) {
                      <span class="skill-tag"
                        [class.skill-tag--match]="userSkills.includes(skill)"
                        [class.skill-tag--miss]="!userSkills.includes(skill)">
                        {{ skill }}
                      </span>
                    }
                  </div>
                  <!-- Bottom row -->
                  <div class="job-card__bottom">
                    <span class="job-card__date">{{ job.postedDate }}</span>
                    <div class="job-card__btns">
                      <button class="btn-save" [class.btn-save--saved]="job.saved"
                        (click)="toggleSave(job, $event)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        {{ job.saved ? 'Saved' : 'Save' }}
                      </button>
                      <button class="btn-apply" (click)="$event.stopPropagation()">Apply</button>
                    </div>
                  </div>
                </div>
              </div>
            }

            @if (filteredJobs().length === 0) {
              <div class="empty-jobs">
                <p class="empty-jobs__text">No jobs match your filters. Try broadening your criteria.</p>
              </div>
            }
          </div>
        </section>

        <!-- ─── RIGHT: Job Detail Panel (380px) ─── -->
        <aside class="detail-panel">
          @if (selectedJob(); as job) {
            <div class="detail-panel__inner">
              <!-- Company header -->
              <div class="detail-header">
                <div class="detail-header__logo" [style.background]="job.companyColor">
                  {{ job.companyInitials }}
                </div>
                <div class="detail-header__info">
                  <div class="detail-header__company-row">
                    <span class="detail-header__company">{{ job.company }}</span>
                    @if (job.verified) {
                      <span class="verified-badge" title="Verified employer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#2ee8a5" stroke="none"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                      </span>
                    }
                  </div>
                </div>
              </div>

              <h2 class="detail-title">{{ job.title }}</h2>

              <!-- Info chips -->
              <div class="detail-chips">
                <span class="detail-chip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {{ job.locationType }}
                </span>
                <span class="detail-chip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                  {{ job.contractType }}
                </span>
                <span class="detail-chip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  {{ job.salaryRange }}
                </span>
                <span class="detail-chip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  {{ job.experienceLevel }}
                </span>
              </div>

              <!-- Description -->
              <div class="detail-description">
                @for (para of job.description.split('\\n'); track para) {
                  <p class="detail-description__para">{{ para }}</p>
                }
              </div>

              <!-- Required Skills -->
              <div class="detail-section">
                <h3 class="detail-section__title">Required Skills</h3>
                <div class="detail-skills">
                  @for (skill of job.skills; track skill) {
                    <span class="skill-tag"
                      [class.skill-tag--match]="userSkills.includes(skill)"
                      [class.skill-tag--miss]="!userSkills.includes(skill)">
                      {{ skill }}
                    </span>
                  }
                </div>
              </div>

              <!-- AI Match Breakdown -->
              <div class="detail-section">
                <h3 class="detail-section__title">AI Match Breakdown</h3>
                <div class="ai-breakdown" [class.ai-breakdown--open]="breakdownOpen()">
                  <button class="ai-breakdown__toggle" (click)="breakdownOpen.set(!breakdownOpen())">
                    <span class="ai-breakdown__score"
                      [class.ai-breakdown__score--high]="job.matchScore >= 70"
                      [class.ai-breakdown__score--mid]="job.matchScore >= 50 && job.matchScore < 70"
                      [class.ai-breakdown__score--low]="job.matchScore < 50">
                      {{ job.matchScore }}% match
                    </span>
                    <svg class="ai-breakdown__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  @if (breakdownOpen()) {
                    <div class="ai-breakdown__body">
                      <div class="ai-breakdown__group">
                        <span class="ai-breakdown__group-label ai-breakdown__group-label--match">Matched Skills</span>
                        <div class="ai-breakdown__tags">
                          @for (skill of getMatchedSkills(job); track skill) {
                            <span class="bd-tag bd-tag--match">{{ skill }}</span>
                          }
                        </div>
                      </div>
                      <div class="ai-breakdown__group">
                        <span class="ai-breakdown__group-label ai-breakdown__group-label--miss">Missing Skills</span>
                        <div class="ai-breakdown__tags">
                          @for (skill of getMissingSkills(job); track skill) {
                            <span class="bd-tag bd-tag--miss">{{ skill }}</span>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Sticky bottom buttons -->
              <div class="detail-actions">
                <button class="btn-detail-save" [class.btn-detail-save--saved]="job.saved"
                  (click)="toggleSave(job, $event)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  {{ job.saved ? 'Saved' : 'Save Job' }}
                </button>
                <button class="btn-detail-apply">Apply Now</button>
              </div>
            </div>
          }
        </aside>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .jobs-page { height: calc(100vh - 64px); overflow: hidden; }

    /* ═══ THREE-COLUMN GRID ═══ */
    .jobs-layout {
      display: grid;
      grid-template-columns: 260px 1fr 380px;
      height: 100%;
    }
    @media (max-width: 1100px) {
      .jobs-layout { grid-template-columns: 240px 1fr; }
      .detail-panel { display: none; }
    }

    /* ═══════════════════════════════════
       LEFT — FILTER PANEL
    ═══════════════════════════════════ */
    .filter-panel {
      border-right: 1px solid var(--border-subtle);
      background: var(--bg-card);
      overflow-y: auto;
    }
    .filter-panel__inner {
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    /* Search */
    .filter-search {
      position: relative;
    }
    .filter-search__icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }
    .filter-search__input {
      width: 100%;
      padding: 10px 12px 10px 36px;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: var(--bg-tertiary);
      color: var(--text-primary);
      font-size: 13px;
      font-family: var(--font-sans);
      outline: none;
      transition: border-color 0.2s;
    }
    .filter-search__input::placeholder { color: var(--text-muted); }
    .filter-search__input:focus { border-color: var(--accent-teal); }

    /* Filter group */
    .filter-group { display: flex; flex-direction: column; gap: 10px; }
    .filter-group__label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }

    /* Toggle pills */
    .filter-pills { display: flex; flex-wrap: wrap; gap: 6px; }
    .filter-pill {
      padding: 5px 14px;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--text-secondary);
      font-size: 12px;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-pill:hover { border-color: rgba(255,255,255,0.12); }
    .filter-pill--active {
      background: rgba(46,232,165,0.1) !important;
      border-color: var(--accent-teal) !important;
      color: var(--accent-teal) !important;
    }

    /* Checkboxes */
    .filter-checks { display: flex; flex-direction: column; gap: 8px; }
    .filter-check {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }
    .filter-check input { display: none; }
    .filter-check__box {
      width: 16px;
      height: 16px;
      border: 1.5px solid var(--border-subtle);
      border-radius: 4px;
      background: var(--bg-tertiary);
      position: relative;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    .filter-check input:checked + .filter-check__box {
      background: var(--accent-teal);
      border-color: var(--accent-teal);
    }
    .filter-check input:checked + .filter-check__box::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 5px;
      width: 4px;
      height: 8px;
      border: solid var(--bg-primary);
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
    .filter-check__text {
      font-size: 13px;
      color: var(--text-secondary);
    }

    /* Salary slider */
    .salary-slider {
      position: relative;
      height: 28px;
    }
    .salary-slider__track {
      position: absolute;
      top: 12px;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--border-subtle);
      border-radius: 2px;
    }
    .salary-slider__fill {
      position: absolute;
      top: 0;
      height: 100%;
      background: var(--accent-teal);
      border-radius: 2px;
    }
    .salary-slider__input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
      pointer-events: none;
      outline: none;
    }
    .salary-slider__input::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--accent-teal);
      border: 2px solid var(--bg-card);
      cursor: pointer;
      pointer-events: auto;
    }
    .salary-slider__input::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--accent-teal);
      border: 2px solid var(--bg-card);
      cursor: pointer;
      pointer-events: auto;
    }
    .salary-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
    }
    .salary-labels__val {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
    }

    /* Tech stack input */
    .tech-input-wrap { position: relative; }
    .tech-input {
      width: 100%;
      padding: 9px 12px;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: var(--bg-tertiary);
      color: var(--text-primary);
      font-size: 13px;
      font-family: var(--font-sans);
      outline: none;
      transition: border-color 0.2s;
    }
    .tech-input::placeholder { color: var(--text-muted); }
    .tech-input:focus { border-color: var(--accent-teal); }
    .tech-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }
    .tech-suggestion {
      padding: 4px 10px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      background: var(--bg-tertiary);
      color: var(--text-secondary);
      font-size: 11px;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: all 0.15s;
    }
    .tech-suggestion:hover {
      border-color: var(--accent-teal);
      color: var(--accent-teal);
    }
    .tech-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }
    .tech-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      background: rgba(46,232,165,0.1);
      color: var(--accent-teal);
      font-size: 11px;
      font-weight: 500;
    }
    .tech-tag__remove {
      background: none;
      border: none;
      color: var(--accent-teal);
      font-size: 14px;
      cursor: pointer;
      line-height: 1;
      padding: 0;
      opacity: 0.6;
      transition: opacity 0.15s;
    }
    .tech-tag__remove:hover { opacity: 1; }

    /* Filter actions */
    .filter-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 8px;
    }
    .btn-apply-filters {
      width: 100%;
      padding: 10px;
      border: none;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #2ee8a5, #14b8a6);
      color: var(--bg-primary);
      font-size: 13px;
      font-weight: 600;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-apply-filters:hover { opacity: 0.88; }
    .btn-clear-all {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 12px;
      font-family: var(--font-sans);
      cursor: pointer;
      text-align: center;
      transition: color 0.2s;
    }
    .btn-clear-all:hover { color: var(--text-secondary); }

    /* ═══════════════════════════════════
       CENTER — JOB LIST
    ═══════════════════════════════════ */
    .job-list {
      overflow-y: auto;
      padding: 24px;
    }
    .job-list__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .job-list__count {
      font-size: 13px;
      color: var(--text-muted);
    }
    .job-list__sort {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .job-list__sort-label {
      font-size: 12px;
      color: var(--text-muted);
    }
    .job-list__sort-select {
      padding: 5px 10px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      background: var(--bg-card);
      color: var(--text-secondary);
      font-size: 12px;
      font-family: var(--font-sans);
      outline: none;
      cursor: pointer;
    }

    .job-list__cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Job card */
    .job-card {
      display: flex;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s;
    }
    .job-card:hover { border-color: rgba(255,255,255,0.1); }
    .job-card__strip {
      width: 4px;
      flex-shrink: 0;
      background: transparent;
      transition: background 0.2s;
    }
    .job-card--selected {
      border-color: rgba(46,232,165,0.2) !important;
    }
    .job-card--selected .job-card__strip {
      background: var(--accent-teal);
    }
    .job-card__body {
      flex: 1;
      padding: 18px 20px;
      min-width: 0;
    }

    /* Top row */
    .job-card__top {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 12px;
    }
    .job-card__logo {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }
    .job-card__info {
      flex: 1;
      min-width: 0;
    }
    .job-card__title {
      display: block;
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 700;
      font-size: 14px;
      color: var(--text-primary);
    }
    .job-card__company {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
      display: block;
    }

    /* Match badge */
    .match-badge {
      position: relative;
      width: 40px;
      height: 40px;
      flex-shrink: 0;
    }
    .match-badge svg { display: block; }
    .match-badge__pct {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 11px;
      color: var(--text-primary);
    }

    /* Info chips row */
    .job-card__chips {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .info-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .info-chip svg { color: var(--text-muted); }

    /* Skill tags */
    .job-card__skills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 14px;
    }
    .skill-tag {
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 500;
    }
    .skill-tag--match {
      background: rgba(46,232,165,0.1);
      color: var(--accent-teal);
    }
    .skill-tag--miss {
      background: rgba(255,255,255,0.04);
      color: var(--text-muted);
    }

    /* Bottom row */
    .job-card__bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .job-card__date {
      font-size: 11px;
      color: var(--text-muted);
    }
    .job-card__btns {
      display: flex;
      gap: 8px;
    }
    .btn-save {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 14px;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-muted);
      font-size: 12px;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-save:hover { border-color: rgba(255,255,255,0.12); color: var(--text-secondary); }
    .btn-save--saved {
      border-color: var(--accent-teal) !important;
      color: var(--accent-teal) !important;
    }
    .btn-apply {
      padding: 6px 18px;
      border: none;
      border-radius: var(--radius-md);
      background: var(--accent-teal);
      color: var(--bg-primary);
      font-size: 12px;
      font-weight: 600;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-apply:hover { opacity: 0.88; }

    .empty-jobs {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
    }
    .empty-jobs__text {
      font-size: 13px;
      color: var(--text-muted);
    }

    /* ═══════════════════════════════════
       RIGHT — DETAIL PANEL
    ═══════════════════════════════════ */
    .detail-panel {
      border-left: 1px solid var(--border-subtle);
      background: var(--bg-card);
      overflow-y: auto;
    }
    .detail-panel__inner {
      padding: 28px 24px 100px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Company header */
    .detail-header {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .detail-header__logo {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }
    .detail-header__company-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .detail-header__company {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-secondary);
    }
    .verified-badge {
      display: inline-flex;
      align-items: center;
    }

    .detail-title {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 1.2rem;
      color: var(--text-primary);
      line-height: 1.3;
    }

    /* Detail chips */
    .detail-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .detail-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      font-size: 12px;
      color: var(--text-secondary);
    }
    .detail-chip svg { color: var(--text-muted); }

    /* Description */
    .detail-description__para {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.75;
    }
    .detail-description__para + .detail-description__para { margin-top: 12px; }

    /* Sections */
    .detail-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .detail-section__title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }
    .detail-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    /* AI Breakdown */
    .ai-breakdown {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .ai-breakdown__toggle {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border: none;
      background: none;
      cursor: pointer;
    }
    .ai-breakdown__score {
      font-size: 13px;
      font-weight: 600;
    }
    .ai-breakdown__score--high { color: var(--accent-teal); }
    .ai-breakdown__score--mid { color: #f59e0b; }
    .ai-breakdown__score--low { color: var(--text-muted); }
    .ai-breakdown__chevron {
      color: var(--text-muted);
      transition: transform 0.2s;
    }
    .ai-breakdown--open .ai-breakdown__chevron { transform: rotate(180deg); }

    .ai-breakdown__body {
      padding: 0 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .ai-breakdown__group { display: flex; flex-direction: column; gap: 6px; }
    .ai-breakdown__group-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .ai-breakdown__group-label--match { color: var(--accent-teal); }
    .ai-breakdown__group-label--miss { color: #f59e0b; }
    .ai-breakdown__tags { display: flex; flex-wrap: wrap; gap: 5px; }
    .bd-tag {
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 500;
    }
    .bd-tag--match {
      background: rgba(46,232,165,0.1);
      color: var(--accent-teal);
    }
    .bd-tag--miss {
      background: rgba(245,158,11,0.1);
      color: #f59e0b;
    }

    /* Sticky bottom actions */
    .detail-actions {
      position: fixed;
      bottom: 0;
      right: 0;
      width: 380px;
      display: flex;
      gap: 10px;
      padding: 16px 24px;
      background: var(--bg-card);
      border-top: 1px solid var(--border-subtle);
    }
    .btn-detail-save {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 11px;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 500;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-detail-save:hover { border-color: rgba(255,255,255,0.12); }
    .btn-detail-save--saved {
      border-color: var(--accent-teal) !important;
      color: var(--accent-teal) !important;
    }
    .btn-detail-apply {
      flex: 1;
      padding: 11px;
      border: none;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #2ee8a5, #14b8a6);
      color: var(--bg-primary);
      font-size: 13px;
      font-weight: 600;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-detail-apply:hover { opacity: 0.88; }
  `]
})
export class JobsComponent {
  /* ── User's current skills (for match highlighting) ── */
  userSkills = ['TypeScript', 'Angular', 'Node.js', 'PostgreSQL', 'Docker', 'Python', 'React', 'AWS', 'Git', 'REST APIs'];

  /* ── Signals ── */
  selectedJobId = signal(1);
  breakdownOpen = signal(false);
  sortOption = 'match';
  searchQuery = '';
  techQuery = '';

  /* ── Filter state ── */
  locationFilters = signal<string[]>([]);
  contractFilters = signal<string[]>([]);
  experienceFilters = signal<string[]>([]);
  salaryMin = signal(0);
  salaryMax = signal(200000);
  techFilters = signal<string[]>([]);

  /* ── Filter options ── */
  locationOptions = ['Remote', 'Hybrid', 'On-site'];
  contractOptions = ['Internship', 'Full-time', 'Part-time', 'Freelance'];
  experienceOptions = ['Junior', 'Mid', 'Senior'];

  allTechOptions = [
    'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C++',
    'Angular', 'React', 'Vue', 'Svelte', 'Next.js', 'Node.js', 'NestJS', 'Express',
    'PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'GraphQL', 'REST APIs',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform',
    'Git', 'CI/CD', 'Linux', 'Kafka', 'RabbitMQ',
  ];

  /* ── Match ring math ── */
  matchCircum = 2 * Math.PI * 16; // ≈ 100.53

  /* ── Job data ── */
  allJobs: Job[] = [
    {
      id: 1,
      title: 'Senior Frontend Engineer',
      company: 'Spotify',
      companyInitials: 'SP',
      companyColor: '#1DB954',
      verified: true,
      locationType: 'Remote',
      contractType: 'Full-time',
      salaryRange: '$130k – $175k',
      experienceLevel: 'Senior',
      skills: ['TypeScript', 'React', 'GraphQL', 'Node.js', 'CI/CD', 'Docker'],
      matchScore: 82,
      postedDate: 'Feb 23, 2026',
      description: 'We are looking for a Senior Frontend Engineer to join the Web Player team at Spotify. You will architect and build high-performance UI components that serve millions of daily listeners.\nYou will collaborate with designers, backend engineers, and product managers to ship features across our desktop and web platforms. A strong understanding of state management, accessibility, and performance optimization is essential.\nThis is a fully remote position open to candidates across Europe and North America.',
      saved: false,
    },
    {
      id: 2,
      title: 'Full-Stack Developer',
      company: 'Stripe',
      companyInitials: 'ST',
      companyColor: '#635BFF',
      verified: true,
      locationType: 'Hybrid',
      contractType: 'Full-time',
      salaryRange: '$140k – $190k',
      experienceLevel: 'Senior',
      skills: ['TypeScript', 'React', 'Ruby', 'PostgreSQL', 'AWS', 'Kubernetes'],
      matchScore: 74,
      postedDate: 'Feb 21, 2026',
      description: 'Stripe is hiring a Full-Stack Developer to work on the Payments Dashboard. You will own features end-to-end, from database design through API development to polished frontend interfaces.\nOur stack includes React, TypeScript, Ruby on Rails, and PostgreSQL, all deployed on AWS with Kubernetes. You will also contribute to our internal design system and developer tools.\nHybrid role based in San Francisco or New York, with 3 days per week in-office.',
      saved: true,
    },
    {
      id: 3,
      title: 'Backend Engineer',
      company: 'Datadog',
      companyInitials: 'DD',
      companyColor: '#632CA6',
      verified: true,
      locationType: 'Remote',
      contractType: 'Full-time',
      salaryRange: '$120k – $160k',
      experienceLevel: 'Mid',
      skills: ['Go', 'Python', 'Kafka', 'PostgreSQL', 'Kubernetes', 'Terraform'],
      matchScore: 58,
      postedDate: 'Feb 19, 2026',
      description: 'Join Datadog as a Backend Engineer to build the next generation of our real-time monitoring pipeline. You will work on high-throughput distributed systems that process billions of events daily.\nThe ideal candidate has experience with Go, message queues (Kafka), and container orchestration. You will contribute to system design, performance profiling, and incident response.\nFully remote within the US and Canada.',
      saved: false,
    },
    {
      id: 4,
      title: 'Junior Frontend Developer',
      company: 'Figma',
      companyInitials: 'FG',
      companyColor: '#F24E1E',
      verified: false,
      locationType: 'On-site',
      contractType: 'Full-time',
      salaryRange: '$75k – $100k',
      experienceLevel: 'Junior',
      skills: ['TypeScript', 'React', 'CSS', 'REST APIs', 'Git'],
      matchScore: 88,
      postedDate: 'Feb 18, 2026',
      description: 'Figma is looking for a Junior Frontend Developer to join our growing Design Tools team. You will help build and maintain interactive UI components used by millions of designers and developers.\nYou should be comfortable with TypeScript, React, and modern CSS techniques. Experience with canvas rendering or WebGL is a plus, but not required.\nThis is an on-site position at our San Francisco office with excellent mentorship opportunities.',
      saved: false,
    },
    {
      id: 5,
      title: 'DevOps Engineer',
      company: 'GitLab',
      companyInitials: 'GL',
      companyColor: '#FC6D26',
      verified: true,
      locationType: 'Remote',
      contractType: 'Full-time',
      salaryRange: '$110k – $150k',
      experienceLevel: 'Mid',
      skills: ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'Linux', 'CI/CD', 'Python'],
      matchScore: 65,
      postedDate: 'Feb 17, 2026',
      description: 'GitLab seeks a DevOps Engineer to improve our cloud infrastructure and deployment pipelines. You will automate provisioning, enhance monitoring, and ensure high reliability across all production services.\nExperience with Terraform, Kubernetes, and at least one major cloud provider is required. We are a fully remote company with asynchronous communication at its core.\nThis role offers significant autonomy and the opportunity to work across many engineering teams.',
      saved: false,
    },
    {
      id: 6,
      title: 'Software Engineer Intern',
      company: 'Vercel',
      companyInitials: 'VC',
      companyColor: '#000',
      verified: false,
      locationType: 'Remote',
      contractType: 'Internship',
      salaryRange: '$4k – $6k/mo',
      experienceLevel: 'Junior',
      skills: ['TypeScript', 'Next.js', 'React', 'Node.js', 'Git'],
      matchScore: 71,
      postedDate: 'Feb 15, 2026',
      description: 'Vercel is offering a summer internship for aspiring Software Engineers. You will work alongside our platform team to build tooling that empowers frontend developers around the world.\nIdeal candidates are comfortable with TypeScript and Next.js, and have a passion for developer experience. You will ship real features used by hundreds of thousands of developers.\nFully remote internship, 12 weeks, with mentorship from senior engineers.',
      saved: false,
    },
    {
      id: 7,
      title: 'AI/ML Engineer',
      company: 'OpenAI',
      companyInitials: 'OA',
      companyColor: '#10a37f',
      verified: true,
      locationType: 'Hybrid',
      contractType: 'Full-time',
      salaryRange: '$180k – $250k',
      experienceLevel: 'Senior',
      skills: ['Python', 'PyTorch', 'Kubernetes', 'AWS', 'C++', 'Linux'],
      matchScore: 42,
      postedDate: 'Feb 14, 2026',
      description: 'OpenAI is hiring an AI/ML Engineer to push the boundaries of large language models. You will design and train models at scale, optimize inference performance, and contribute to safety research.\nStrong experience with Python, PyTorch, and distributed training is essential. Familiarity with CUDA, C++, and ML systems engineering is highly valued.\nHybrid role based in San Francisco with flexible remote days.',
      saved: false,
    },
    {
      id: 8,
      title: 'Freelance React Developer',
      company: 'Toptal',
      companyInitials: 'TT',
      companyColor: '#204ECF',
      verified: false,
      locationType: 'Remote',
      contractType: 'Freelance',
      salaryRange: '$70 – $120/hr',
      experienceLevel: 'Mid',
      skills: ['React', 'TypeScript', 'Node.js', 'REST APIs', 'MongoDB', 'Git'],
      matchScore: 79,
      postedDate: 'Feb 12, 2026',
      description: 'Toptal is looking for skilled React Developers to join our freelance network and work with Fortune 500 clients. Projects range from greenfield applications to complex platform migrations.\nYou should have at least 3 years of professional React experience and strong communication skills. TypeScript proficiency and Node.js backend knowledge are a plus.\nFlexible hours, fully remote, choose your own projects.',
      saved: false,
    },
  ];

  /* ── Computed ── */
  filteredJobs = computed(() => {
    let jobs = [...this.allJobs];

    // Search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.skills.some(s => s.toLowerCase().includes(q))
      );
    }

    // Location
    const locs = this.locationFilters();
    if (locs.length) jobs = jobs.filter(j => locs.includes(j.locationType));

    // Contract
    const ctrs = this.contractFilters();
    if (ctrs.length) jobs = jobs.filter(j => ctrs.includes(j.contractType));

    // Experience
    const exps = this.experienceFilters();
    if (exps.length) jobs = jobs.filter(j => exps.includes(j.experienceLevel));

    // Tech stack
    const techs = this.techFilters();
    if (techs.length) jobs = jobs.filter(j => techs.some(t => j.skills.includes(t)));

    // Sort
    if (this.sortOption === 'match') {
      jobs.sort((a, b) => b.matchScore - a.matchScore);
    } else if (this.sortOption === 'recent') {
      jobs.sort((a, b) => b.id - a.id);
    }

    return jobs;
  });

  selectedJob = computed(() => {
    return this.allJobs.find(j => j.id === this.selectedJobId()) ?? this.allJobs[0];
  });

  techSuggestions = computed(() => {
    const q = this.techQuery.toLowerCase().trim();
    if (!q) return [];
    const active = this.techFilters();
    return this.allTechOptions
      .filter(t => t.toLowerCase().includes(q) && !active.includes(t))
      .slice(0, 6);
  });

  /* ── Methods ── */
  toggleFilter(type: 'location' | 'contract' | 'experience', value: string): void {
    const sigMap = {
      location: this.locationFilters,
      contract: this.contractFilters,
      experience: this.experienceFilters,
    };
    const sig = sigMap[type];
    const current = sig();
    if (current.includes(value)) {
      sig.set(current.filter(v => v !== value));
    } else {
      sig.set([...current, value]);
    }
  }

  onSalaryMinChange(val: number): void {
    if (val <= this.salaryMax()) this.salaryMin.set(val);
  }

  onSalaryMaxChange(val: number): void {
    if (val >= this.salaryMin()) this.salaryMax.set(val);
  }

  addTechTag(): void {
    const q = this.techQuery.trim();
    if (!q) return;
    const match = this.allTechOptions.find(t => t.toLowerCase() === q.toLowerCase());
    if (match && !this.techFilters().includes(match)) {
      this.techFilters.set([...this.techFilters(), match]);
    }
    this.techQuery = '';
  }

  pickTechTag(tag: string): void {
    if (!this.techFilters().includes(tag)) {
      this.techFilters.set([...this.techFilters(), tag]);
    }
    this.techQuery = '';
  }

  removeTechTag(tag: string): void {
    this.techFilters.set(this.techFilters().filter(t => t !== tag));
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.locationFilters.set([]);
    this.contractFilters.set([]);
    this.experienceFilters.set([]);
    this.salaryMin.set(0);
    this.salaryMax.set(200000);
    this.techFilters.set([]);
    this.techQuery = '';
  }

  applySearch(): void {
    // Filters are reactive — this is a no-op trigger if needed
  }

  toggleSave(job: Job, event: Event): void {
    event.stopPropagation();
    job.saved = !job.saved;
  }

  getMatchedSkills(job: Job): string[] {
    return job.skills.filter(s => this.userSkills.includes(s));
  }

  getMissingSkills(job: Job): string[] {
    return job.skills.filter(s => !this.userSkills.includes(s));
  }
}
