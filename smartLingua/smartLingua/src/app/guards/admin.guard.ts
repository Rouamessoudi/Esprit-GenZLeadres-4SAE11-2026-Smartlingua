import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from '../core/auth.service';

export const adminGuard: CanActivateFn = () => {
    const keycloakService = inject(KeycloakService);
    const router = inject(Router);
    const authService = inject(AuthService);

    if (!keycloakService.isLoggedIn()) {
        keycloakService.login();
        return false;
    }

    if (authService.isAdmin()) {
        return true;
    }

    // User is logged in but doesn't have admin role — redirect to home
    return router.createUrlTree(['/']);
};
