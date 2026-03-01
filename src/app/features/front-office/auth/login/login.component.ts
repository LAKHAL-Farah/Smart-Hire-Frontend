import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthLeftPanelComponent } from '../auth-left-panel/auth-left-panel.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AuthLeftPanelComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;
  emailTouched = false;
  passwordTouched = false;

  showPassword = signal(false);
  isLoading = signal(false);

  isEmailValid(): boolean {
    if (!this.email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  onSubmit(): void {
    this.emailTouched = true;
    this.passwordTouched = true;

    if (!this.isEmailValid() || !this.password) return;

    this.isLoading.set(true);
    // TODO: call auth service
    setTimeout(() => this.isLoading.set(false), 2000);
  }

  oauthLogin(provider: string): void {
    console.log('OAuth login with:', provider);
    // TODO: integrate OAuth
  }
}
