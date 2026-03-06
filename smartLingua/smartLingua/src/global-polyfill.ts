/**
 * Polyfill pour les libs (ex. sockjs-client) qui utilisent "global" (Node) dans le navigateur.
 * Doit être importé en premier dans main.ts.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : ({} as any));
if (g != null) {
  (g as Record<string, unknown>)['global'] = g;
  if (typeof (g as Record<string, unknown>)['globalThis'] === 'undefined') {
    (g as Record<string, unknown>)['globalThis'] = g;
  }
}
