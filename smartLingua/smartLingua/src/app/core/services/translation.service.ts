import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { MESSAGING_API_BASE } from '../api-config';
import { getSessionUser } from './local-session.service';

interface TranslationApiResponse {
  translatedText: string;
  provider?: string;
}

export interface TranslationLanguage {
  code: string;
  name: string;
}

export interface TranslationHistoryItem {
  id: number;
  sourceLanguage: string;
  targetLanguage: string;
  inputText: string;
  translatedText: string;
  provider: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class TranslationService {
  constructor(private http: HttpClient) {}

  /**
   * Appelle le backend local (/api/translate) qui relaie la requete vers LibreTranslate.
   * On centralise l'appel externe cote serveur pour eviter les problemes CORS et exposer
   * une seule API au frontend.
   */
  translate(text: string, source: string, target: string): Observable<TranslationApiResponse> {
    return this.http
      .post<TranslationApiResponse>(`${MESSAGING_API_BASE}/api/translate`, {
        q: text,
        source,
        target,
      }, { headers: this.userHeaders() })
      .pipe(
        catchError((err) => {
          const message =
            err?.error?.message ??
            (typeof err?.error === 'string' ? err.error : null) ??
            'Translation indisponible pour le moment.';
          return throwError(() => new Error(message));
        })
      );
  }

  getLanguages(): Observable<TranslationLanguage[]> {
    return this.http
      .get<TranslationLanguage[]>(`${MESSAGING_API_BASE}/api/translate/languages`)
      .pipe(
        catchError(() =>
          throwError(() => new Error('Unable to load languages.'))
        )
      );
  }

  getHistory(): Observable<TranslationHistoryItem[]> {
    return this.http
      .get<TranslationHistoryItem[]>(`${MESSAGING_API_BASE}/api/translate/history`, {
        headers: this.userHeaders(),
      })
      .pipe(
        catchError(() =>
          throwError(() => new Error('Unable to load translation history.'))
        )
      );
  }

  private userHeaders(): HttpHeaders {
    const user = getSessionUser();
    if (!user) {
      return new HttpHeaders();
    }
    return new HttpHeaders({ 'X-User-Id': String(user.id) });
  }
}
