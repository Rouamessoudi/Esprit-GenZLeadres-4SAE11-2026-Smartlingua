import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { hasSession } from '../core/services/local-session.service';

/** Guard : session locale (login/register backend 8094). */
export const authGuard: CanActivateFn = () => {
  if (hasSession()) return true;
  inject(Router).navigate(['/login'], { replaceUrl: true });
  return false;
};
