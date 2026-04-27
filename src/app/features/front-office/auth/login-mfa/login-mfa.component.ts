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
        
        // Handle face verification requirement
        if (res?.status === 'FACE_REQUIRED') {
          const token = res.data.tempToken;
          sessionStorage.setItem('faceVerificationToken', token);
          void this.router.navigate(['/verify-face'], { queryParams: { token } });
          return;
        }
        
        // Handle successful login (both old and new response formats)
        const token = res?.data?.Token || res?.Token;
        const userId = res?.data?.UserId || res?.UserId;
        const userName = res?.data?.userName || res?.userName;
        const email = res?.data?.email || res?.email;
        const roles = res?.data?.roles || res?.roles;
        
        if (token && (res?.status === 'SUCCESS' || res?.Token)) {
          // Store JWT token for authentication (multiple keys for compatibility)
          localStorage.setItem('auth_token', token);
          localStorage.setItem('access_token', token);
          
          // Store user ID (multiple keys for compatibility)
          localStorage.setItem('UserId', String(userId ?? ''));
          localStorage.setItem('userId', String(userId ?? ''));
          localStorage.setItem('user_id', String(userId ?? ''));
          localStorage.setItem('uid', String(userId ?? ''));
          
          // Store user info
          localStorage.setItem('userName', userName ?? '');
          localStorage.setItem('email', email ?? '');
          localStorage.setItem('role', roles ?? '');
          
          // Set smarthire_profile_user_uuid and user JSON for assessment system
          if (userId) {
            setProfileUserUuid(userId);
            localStorage.setItem('user', JSON.stringify({
              id: userId,
              email: email || this.username,
              name: userName || this.username.split('@')[0],
              role: roles === 'recruiter' ? 'recruiter' : 'user',
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
