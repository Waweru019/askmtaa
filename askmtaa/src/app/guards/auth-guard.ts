import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { ServiceApi } from '../service/service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const api = inject(ServiceApi);
  const router = inject(Router);

  // 1. Check authentication first
  if (!api.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // 2. Get expected roles defined on the route
  const expectedRoles = route.data['roles'] as Array<string>;

  // If no specific roles are required, allow access
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  // 3. Get user object and verify role
  const currentUser = api.getUser(); // Method that returns user object e.g., { role: 'vendor', ... }
  const userRole = currentUser?.role;

  if (userRole && expectedRoles.includes(userRole)) {
    return true; // User has required role
  }

  // 4. Redirect if unauthorized (e.g., to an access-denied page or home)
  return router.createUrlTree(['/login']);
};