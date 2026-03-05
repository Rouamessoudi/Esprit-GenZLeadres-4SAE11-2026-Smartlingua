import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { firstValueFrom } from 'rxjs';

const USERS_SYNC_API_GATEWAY = 'http://localhost:8093/users/api/users/sync';
const USERS_SYNC_API_DIRECT = 'http://localhost:8087/api/users/sync';

export interface UserSyncDto {
  keycloakId: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

@Injectable({ providedIn: 'root' })
export class UserSyncService {

  constructor(
    private http: HttpClient,
    private keycloak: KeycloakService
  ) {}

  /**
   * Enregistre ou met à jour l'utilisateur connecté (Keycloak) dans notre base.
   * Essaie d'abord via la Gateway (8093), sinon en direct vers le microservice (8087).
   */
  async syncCurrentUser(): Promise<void> {
    if (!this.keycloak.isLoggedIn()) return;
    const dto = await this.buildSyncDto();
    if (!dto) return;
    try {
      await firstValueFrom(this.http.post(USERS_SYNC_API_GATEWAY, dto));
    } catch {
      try {
        await firstValueFrom(this.http.post(USERS_SYNC_API_DIRECT, dto));
      } catch (err) {
        console.warn('Sync user vers backend échoué. Démarre le microservice users (port 8087).', err);
      }
    }
  }

  private async buildSyncDto(): Promise<UserSyncDto | null> {
    try {
      const kc = this.keycloak.getKeycloakInstance();
      const sub = (kc.tokenParsed as { sub?: string })?.sub ?? kc.subject ?? '';
      const username = this.keycloak.getUsername() ?? '';
      if (!sub || !username) return null;
      let profile: { email?: string; firstName?: string; lastName?: string; username?: string } = { username };
      try {
        profile = await this.keycloak.loadUserProfile() ?? profile;
      } catch {
        // garde username et sub
      }
      return {
        keycloakId: sub,
        username: profile.username ?? username,
        email: profile.email ?? undefined,
        firstName: profile.firstName ?? undefined,
        lastName: profile.lastName ?? undefined
      };
    } catch {
      return null;
    }
  }
}
