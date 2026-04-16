import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { KeycloakBearerInterceptor, KeycloakService } from 'keycloak-angular';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { authInterceptor } from './core/interceptors/auth.interceptor';

/** Detect if we are returning from Keycloak OAuth redirect (must wait for init to complete) */
function isKeycloakCallback(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has('code') || params.has('state') || params.has('session_state');
}

function initializeKeycloak(keycloak: KeycloakService) {
  return () => {
    const redirectUri = window.location.origin + '/';
    const keycloakInit = keycloak.init({
      config: {
        url: environment.keycloakUrl,
        realm: 'smartlingua',
        clientId: 'angular'
      },
      initOptions: {
        onLoad: 'check-sso',
        redirectUri,
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html',
        checkLoginIframe: false
      },
      loadUserProfileAtStartUp: true,
      enableBearerInterceptor: true,
      bearerExcludedUrls: ['/assets']
    });
    // When returning from Keycloak redirect, wait for init (no timeout) so token is available
    if (isKeycloakCallback()) {
      return keycloakInit.catch((err) => {
        console.warn('Keycloak callback failed', err);
      });
    }
    // Normal load: timeout 3s so app starts even if Keycloak is down
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3000));
    return Promise.race([keycloakInit, timeout]).catch((err) => {
      console.warn('Keycloak non disponible - l\'app fonctionne sans authentification', err);
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withInterceptorsFromDi()
    ),
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeycloakBearerInterceptor,
      multi: true
    }
  ]
};