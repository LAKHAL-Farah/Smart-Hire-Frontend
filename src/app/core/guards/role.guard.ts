import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AutheService } from '../../features/front-office/auth/authe.service';

/**
 * Guard to check if user has required role.
 * If user is not authorized, redirects to access-denied page.
 * 
 * Usage in routes:
 * canActivate: [roleGuard]
 * data: { requiredRoles: ['recruiter', 'candidate'] }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AutheService);
  const router = inject(Router);

  const userRole = localStorage.getItem('role');
  const requiredRoles = route.data['requiredRoles'] as string[] | undefined;

  if(! auth.isLoggedIn()) {
    void router.navigate(['/login']);
    return false;
  }

  // If no specific roles required, allow access
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Check if user has one of the required roles
  if (userRole && requiredRoles.includes(userRole)) {
    return true;
  }

  // User doesn't have required role
  void router.navigate(['/access-denied']);
  return false;
};
