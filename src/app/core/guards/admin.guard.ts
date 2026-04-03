import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../../features/front-office/auth/auth.service';

/** Restricts admin routes to users with role `admin`. */
export const adminCanMatch: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.getUser()?.role === 'admin') {
    return true;
  }
  void router.navigate(['/dashboard']);
  return false;
};
