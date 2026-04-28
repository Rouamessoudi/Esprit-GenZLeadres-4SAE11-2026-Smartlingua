import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrait un message lisible depuis une erreur HttpClient (Spring JSON, HTML, réseau).
 */
export function readApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const b = err.error;
    if (b && typeof b === 'object' && 'message' in b) {
      const m = (b as { message?: unknown }).message;
      if (m != null && String(m).trim()) {
        return String(m);
      }
    }
    if (b && typeof b === 'object' && 'error' in b) {
      const e = (b as { error?: unknown }).error;
      if (e != null && String(e).trim()) {
        return String(e);
      }
    }
    if (typeof b === 'string') {
      const t = b.trim();
      if (t.startsWith('{')) {
        try {
          const j = JSON.parse(t) as { message?: string };
          if (j?.message) {
            return j.message;
          }
        } catch {
          /* ignore */
        }
      }
      if (t && t.length < 800 && !t.startsWith('<')) {
        return t;
      }
    }
    if (err.status === 0) {
      return 'Impossible de joindre le serveur (service arrêté, mauvais port, ou proxy ng serve).';
    }
    if (err.status === 401) {
      return 'Session expirée ou non authentifié — reconnectez-vous.';
    }
    if (err.status === 403) {
      return 'Accès refusé (droits insuffisants).';
    }
    if (err.status === 502 || err.status === 503 || err.status === 504) {
      return 'Le service demandé ne répond pas (microservice arrêté — ex. Quiz :8088 — ou gateway).';
    }
    if (err.status >= 400) {
      const suffix = err.statusText ? ` ${err.statusText}` : '';
      return `Erreur HTTP ${err.status}${suffix}.`;
    }
  }
  return fallback;
}
