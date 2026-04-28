import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from '../core/auth.service';

export const adminGuard: CanActivateFn = () => {
    const keycloakService = inject(KeycloakService);
    const router = inject(Router);
    const authService = inject(AuthService);

    if (!keycloakService.isLoggedIn()) {
        keycloakService.login({
            redirectUri: `${window.location.origin}/admin/dashboard`
        });
        return false;
    }

    if (authService.isAdmin()) {
        return true;
    }

    if (authService.isTeacher()) {
        return router.createUrlTree(['/teacher/dashboard']);
    }

    // User is logged in but doesn't have admin role.
    return router.createUrlTree(['/student/dashboard']);
};
