import { Injectable } from '@angular/core';
import { getSessionUser, hasSession, clearSession } from './services/local-session.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  login(): void {
    // Redirection gérée par le composant login (formulaire)
  }

  logout(): void {
    clearSession();
    window.location.href = '/login';
  }

  isLoggedIn(): boolean {
    return hasSession();
  }

  getUserRoles(): string[] {
    const u = getSessionUser();
    if (!u?.role) return [];
    return [u.role];
  }

  getUsername(): string {
    return getSessionUser()?.username ?? '';
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }
}
