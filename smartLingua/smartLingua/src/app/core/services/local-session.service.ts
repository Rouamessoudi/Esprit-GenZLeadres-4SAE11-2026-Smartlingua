/**
 * Session après login/register (sans Keycloak).
 */
export interface SessionUser {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

const DEMO_USER_ID = 'demoUserId';
const DEMO_USER = 'demoUser';
const DEMO_USER_EMAIL = 'demoUserEmail';
const DEMO_USER_ROLE = 'demoUserRole';

export function setSession(user: SessionUser): void {
  sessionStorage.setItem(DEMO_USER_ID, String(user.id));
  sessionStorage.setItem(DEMO_USER, user.username);
  sessionStorage.setItem(DEMO_USER_EMAIL, user.email);
  sessionStorage.setItem(DEMO_USER_ROLE, user.role ?? 'student');
}

export function clearSession(): void {
  sessionStorage.removeItem(DEMO_USER_ID);
  sessionStorage.removeItem(DEMO_USER);
  sessionStorage.removeItem(DEMO_USER_EMAIL);
  sessionStorage.removeItem(DEMO_USER_ROLE);
}

export function getSessionUser(): SessionUser | null {
  const id = sessionStorage.getItem(DEMO_USER_ID);
  const username = sessionStorage.getItem(DEMO_USER);
  const email = sessionStorage.getItem(DEMO_USER_EMAIL);
  const role = (sessionStorage.getItem(DEMO_USER_ROLE) as SessionUser['role']) ?? 'student';
  if (!id || !username) return null;
  return { id: Number(id), username, email: email || username + '@local', role };
}

/** true si un utilisateur de session existe (même critère que getSessionUser). */
export function hasSession(): boolean {
  return getSessionUser() != null;
}
