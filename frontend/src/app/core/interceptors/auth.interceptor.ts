import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

/** URL patterns that should receive the Bearer token */
const API_URL_PATTERNS = [
  /\/api\/.*/,
  new RegExp(`^${environment.usersApiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/.*`),
  new RegExp(`^${environment.forumApiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/.*`)
];

function shouldAddToken(url: string): boolean {
  return API_URL_PATTERNS.some(p => p.test(url));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('Authorization') || !shouldAddToken(req.url)) {
    return next(req);
  }

  const keycloak = inject(KeycloakService);
  if (!keycloak.isLoggedIn()) {
    return next(req);
  }

  return from(keycloak.getToken()).pipe(
    switchMap(token => {
      if (token) {
        req = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        });
      }
      return next(req);
    })
  );
};
