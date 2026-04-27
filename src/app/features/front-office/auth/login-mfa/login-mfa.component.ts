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
        if (res?.Token) {
          localStorage.setItem('auth_token', res.Token);
          localStorage.setItem('access_token', res.Token);
          localStorage.setItem('UserId', String(res.UserId ?? ''));
          localStorage.setItem('userId', String(res.UserId ?? ''));
          localStorage.setItem('user_id', String(res.UserId ?? ''));
          localStorage.setItem('uid', String(res.UserId ?? ''));
          localStorage.setItem('userName', res.userName ?? '');
          localStorage.setItem('email', res.email ?? '');
          localStorage.setItem('role', res.roles ?? '');
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
