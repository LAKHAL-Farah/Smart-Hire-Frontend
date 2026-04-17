import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthMfaService } from '../auth-mfa.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthLeftPanelComponent } from '../auth-left-panel/auth-left-panel.component';
import { AutheService } from '../authe.service';

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

  constructor(private auth: AuthMfaService, private router: Router,private authService: AutheService) {}

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
          if (res?.status === 'SUCCESS') {
          localStorage.setItem('auth_token', res.data.token);
          localStorage.setItem('userId', res.data.userId);
          localStorage.setItem('userName', res.data.userName);
          localStorage.setItem('email', res.data.email);
          localStorage.setItem('role', res.data.roles);
          this.authService.redirectAfterLogin();
        }
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
