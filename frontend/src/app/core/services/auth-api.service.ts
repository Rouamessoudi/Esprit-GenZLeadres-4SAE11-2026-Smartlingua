import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  role: 'student' | 'prof';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  ok: boolean;
  message: string;
  user: User | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly usersApiUrl = `${environment.usersApiUrl}/api/users`;

  constructor(private http: HttpClient) {}

  signup(payload: SignupRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.usersApiUrl}/signup`, payload);
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.usersApiUrl}/login`, payload);
  }

  setSession(user: User): void {
    localStorage.setItem('smartlingua_user', JSON.stringify(user));
  }

  getSession(): User | null {
    const raw = localStorage.getItem('smartlingua_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  clearSession(): void {
    localStorage.removeItem('smartlingua_user');
  }

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  getUserRole(): string | null {
    return this.getSession()?.role?.toUpperCase?.() ?? null;
  }

  isProf(): boolean {
    return this.getUserRole() === 'PROF';
  }
}
