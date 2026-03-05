import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const adminGuard: CanActivateFn = () => {
    const keycloakService = inject(KeycloakService);
    const router = inject(Router);

    if (!keycloakService.isLoggedIn()) {
        keycloakService.login();
        return false;
    }

    const roles = keycloakService.getUserRoles();
    if (roles.includes('admin')) {
        return true;
    }

    // User is logged in but doesn't have admin role — redirect to home
    return router.createUrlTree(['/']);
};
