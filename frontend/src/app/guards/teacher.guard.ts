import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from '../core/auth.service';

export const teacherGuard: CanActivateFn = () => {
    const keycloakService = inject(KeycloakService);
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!keycloakService.isLoggedIn()) {
        keycloakService.login({
            redirectUri: `${window.location.origin}/teacher/dashboard`
        });
        return false;
    }

    if (authService.isAdmin()) {
        return router.createUrlTree(['/admin/dashboard']);
    }

    if (authService.isTeacher()) {
        return true;
    }

    return router.createUrlTree(['/student/dashboard']);
};
