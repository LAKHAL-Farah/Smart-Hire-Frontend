import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthLeftPanelComponent } from '../auth-left-panel/auth-left-panel.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AuthLeftPanelComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';
  acceptTerms = false;
  nameTouched = false;
  emailTouched = false;
  passwordTouched = false;

  selectedRole = signal<'candidate' | 'recruiter'>('candidate');
  showPassword = signal(false);
  isLoading = signal(false);
  passwordStrength = signal(0);

  strengthLabel = computed(() => {
    const s = this.passwordStrength();
    if (s <= 1) return 'Weak';
    if (s === 2) return 'Fair';
    if (s === 3) return 'Good';
    return 'Strong';
  });

  isEmailValid(): boolean {
    if (!this.email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  hasUppercase(): boolean { return /[A-Z]/.test(this.password); }
  hasNumber(): boolean { return /[0-9]/.test(this.password); }
  hasSpecial(): boolean { return /[^A-Za-z0-9]/.test(this.password); }

  onPasswordInput(): void {
    let strength = 0;
    if (this.password.length >= 8) strength++;
    if (this.hasUppercase()) strength++;
    if (this.hasNumber()) strength++;
    if (this.hasSpecial()) strength++;
    this.passwordStrength.set(strength);
  }

  onSubmit(): void {
    this.nameTouched = true;
    this.emailTouched = true;
    this.passwordTouched = true;

    if (!this.fullName.trim() || !this.isEmailValid() || !this.password || !this.acceptTerms) return;

    this.isLoading.set(true);
    // TODO: call auth service
    setTimeout(() => this.isLoading.set(false), 2000);
  }

  oauthSignup(provider: string): void {
    console.log('OAuth signup with:', provider);
    // TODO: integrate OAuth
  }
}
