import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthMfaService } from '../auth-mfa.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthLeftPanelComponent } from '../auth-left-panel/auth-left-panel.component';
import { setProfileUserUuid } from '../../profile/profile-user-id';

@Component({
  selector: 'app-login-mfa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AuthLeftPanelComponent],
  templateUrl: './login-mfa.component.html',
  styleUrls: ['./login-mfa.component.scss']
})
export class LoginMfaComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthMfaService, private router: Router) {}

  onLogin(): void {
    this.error = '';
    this.loading = true;
    this.auth.loginMfa(this.username, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        console.log('Login response:', res);
        if (res?.status === 'FACE_REQUIRED') {
          const token = res.data.tempToken;
          sessionStorage.setItem('faceVerificationToken', token);
          void this.router.navigate(['/verify-face'], { queryParams: { token } });
          return;
        }
        if (res?.status === 'SUCCESS') {
          localStorage.setItem('auth_token', res.data.Token);
          localStorage.setItem('UserId', res.data.UserId);
          localStorage.setItem('userId', res.data.UserId);
          localStorage.setItem('userName', res.data.userName);
          localStorage.setItem('email', res.data.email);
          localStorage.setItem('role', res.data.roles);
          // Set smarthire_profile_user_uuid and user JSON so getAssessmentUserId() works
          if (res.data.UserId) {
            setProfileUserUuid(res.data.UserId);
            localStorage.setItem('user', JSON.stringify({
              id: res.data.UserId,
              email: res.data.email || this.username,
              name: res.data.userName || this.username.split('@')[0],
              role: res.data.roles === 'recruiter' ? 'recruiter' : 'user',
            }));
          }
          this.auth.redirectAfterLogin();
          return;
        }
        this.error = res?.message || 'Erreur inattendue';
      },
      error: (err: HttpErrorResponse) => {
        console.error('Login error:', err);
        this.loading = false;
        this.error = err?.error?.message || 'Nom d\'utilisateur ou mot de passe incorrect';
      }
    });
  }
}
