import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/front-office/auth/auth.service';

/**
 * Guard to check if user is authenticated.
 * If not authenticated, redirects to login page.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  void router.navigate(['/login']);
  return false;
};
