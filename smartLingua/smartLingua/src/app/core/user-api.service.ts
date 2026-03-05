import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { API_URL } from './api.config';

/** Profil utilisateur renvoyé par le microservice users (GET /users/me). */
export interface UserProfile {
  sub: string;
  preferred_username: string;
  email: string;
  roles?: string[];
}

/**
 * Service pour consommer les APIs du microservice users via le Gateway.
 * Sign In : fait côté front par KeycloakService.login() (AuthService / navbar).
 * Sign Out : fait par KeycloakService.logout().
 * Ici on consomme le backend pour récupérer le profil après Sign In (token envoyé automatiquement).
 */
@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly usersUrl = `${API_URL}/users`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère le profil de l'utilisateur connecté (après Sign In).
   * Le header Authorization Bearer est ajouté par KeycloakBearerInterceptor.
   * Si non connecté ou token invalide → 401, le backend renvoie 401.
   */
  getMe(): Observable<UserProfile | null> {
    return this.http.get<UserProfile>(`${this.usersUrl}/me`).pipe(
      catchError(() => of(null))
    );
  }

  /** Créer un compte (enregistré en base MySQL commune). Pas besoin de token. */
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.usersUrl}/register`, data);
  }
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface RegisterResponse {
  id: number;
  email: string;
  username: string;
  message: string;
}
