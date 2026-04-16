/**
 * Mode « dev local » : utilise le proxy Angular et les MS directs (8094, etc.).
 * Host localhost / 127.0.0.1 : **tous les ports** (ex. `ng serve --port 4300`) — pas seulement 4200.
 * Autres hosts : uniquement si le port est 4200 (ex. test depuis le réseau local sur :4200).
 */
export function isNgServe(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const h = window.location.hostname;
  const p = window.location.port;
  if (h === 'localhost' || h === '127.0.0.1') {
    return true;
  }
  return p === '4200';
}

/** Base sans chemin API : en dev = MS direct ; en prod/hosted = préfixe gateway Eureka. */
export function adaptiveGatewayPrefix(): string {
  if (isNgServe()) {
    // En dev Angular, on force le proxy même origine pour éviter les erreurs CORS (status 0).
    return `${window.location.origin}`;
  }
  return 'http://localhost:8093/adaptive-learning';
}

export function coursesGatewayPrefix(): string {
  if (isNgServe()) {
    return `${window.location.origin}/api-proxy/courses`;
  }
  return 'http://localhost:8093/courses';
}

/** Module Quiz (test final) — en dev via proxy vers le MS (8088). */
export function quizGatewayPrefix(): string {
  if (isNgServe()) {
    return `${window.location.origin}/api-proxy/quiz`;
  }
  return 'http://localhost:8093/quiz';
}
