import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthApiService } from '../core/services/auth-api.service';

export const sessionGuard: CanActivateChildFn = (_route, state) => {
  const authApi = inject(AuthApiService);
  const router = inject(Router);

  const url = state.url || '';
  const isAuthRoute = url.startsWith('/auth/login') || url.startsWith('/auth/register');
  if (isAuthRoute) {
    return true;
  }

  if (authApi.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
