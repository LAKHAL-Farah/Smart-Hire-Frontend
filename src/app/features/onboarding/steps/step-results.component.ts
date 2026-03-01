import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-step-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="step">
      <h1 class="step__headline">
        Here's your <span class="step__gradient">AI profile</span>
      </h1>
      <p class="step__sub">Based on your answers, here's where you stand and where to go next.</p>

      <div class="result-grid">
        <!-- LEFT: Radar + Bars -->
        <div class="result-card result-card--radar">
          <span class="result-card__label">Skill Breakdown</span>

          <!-- Radar chart SVG -->
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

              <!-- Grid rings -->
              @for (ring of [0.33, 0.66, 1]; track ring) {
                <polygon
                  [attr.points]="getHexPoints(150, 125, 100 * ring)"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  stroke-width="1"
                />
              }

              <!-- Axis lines -->
              @for (i of axisIndices; track i) {
                <line
                  x1="150" y1="125"
                  [attr.x2]="getAxisPoint(i, 100).x"
                  [attr.y2]="getAxisPoint(i, 100).y"
                  stroke="rgba(255,255,255,0.04)"
                  stroke-width="1"
                />
              }

              <!-- Data polygon -->
              <polygon
                [attr.points]="dataPoints()"
                fill="url(#radarGrad)"
                stroke="url(#radarStroke)"
                stroke-width="1.5"
              />

              <!-- Data dots -->
              @for (skill of skills; track skill.name; let i = $index) {
                <circle
                  [attr.cx]="getAxisPoint(i, skill.score).x"
                  [attr.cy]="getAxisPoint(i, skill.score).y"
                  r="3.5"
                  fill="#2ee8a5"
                />
              }

              <!-- Labels -->
              @for (skill of skills; track skill.name; let i = $index) {
                <text
                  [attr.x]="getAxisPoint(i, 118).x"
                  [attr.y]="getAxisPoint(i, 118).y"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  fill="#6b6b80"
                  font-size="10.5"
                  font-family="Inter, sans-serif"
                >{{ skill.name }}</text>
              }
            </svg>
          </div>

          <!-- Bar rows -->
          <div class="skill-bars">
            @for (skill of skills; track skill.name) {
              <div class="skill-bar-row">
                <span class="skill-bar-row__name">{{ skill.name }}</span>
                <div class="skill-bar-row__track">
                  <div class="skill-bar-row__fill" [style.width.%]="skill.score"></div>
                </div>
                <span class="skill-bar-row__pct">{{ skill.score }}%</span>
              </div>
            }
          </div>
        </div>

        <!-- RIGHT: stacked cards -->
        <div class="result-right">
          <!-- Readiness -->
          <div class="result-card result-card--readiness">
            <span class="result-card__label">Overall Readiness</span>
            <span class="readiness-score">62%</span>
            <p class="readiness-text">You have a solid foundation. A focused 8-week roadmap can get you interview-ready.</p>
          </div>

          <!-- Best match -->
          <div class="result-card result-card--match">
            <div class="match-top-line"></div>
            <span class="result-card__label result-card__label--teal">Best Career Match</span>
            <span class="match-title">Frontend Engineer</span>
            <div class="match-compat">
              <span class="match-pct">87%</span>
              <span class="match-label">compatibility</span>
            </div>
            <div class="match-tags">
              <span class="match-tag">TypeScript</span>
              <span class="match-tag">React</span>
              <span class="match-tag">CSS</span>
              <span class="match-tag">Testing</span>
              <span class="match-tag">Git</span>
            </div>
          </div>

          <!-- Next steps -->
          <div class="result-card result-card--steps">
            <span class="result-card__label">Your Next Steps</span>
            <div class="next-steps-list">
              @for (ns of nextSteps; track ns.num) {
                <div class="next-step-item">
                  <span class="next-step-item__num">{{ ns.num }}</span>
                  <span class="next-step-item__text">{{ ns.text }}</span>
                </div>
              }
            </div>
          </div>

          <!-- CTA -->
          <button class="cta-btn" routerLink="/">
            Start My Roadmap
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 880px;
      margin: 0 auto;
    }

    .step__headline {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: clamp(26px, 3.4vw, 40px);
      color: var(--text-primary);
      line-height: 1.2;
      margin-bottom: 12px;
    }

    .step__gradient {
      background: linear-gradient(135deg, #2ee8a5, #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .step__sub {
      font-size: 15px;
      color: var(--text-secondary);
      margin-bottom: 40px;
      max-width: 500px;
    }

    /* ── Grid ── */
    .result-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      width: 100%;
      text-align: left;
    }

    /* ── Shared card ── */
    .result-card {
      background: rgba(19, 19, 29, 0.65);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 28px;
    }

    .result-card__label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      display: block;
      margin-bottom: 16px;
    }
    .result-card__label--teal {
      color: var(--accent-teal);
    }

    /* ── Radar ── */
    .radar-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }

    .radar-svg {
      width: 100%;
      max-width: 280px;
    }

    /* ── Skill bars ── */
    .skill-bars {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .skill-bar-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .skill-bar-row__name {
      font-size: 12px;
      color: var(--text-muted);
      width: 80px;
      flex-shrink: 0;
    }

    .skill-bar-row__track {
      flex: 1;
      height: 4px;
      background: var(--bg-tertiary);
      border-radius: 2px;
      overflow: hidden;
    }

    .skill-bar-row__fill {
      height: 100%;
      border-radius: 2px;
      background: linear-gradient(90deg, #2ee8a5, #10b981);
      transition: width 0.8s ease;
    }

    .skill-bar-row__pct {
      font-size: 12px;
      color: var(--text-muted);
      width: 32px;
      text-align: right;
    }

    /* ── Right column ── */
    .result-right {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* ── Readiness ── */
    .result-card--readiness {
      border-color: rgba(16, 185, 129, 0.2);
      background: rgba(16, 185, 129, 0.04);
    }

    .readiness-score {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-size: 48px;
      font-weight: 800;
      color: var(--text-primary);
      display: block;
      margin-bottom: 8px;
    }

    .readiness-text {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    /* ── Match card ── */
    .result-card--match {
      position: relative;
      overflow: hidden;
    }

    .match-top-line {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #2ee8a5, #10b981);
    }

    .match-title {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      display: block;
      margin-bottom: 12px;
    }

    .match-compat {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 14px;
    }

    .match-pct {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(135deg, #2ee8a5, #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .match-label {
      font-size: 13px;
      color: var(--text-muted);
    }

    .match-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .match-tag {
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 500;
      color: var(--accent-teal);
      background: rgba(46, 232, 165, 0.08);
      border-radius: var(--radius-full);
    }

    /* ── Next steps ── */
    .next-steps-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .next-step-item {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .next-step-item__num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(46, 232, 165, 0.1);
      color: var(--accent-teal);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .next-step-item__text {
      font-size: 13.5px;
      color: var(--text-secondary);
    }

    /* ── CTA button ── */
    .cta-btn {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #2ee8a5, #10b981);
      color: var(--bg-primary);
      font-family: 'Syne', var(--font-display), sans-serif;
      font-size: 15px;
      font-weight: 700;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s ease;
      text-decoration: none;
    }
    .cta-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(46, 232, 165, 0.25);
    }

    @media (max-width: 740px) {
      .result-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class StepResultsComponent {
  skills = [
    { name: 'Frontend', score: 75 },
    { name: 'Backend', score: 52 },
    { name: 'DevOps', score: 35 },
    { name: 'Algorithms', score: 60 },
    { name: 'Databases', score: 48 },
    { name: 'Soft Skills', score: 82 },
  ];

  axisIndices = [0, 1, 2, 3, 4, 5];

  nextSteps = [
    { num: '1', text: 'Complete your roadmap setup' },
    { num: '2', text: 'Upload your CV for AI review' },
    { num: '3', text: 'Take your first practice interview' },
  ];

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
}
