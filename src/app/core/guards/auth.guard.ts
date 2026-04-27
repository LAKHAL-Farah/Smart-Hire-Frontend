import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutheService } from '../../features/front-office/auth/authe.service';
import { resolveCurrentProfileUserId } from '../services/current-user-id';

/**
 * Guard to check if user is authenticated.
 * If not authenticated, redirects to login page.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AutheService);
  const router = inject(Router);
  const userId = resolveCurrentProfileUserId();

  if (auth.isLoggedIn() && !!userId) {
    return true;
  }

  auth.logout();
  void router.navigate(['/']);
  return false;
};
