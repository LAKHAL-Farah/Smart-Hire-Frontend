import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { ProfileApiService, ProfileApiResponse } from '../../profile/profile-api.service';
import { setProfileUserUuid, setLocalDemoMode } from '../../profile/profile-user-id';
import { AuthLeftPanelComponent } from '../auth-left-panel/auth-left-panel.component';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AuthLeftPanelComponent, LUCIDE_ICONS],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private readonly profileApi = inject(ProfileApiService);
  private readonly router = inject(Router);

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
    const parts = this.fullName.trim().split(/\s+/);
    const firstName = parts[0] || 'Candidate';
    const lastName = parts.slice(1).join(' ') || '';

    this.profileApi
      .createUserWithProfile({
        userRequest: {
          email: this.email.trim(),
          password: this.password,
          roleName: this.selectedRole() === 'recruiter' ? 'recruiter' : 'candidate',
        },
        profileRequest: { firstName, lastName },
      })
      .subscribe({
        next: (u) => {
          this.isLoading.set(false);
          setLocalDemoMode(false);
          if (u?.id) {
            setProfileUserUuid(String(u.id));
          }
          void this.router.navigate(['/onboarding']);
        },
        error: () => {
          this.isLoading.set(false);
          if (environment.localAuthFallback) {
            this.startLocalDemoRegistration(firstName, lastName);
            return;
          }
          alert(
            'Registration failed. Is MS-User on port 8082? If the email already exists, try logging in instead.'
          );
        },
      });
  }

  /**
   * MS-User unavailable — keep going with a random user id and data in localStorage only.
   * Sync to the real service when your teammate’s MS-User is running again.
   */
  private startLocalDemoRegistration(firstName: string, lastName: string): void {
    const id = crypto.randomUUID();
    setProfileUserUuid(id);
    setLocalDemoMode(true);
    localStorage.setItem(
      'smarthire_local_user',
      JSON.stringify({
        email: this.email.trim(),
        firstName,
        lastName,
        role: this.selectedRole(),
      })
    );
    const profile: ProfileApiResponse = {
      userId: id,
      firstName,
      lastName,
      email: this.email.trim(),
      headline: '',
    };
    localStorage.setItem('smarthire_local_profile', JSON.stringify(profile));
    void this.router.navigate(['/onboarding']);
  }

  oauthSignup(provider: string): void {
    console.log('OAuth signup with:', provider);
    // TODO: integrate OAuth
  }
}
