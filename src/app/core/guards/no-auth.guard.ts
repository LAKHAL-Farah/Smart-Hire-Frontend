import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutheService } from '../../features/front-office/auth/authe.service';

/**
 * Guard to prevent authenticated users from accessing login page.
 * If user is already logged in, redirects to appropriate page based on role.
 */
export const noAuthGuard: CanActivateFn = () => {
  const auth = inject(AutheService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    // User is already authenticated
    const role = localStorage.getItem('role');
    if (role === 'recruiter') {
      void router.navigate(['/admin']);
    } else {
      void router.navigate(['/dashboard']);
    }
    return false;
  }

  // User is not authenticated, allow access to login page
  return true;
};
