import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { firstValueFrom } from 'rxjs';

const USERS_SYNC_API_GATEWAY = 'http://localhost:8093/users/api/users/sync';
const USERS_SYNC_API_DIRECT = 'http://localhost:8087/api/users/sync';

/** Réponse du POST /api/users/sync — id = clé app_user utilisée comme studentId côté adaptive-learning. */
export interface AppUserDto {
  id: number;
  keycloakId?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
}

export interface UserSyncDto {
  keycloakId: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

/** id interne (non affiché à l’utilisateur) — rempli après sync Keycloak → users. */
export const STUDENT_ID_STORAGE_KEY = 'smartlingua.studentId';
/** Prénom/nom ou pseudo pour l’UI (pas l’identifiant technique). */
export const STUDENT_DISPLAY_NAME_STORAGE_KEY = 'smartlingua.studentDisplayName';
/** Email affichable après sync (pas l’ID). */
export const STUDENT_EMAIL_STORAGE_KEY = 'smartlingua.studentEmail';
/** Sub Keycloak du dernier utilisateur ayant alimenté le cache local. */
const STUDENT_KC_SUB_STORAGE_KEY = 'smartlingua.studentKeycloakSub';

@Injectable({ providedIn: 'root' })
export class UserSyncService {

  constructor(
    private http: HttpClient,
    private keycloak: KeycloakService
  ) {}

  /**
   * Enregistre ou met à jour l'utilisateur connecté (Keycloak) dans notre base.
   * Essaie d'abord via la Gateway (8093), sinon en direct vers le microservice (8087).
   * Met à jour le stockage local : id technique + nom affichable.
   */
  async syncCurrentUser(): Promise<AppUserDto | null> {
    if (!this.keycloak.isLoggedIn()) return null;
    this.ensureStorageBoundToCurrentSession();
    const dto = await this.buildSyncDto();
    if (!dto) return null;
    try {
      const user = await firstValueFrom(this.http.post<AppUserDto>(USERS_SYNC_API_GATEWAY, dto));
      this.applySyncedUser(user);
      return user;
    } catch {
      try {
        const user = await firstValueFrom(this.http.post<AppUserDto>(USERS_SYNC_API_DIRECT, dto));
        this.applySyncedUser(user);
        return user;
      } catch (err) {
        console.warn('Sync user vers backend échoué. Démarre le microservice users (port 8087).', err);
        return null;
      }
    }
  }

  /** Id apprenant déjà synchronisé, ou null si absent / invalide. */
  getStoredStudentId(): number | null {
    this.ensureStorageBoundToCurrentSession();
    const raw = localStorage.getItem(STUDENT_ID_STORAGE_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n >= 1 ? Math.trunc(n) : null;
  }

  /**
   * Nom à afficher (prénom + nom, sinon pseudo Keycloak).
   * Ne pas confondre avec l’identifiant numérique de la base.
   */
  getStoredStudentDisplayName(): string {
    this.ensureStorageBoundToCurrentSession();
    const fromSync = localStorage.getItem(STUDENT_DISPLAY_NAME_STORAGE_KEY)?.trim();
    if (fromSync) return this.normalizeLearnerDisplayName(fromSync);
    if (this.keycloak.isLoggedIn()) {
      return this.normalizeLearnerDisplayName(this.keycloak.getUsername() ?? '');
    }
    return '';
  }

  /**
   * Résout l’id apprenant : cache local, sinon sync si session Keycloak active.
   */
  async resolveStudentId(): Promise<number | null> {
    const existing = this.getStoredStudentId();
    if (existing != null) return existing;
    if (!this.keycloak.isLoggedIn()) return null;
    const user = await this.syncCurrentUser();
    return user?.id != null && Number.isFinite(Number(user.id)) ? Math.trunc(Number(user.id)) : null;
  }

  private applySyncedUser(user: AppUserDto | null | undefined): void {
    this.ensureStorageBoundToCurrentSession();
    if (user?.id != null && Number.isFinite(Number(user.id)) && Number(user.id) >= 1) {
      localStorage.setItem(STUDENT_ID_STORAGE_KEY, String(Math.trunc(Number(user.id))));
      const dn = this.normalizeLearnerDisplayName(this.displayNameFromSyncedUser(user));
      if (dn) {
        localStorage.setItem(STUDENT_DISPLAY_NAME_STORAGE_KEY, dn);
      }
      if (user.email?.trim()) {
        localStorage.setItem(STUDENT_EMAIL_STORAGE_KEY, user.email.trim());
      }
    }
  }

  getStoredStudentEmail(): string {
    this.ensureStorageBoundToCurrentSession();
    return localStorage.getItem(STUDENT_EMAIL_STORAGE_KEY)?.trim() ?? '';
  }

  private ensureStorageBoundToCurrentSession(): void {
    if (!this.keycloak.isLoggedIn()) {
      return;
    }
    const currentSub = this.currentKeycloakSub();
    if (!currentSub) {
      return;
    }
    const cachedSub = localStorage.getItem(STUDENT_KC_SUB_STORAGE_KEY)?.trim() ?? '';
    if (cachedSub && cachedSub !== currentSub) {
      localStorage.removeItem(STUDENT_ID_STORAGE_KEY);
      localStorage.removeItem(STUDENT_DISPLAY_NAME_STORAGE_KEY);
      localStorage.removeItem(STUDENT_EMAIL_STORAGE_KEY);
    }
    localStorage.setItem(STUDENT_KC_SUB_STORAGE_KEY, currentSub);
  }

  private currentKeycloakSub(): string {
    try {
      const kc = this.keycloak.getKeycloakInstance();
      const tokenSub = (kc.tokenParsed as { sub?: string } | undefined)?.sub;
      return (tokenSub ?? kc.subject ?? '').trim();
    } catch {
      return '';
    }
  }

  private displayNameFromSyncedUser(user: AppUserDto): string {
    const fn = user.firstName?.trim();
    const ln = user.lastName?.trim();
    if (fn || ln) {
      return [fn, ln].filter(Boolean).join(' ').trim();
    }
    const u = user.username?.trim();
    return u ?? '';
  }

  /**
   * Si Keycloak a le même texte en prénom et en nom (ex. « ali » / « ali »), on n’affiche qu’une fois.
   */
  private normalizeLearnerDisplayName(display: string): string {
    const trimmed = display.trim();
    if (!trimmed) return '';
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0].toLowerCase();
      const allSame = parts.every((p) => p.toLowerCase() === first);
      if (allSame) return parts[0];
    }
    return trimmed;
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
