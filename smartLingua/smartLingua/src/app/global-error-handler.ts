import { ErrorHandler, Injectable } from '@angular/core';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const o = error as Record<string, unknown>;
    if (typeof o['message'] === 'string') return o['message'];
    if (typeof o['error'] === 'string') return o['error'];
    const err = o['error'];
    if (err && typeof err === 'object' && typeof (err as Record<string, unknown>)['message'] === 'string') {
      return (err as Record<string, unknown>)['message'] as string;
    }
    try {
      const s = JSON.stringify(error);
      if (s.length < 200) return s;
      return s.slice(0, 200) + '…';
    } catch {
      return 'Erreur inconnue';
    }
  }
  return String(error);
}

/**
 * Capture toutes les erreurs non gérées et les affiche dans la console.
 * Pas de bannière visuelle en bas de page.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const message = getErrorMessage(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error('[GlobalErrorHandler]', message, stack);
  }
}
