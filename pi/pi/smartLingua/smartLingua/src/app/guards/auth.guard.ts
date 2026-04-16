import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const authGuard: CanActivateFn = () => {
    const keycloakService = inject(KeycloakService);

    if (keycloakService.isLoggedIn()) {
        return true;
    }

    keycloakService.login({ redirectUri: window.location.origin + '/' });
    return false;
};
