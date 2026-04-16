import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssessmentAlertToastService } from '../../services/assessment-alert-toast.service';

@Component({
  selector: 'app-assessment-alert-stack',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assessment-alert-stack.component.html',
  styleUrl: './assessment-alert-stack.component.scss',
})
export class AssessmentAlertStackComponent {
  readonly toastSvc = inject(AssessmentAlertToastService);

  dismiss(id: string): void {
    this.toastSvc.dismiss(id);
  }
}
