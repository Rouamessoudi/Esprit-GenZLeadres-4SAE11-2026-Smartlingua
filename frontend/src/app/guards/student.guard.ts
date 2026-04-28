import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from '../core/auth.service';

export const studentGuard: CanActivateFn = () => {
    const keycloakService = inject(KeycloakService);
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!keycloakService.isLoggedIn()) {
        keycloakService.login({
            redirectUri: `${window.location.origin}/student/dashboard`
        });
        return false;
    }

    if (authService.isAdmin()) {
        return router.createUrlTree(['/admin/dashboard']);
    }

    if (authService.isTeacher()) {
        return router.createUrlTree(['/teacher/dashboard']);
    }

    return true;
};
