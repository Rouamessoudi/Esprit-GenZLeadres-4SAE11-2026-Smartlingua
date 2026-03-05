import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { KeycloakBearerInterceptor, KeycloakService } from 'keycloak-angular';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';

/** Initialisation Keycloak. Timeout 8s : si Keycloak ne répond pas, l'app charge quand même (évite la page blanche). */
function initializeKeycloak(keycloak: KeycloakService) {
  const keycloakInit = keycloak.init({
    config: {
      url: 'http://localhost:8081',
      realm: 'smartlingua',
      clientId: 'angular'
    },
    initOptions: {
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri:
        window.location.origin + '/assets/silent-check-sso.html',
      checkLoginIframe: false
    },
    loadUserProfileAtStartUp: true,
    enableBearerInterceptor: true
  }).catch((err) => {
    console.warn('Keycloak non disponible.', err);
  });
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 8000));
  return () => Promise.race([keycloakInit, timeout]);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
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