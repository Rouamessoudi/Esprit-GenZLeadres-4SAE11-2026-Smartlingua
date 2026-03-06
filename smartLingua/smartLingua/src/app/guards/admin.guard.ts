import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getSessionUser, hasSession } from '../core/services/local-session.service';

/** Guard admin : utilisateur connecté avec rôle admin (session backend). */
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (!hasSession()) return router.createUrlTree(['/login']);
  const user = getSessionUser();
  if (user?.role === 'admin') return true;
  return router.createUrlTree(['/']);
};
