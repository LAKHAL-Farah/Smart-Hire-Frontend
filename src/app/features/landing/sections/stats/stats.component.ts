import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimationService } from '../../services/scroll-animation.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="stats" #statsSection>
      <div class="section-container">
        <div class="stats__grid">
          @for (stat of stats; track stat.label) {
            <div class="stats__item">
              <span class="stats__value" #statValue [attr.data-target]="stat.value" [attr.data-suffix]="stat.suffix" [attr.data-prefix]="stat.prefix">0{{ stat.suffix }}</span>
              <span class="stats__label">{{ stat.label }}</span>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .stats {
      padding: 100px 0;
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-secondary);
    }

    .stats__grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 40px;
      text-align: center;
    }

    .stats__item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .stats__value {
      font-family: var(--font-display);
      font-size: clamp(40px, 5vw, 64px);
      font-weight: 800;
      background: var(--gradient-hero);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .stats__label {
      font-size: 15px;
      color: var(--text-secondary);
    }

    @media (max-width: 768px) {
      .stats__grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 32px;
      }
    }
    @media (max-width: 480px) {
      .stats__grid { grid-template-columns: 1fr; }
    }
  `]
})
export class StatsComponent implements AfterViewInit {
  @ViewChild('statsSection') section!: ElementRef;
  @ViewChildren('statValue') statValues!: QueryList<ElementRef>;

  stats = [
    { value: 84, suffix: '%', prefix: '', label: 'Average interview score improvement' },
    { value: 3, suffix: 'x', prefix: '', label: 'Faster to first job offer' },
    { value: 12000, suffix: '+', prefix: '', label: 'Career roadmaps generated' },
    { value: 400, suffix: '+', prefix: '', label: 'Companies hiring on SmartHire' },
  ];

  constructor(private scrollAnim: ScrollAnimationService) {}

  ngAfterViewInit(): void {
    this.statValues.forEach((el) => {
      const target = parseInt(el.nativeElement.getAttribute('data-target'), 10);
      const suffix = el.nativeElement.getAttribute('data-suffix') || '';
      const prefix = el.nativeElement.getAttribute('data-prefix') || '';
      this.scrollAnim.animateCounter(el.nativeElement, target, { suffix, prefix });
    });
  }
}
