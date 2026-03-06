import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';
import { setSession, type SessionUser } from './local-session.service';
import { MESSAGING_API_BASE } from '../api-config';

const API = MESSAGING_API_BASE;

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private http: HttpClient) {}

  register(username: string, email: string, password: string, role: 'student' | 'teacher') {
    return this.http
      .post<AuthUser>(`${API}/api/auth/register`, { username, email, password, role })
      .pipe(
        map((user) => ({ ok: true as const, user: toSessionUser(user) })),
        catchError((err) => of({ ok: false as const, message: getErrMessage(err) }))
      );
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthUser>(`${API}/api/auth/login`, { email, password })
      .pipe(
        map((user) => ({ ok: true as const, user: toSessionUser(user) })),
        catchError((err) => of({ ok: false as const, message: getErrMessage(err) }))
      );
  }

  setSession(user: SessionUser): void {
    setSession(user);
  }
}

function toSessionUser(u: AuthUser): SessionUser {
  const role = (u.role === 'teacher' ? 'teacher' : 'student') as 'student' | 'teacher';
  return { id: u.id, username: u.username, email: u.email, role };
}

function getErrMessage(err: any): string {
  if (err?.status === 0) {
    return `Le serveur (${MESSAGING_API_BASE}) ne répond pas. Démarre le microservice Messaging et MySQL.`;
  }
  return (
    err?.error?.message ??
    (typeof err?.error === 'string' ? err.error : null) ??
    err?.message ??
    'Erreur réseau.'
  );
}
