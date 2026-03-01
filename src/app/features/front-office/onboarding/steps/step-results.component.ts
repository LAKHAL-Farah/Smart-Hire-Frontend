import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-step-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './step-results.component.html',
  styleUrl: './step-results.component.scss'
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
