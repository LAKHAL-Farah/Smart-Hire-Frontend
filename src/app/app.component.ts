import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AssessmentAlertStackComponent } from './core/components/assessment-alert-stack/assessment-alert-stack.component';
import { ThemeService } from './shared/services/theme.service';
import { ChatWidgetComponent } from './shared/chat-widget/chat-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AssessmentAlertStackComponent, ChatWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'smarthire-frontend';

  constructor(private readonly themeService: ThemeService) {
    void this.themeService;
  }
}
