import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TopbarComponent } from './components/topbar/topbar.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent {
  quizMode = signal(false);
  private childRef: any = null;

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
