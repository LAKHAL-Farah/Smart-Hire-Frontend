import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { AssessmentGateService } from '../../../core/services/assessment-gate.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss',
})
export class DashboardLayoutComponent implements OnInit {
  quizMode = signal(false);
  private childRef: any = null;

  constructor(
    private readonly router: Router,
    private readonly assessmentGate: AssessmentGateService
  ) {}

  ngOnInit(): void {
    this.assessmentGate.loadState().subscribe();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.assessmentGate.loadState().subscribe();
    });
  }

  onChildActivate(component: any): void {
    this.childRef = component;
    if (component?.quizActive) {
      // Poll the signal from the assessment component
      const check = () => {
        if (this.childRef === component) {
          this.quizMode.set(component.quizActive());
          requestAnimationFrame(check);
        }
      };
      check();
    } else {
      this.quizMode.set(false);
    }
  }

  onChildDeactivate(): void {
    this.childRef = null;
    this.quizMode.set(false);
  }
}
