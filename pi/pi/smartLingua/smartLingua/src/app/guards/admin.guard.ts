import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../environments/environment';

export const adminGuard: CanActivateFn = () => {
    const keycloakService = inject(KeycloakService);
    const router = inject(Router);

    if (environment.devBypassAuth) {
        return true;
    }

    if (!keycloakService.isLoggedIn()) {
        keycloakService.login({ redirectUri: window.location.origin + '/' });
        return false;
    }

    const roles = keycloakService.getUserRoles() ?? [];
    if (roles.includes('admin')) {
        return true;
    }

    return router.createUrlTree(['/']);
};
