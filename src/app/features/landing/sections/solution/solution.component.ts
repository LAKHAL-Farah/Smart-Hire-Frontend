import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-solution',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="solution" #solutionSection id="how-it-works-detail">
      <div class="solution__inner">
        <!-- Left: text panels -->
        <div class="solution__text-col">
          @for (step of steps; track step.id; let i = $index) {
            <div
              class="solution__step"
              [class.active]="activeStep === i"
              [attr.data-step]="i"
            >
              <div class="solution__step-num">{{ step.id }}</div>
              <h3 class="solution__step-title">{{ step.title }}</h3>
              <p class="solution__step-desc">{{ step.desc }}</p>
            </div>
          }
        </div>

        <!-- Right: animated mockup area -->
        <div class="solution__visual-col">
          <div class="solution__visual-frame glass-card">
            <!-- Step 0: Radar chart -->
            <div class="solution__scene" [class.active]="activeStep === 0">
              <div class="radar-chart">
                <svg viewBox="0 0 200 200">
                  <polygon class="radar-bg" points="100,20 180,80 160,170 40,170 20,80"/>
                  <polygon class="radar-fill" points="100,45 155,78 145,140 55,140 45,78"/>
                  <circle cx="100" cy="45" r="4" fill="var(--accent-teal)"/>
                  <circle cx="155" cy="78" r="4" fill="var(--accent-teal)"/>
                  <circle cx="145" cy="140" r="4" fill="var(--accent-teal)"/>
                  <circle cx="55" cy="140" r="4" fill="var(--accent-teal)"/>
                  <circle cx="45" cy="78" r="4" fill="var(--accent-teal)"/>
                </svg>
                <div class="radar-labels">
                  <span style="top: 5%; left: 50%; transform: translateX(-50%)">React</span>
                  <span style="top: 35%; right: 2%">Node.js</span>
                  <span style="bottom: 10%; right: 10%">SQL</span>
                  <span style="bottom: 10%; left: 10%">Python</span>
                  <span style="top: 35%; left: 2%">System Design</span>
                </div>
              </div>
            </div>

            <!-- Step 1: Roadmap timeline -->
            <div class="solution__scene" [class.active]="activeStep === 1">
              <div class="roadmap">
                @for (item of roadmapItems; track item.label; let i = $index) {
                  <div class="roadmap__item" [style.animation-delay]="i * 150 + 'ms'">
                    <div class="roadmap__dot" [class.done]="i < 2"></div>
                    <div class="roadmap__content">
                      <span class="roadmap__label">{{ item.label }}</span>
                      <span class="roadmap__duration">{{ item.duration }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Step 2: Interview session -->
            <div class="solution__scene" [class.active]="activeStep === 2">
              <div class="interview">
                <div class="interview__header">
                  <span class="interview__badge">Mock Interview</span>
                  <span class="interview__timer">14:32</span>
                </div>
                <div class="interview__messages">
                  <div class="interview__msg interview__msg--ai">
                    <span class="interview__msg-label">AI Interviewer</span>
                    Tell me about a time you optimized a database query.
                  </div>
                  <div class="interview__msg interview__msg--user">
                    <span class="interview__msg-label">You</span>
                    I reduced our API response time by 60% by adding composite indexes...
                  </div>
                  <div class="interview__feedback">
                    <span class="interview__score">Score: 8.5/10</span>
                    <span class="interview__tip">Tip: Include specific metrics</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 3: Job match cards -->
            <div class="solution__scene" [class.active]="activeStep === 3">
              <div class="jobs">
                @for (job of jobs; track job.company; let i = $index) {
                  <div class="jobs__card" [style.animation-delay]="i * 120 + 'ms'">
                    <div class="jobs__match">{{ job.match }}% match</div>
                    <div class="jobs__info">
                      <span class="jobs__role">{{ job.role }}</span>
                      <span class="jobs__company">{{ job.company }}</span>
                    </div>
                    <button class="jobs__apply">Apply</button>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .solution {
      padding: 0;
      min-height: 100vh;
    }

    .solution__inner {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
      min-height: 100vh;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Text column */
    .solution__text-col {
      display: flex;
      flex-direction: column;
      gap: 48px;
    }

    .solution__step {
      opacity: 0.25;
      transition: all 0.5s ease;
      padding-left: 24px;
      border-left: 2px solid var(--border-subtle);
    }
    .solution__step.active {
      opacity: 1;
      border-left-color: var(--accent-teal);
    }

    .solution__step-num {
      font-family: var(--font-display);
      font-size: 13px;
      font-weight: 700;
      color: var(--accent-teal);
      margin-bottom: 8px;
      letter-spacing: 0.1em;
    }

    .solution__step-title {
      font-family: var(--font-display);
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .solution__step-desc {
      font-size: 15px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    /* Visual column */
    .solution__visual-col {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .solution__visual-frame {
      width: 100%;
      max-width: 460px;
      min-height: 380px;
      padding: 32px;
      position: relative;
      overflow: hidden;
    }

    .solution__scene {
      display: none;
      animation: fadeInScene 0.6s ease forwards;
    }
    .solution__scene.active {
      display: block;
    }

    @keyframes fadeInScene {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Radar chart */
    .radar-chart {
      position: relative;
      width: 100%;
      max-width: 280px;
      margin: 0 auto;
    }
    .radar-chart svg {
      width: 100%;
    }
    .radar-bg {
      fill: none;
      stroke: var(--border-subtle);
      stroke-width: 1;
    }
    .radar-fill {
      fill: rgba(46, 232, 165, 0.12);
      stroke: var(--accent-teal);
      stroke-width: 2;
    }
    .radar-labels {
      position: absolute;
      inset: 0;
      font-size: 11px;
      color: var(--text-muted);
    }
    .radar-labels span {
      position: absolute;
      white-space: nowrap;
    }

    /* Roadmap */
    .roadmap {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .roadmap__item {
      display: flex;
      align-items: center;
      gap: 16px;
      animation: slideInRight 0.5s ease forwards;
      opacity: 0;
    }
    .solution__scene.active .roadmap__item {
      opacity: 1;
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .roadmap__dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      border: 2px solid var(--text-muted);
      flex-shrink: 0;
    }
    .roadmap__dot.done {
      background: var(--accent-teal);
      border-color: var(--accent-teal);
    }
    .roadmap__content {
      display: flex;
      justify-content: space-between;
      flex: 1;
      padding: 12px 16px;
      background: rgba(255,255,255,0.03);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
    }
    .roadmap__label {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }
    .roadmap__duration {
      font-size: 12px;
      color: var(--text-muted);
    }

    /* Interview */
    .interview {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .interview__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .interview__badge {
      font-size: 12px;
      font-weight: 600;
      color: var(--accent-teal);
      background: rgba(46, 232, 165, 0.1);
      padding: 4px 12px;
      border-radius: var(--radius-full);
    }
    .interview__timer {
      font-size: 13px;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
    }
    .interview__messages {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .interview__msg {
      padding: 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      line-height: 1.5;
    }
    .interview__msg-label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    .interview__msg--ai {
      background: rgba(59, 130, 246, 0.08);
      border: 1px solid rgba(59, 130, 246, 0.15);
      color: var(--text-secondary);
    }
    .interview__msg--ai .interview__msg-label { color: var(--accent-blue); }
    .interview__msg--user {
      background: rgba(46, 232, 165, 0.06);
      border: 1px solid rgba(46, 232, 165, 0.12);
      color: var(--text-secondary);
    }
    .interview__msg--user .interview__msg-label { color: var(--accent-teal); }
    .interview__feedback {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      background: rgba(255,255,255,0.03);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
    }
    .interview__score {
      font-size: 13px;
      font-weight: 600;
      color: var(--accent-teal);
    }
    .interview__tip {
      font-size: 12px;
      color: var(--text-muted);
    }

    /* Jobs */
    .jobs {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .jobs__card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      animation: slideInRight 0.5s ease forwards;
      opacity: 0;
    }
    .solution__scene.active .jobs__card {
      opacity: 1;
    }
    .jobs__match {
      font-size: 12px;
      font-weight: 700;
      color: var(--accent-teal);
      background: rgba(46, 232, 165, 0.1);
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      white-space: nowrap;
    }
    .jobs__info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .jobs__role {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }
    .jobs__company {
      font-size: 12px;
      color: var(--text-muted);
    }
    .jobs__apply {
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: var(--radius-full);
      border: 1px solid var(--accent-teal);
      color: var(--accent-teal);
      background: transparent;
      cursor: pointer;
      transition: all 0.3s;
    }
    .jobs__apply:hover {
      background: var(--accent-teal);
      color: var(--bg-primary);
    }

    @media (max-width: 768px) {
      .solution__inner {
        grid-template-columns: 1fr;
        gap: 40px;
        padding-top: 40px;
        padding-bottom: 40px;
      }
    }
  `]
})
export class SolutionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('solutionSection') section!: ElementRef;

  activeStep = 0;
  private scrollTriggerInstance: ScrollTrigger | null = null;

  steps = [
    { id: '01', title: 'Assess your skills', desc: 'Take a 5-minute AI-driven skills assessment. Get a detailed radar of where you stand across key engineering competencies.' },
    { id: '02', title: 'Get your roadmap', desc: 'Receive a personalized learning roadmap with clear milestones, resources, and estimated timelines tailored to your goal.' },
    { id: '03', title: 'Ace interviews', desc: 'Practice with AI mock interviews that adapt to your level. Get real-time feedback, scoring, and improvement tips.' },
    { id: '04', title: 'Match with jobs', desc: 'Our matching engine connects you with roles that fit your exact skill profile. Apply with an AI-optimized resume.' },
  ];

  roadmapItems = [
    { label: 'JavaScript Fundamentals', duration: 'Week 1-2' },
    { label: 'React + TypeScript', duration: 'Week 3-5' },
    { label: 'Node.js & APIs', duration: 'Week 6-8' },
    { label: 'System Design Basics', duration: 'Week 9-10' },
    { label: 'Portfolio Projects', duration: 'Week 11-12' },
    { label: 'Interview Prep', duration: 'Week 13-14' },
  ];

  jobs = [
    { role: 'Frontend Engineer', company: 'Spotify • Remote', match: 94 },
    { role: 'Full-Stack Developer', company: 'Datadog • Paris', match: 89 },
    { role: 'Software Engineer Intern', company: 'Google • Zürich', match: 85 },
    { role: 'React Developer', company: 'Stripe • Dublin', match: 82 },
  ];

  ngAfterViewInit(): void {
    const section = this.section.nativeElement;
    const totalSteps = this.steps.length;

    this.scrollTriggerInstance = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: `+=${totalSteps * 100}%`,
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const step = Math.min(Math.floor(progress * totalSteps), totalSteps - 1);
        this.activeStep = step;
      },
    });
  }

  ngOnDestroy(): void {
    this.scrollTriggerInstance?.kill();
  }
}
