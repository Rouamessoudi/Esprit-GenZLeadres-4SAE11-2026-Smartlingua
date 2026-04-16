import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { keycloakConnectConfig } from './keycloak.config';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    constructor(private keycloakService: KeycloakService) { }

    login(): void {
        this.keycloakService.login();
    }

    /**
     * Redirige vers la page Keycloak "Mot de passe oublié".
     * L'utilisateur saisit son email (ou identifiant), reçoit un lien de réinitialisation si l'email est configuré dans Keycloak.
     * Après réinitialisation, il peut se connecter avec son email si "Email as username" est activé dans le realm.
     */
    forgotPassword(): void {
        const kc = this.keycloakService.getKeycloakInstance();
        const baseUrl = (kc as { authServerUrl?: string }).authServerUrl ?? keycloakConnectConfig.url;
        const realm = (kc as { realm?: string }).realm ?? 'smartlingua';
        const clientId = (kc as { clientId?: string }).clientId ?? 'angular';
        const redirectUri = encodeURIComponent(window.location.origin + (window.location.pathname || '/'));
        const url = `${baseUrl}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid&kc_action=reset_credentials`;
        window.location.href = url;
    }

    register(): void {
        // Ouvre la page de connexion Keycloak. Si "User registration" est activé dans le realm,
        // un lien "Register" apparaît en bas : l'utilisateur clique dessus pour s'inscrire.
        // Cela évite l'erreur "Page not found" avec l'ancienne URL /registrations ou prompt=create.
        this.keycloakService.login();
    }

    logout(): void {
        this.keycloakService.logout(window.location.origin);
    }

    isLoggedIn(): boolean {
        return this.keycloakService.isLoggedIn();
    }

    getUserRoles(): string[] {
        return this.keycloakService.getUserRoles();
    }

    getUsername(): string {
        return this.keycloakService.getUsername();
    }

    hasRole(role: string): boolean {
        const normalizedTarget = this.normalizeRole(role);
        return this.getNormalizedRoles().includes(normalizedTarget);
    }

    isAdmin(): boolean {
        return this.hasRole('admin');
    }

    private getNormalizedRoles(): string[] {
        return this.keycloakService
            .getUserRoles()
            .map((r) => this.normalizeRole(r));
    }

    private normalizeRole(role: string): string {
        return role.toUpperCase().replace(/^ROLE_/, '');
    }
}
