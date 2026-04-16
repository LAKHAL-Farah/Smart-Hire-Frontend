import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AssessmentAlertStackComponent } from './core/components/assessment-alert-stack/assessment-alert-stack.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AssessmentAlertStackComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'smarthire-frontend';
}
