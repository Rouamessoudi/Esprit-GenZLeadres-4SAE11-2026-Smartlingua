import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AI_API_BASE } from '../api-config';
import { getSessionUser } from './local-session.service';

/**
 * Client HTTP du module AI Assistant.
 * Base URL : {@link AI_API_BASE}. Identité : en-tête X-User-Id (id session SmartLingua).
 * La clé Gemini n’est jamais utilisée ici — uniquement côté ai-assistant-service.
 */

export interface AiConversation {
  id: number;
  title: string;
  lastMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
}

export type AiMessageType = 'TEXT' | 'IMAGE_QUESTION' | 'IMAGE_ANALYSIS';
export type AiSenderType = 'USER' | 'AI';

export interface AiMessage {
  id: number;
  sender: AiSenderType;
  messageType: AiMessageType;
  content: string;
  imageName?: string;
  imageContentType?: string;
  imageSize?: number;
  timestamp: string;
}

export interface AiChatRequest {
  message: string;
  conversationId: number | null;
}

export interface AiChatResponse {
  reply: string;
  conversationId: number;
}

export interface DeleteAllHistoryResponse {
  deletedConversations: number;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  constructor(private http: HttpClient) {}

  /**
   * Envoie un message à l’API backend (jamais de clé API côté client).
   * @param conversationId null pour démarrer une nouvelle conversation persistée côté serveur.
   */
  sendMessage(message: string, conversationId: number | null): Observable<AiChatResponse> {
    const headers = this.authHeaders();
    const body: AiChatRequest = { message, conversationId };
    return this.http
      .post<AiChatResponse>(`${AI_API_BASE}/api/ai/chat`, body, { headers })
      .pipe(
        catchError((err) => {
          return throwError(() => new Error(this.toErrorMessage(err)));
        })
      );
  }

  /** POST multipart /api/ai/chat/image — champ fichier nommé "image" côté backend. */
  sendImageQuestion(question: string, image: File, conversationId: number | null): Observable<AiChatResponse> {
    const headers = this.authHeaders();
    const formData = new FormData();
    formData.append('question', question);
    formData.append('image', image);
    if (conversationId !== null) {
      formData.append('conversationId', String(conversationId));
    }
    return this.http
      .post<AiChatResponse>(`${AI_API_BASE}/api/ai/chat/image`, formData, { headers })
      .pipe(catchError((err) => throwError(() => new Error(this.toErrorMessage(err)))));
  }

  getMyConversations(): Observable<AiConversation[]> {
    return this.http
      .get<AiConversation[]>(`${AI_API_BASE}/api/ai/conversations/my`, { headers: this.authHeaders() })
      .pipe(catchError((err) => throwError(() => new Error(this.toErrorMessage(err)))));
  }

  createConversation(title?: string): Observable<AiConversation> {
    return this.http
      .post<AiConversation>(`${AI_API_BASE}/api/ai/conversations`, { title: title ?? '' }, { headers: this.authHeaders() })
      .pipe(catchError((err) => throwError(() => new Error(this.toErrorMessage(err)))));
  }

  getConversationMessages(conversationId: number): Observable<AiMessage[]> {
    return this.http
      .get<AiMessage[]>(`${AI_API_BASE}/api/ai/conversations/${conversationId}/messages`, { headers: this.authHeaders() })
      .pipe(catchError((err) => throwError(() => new Error(this.toErrorMessage(err)))));
  }

  deleteConversation(conversationId: number): Observable<void> {
    return this.http
      .delete<void>(`${AI_API_BASE}/api/ai/conversations/${conversationId}`, { headers: this.authHeaders() })
      .pipe(catchError((err) => throwError(() => new Error(this.toErrorMessage(err)))));
  }

  deleteAllHistory(): Observable<DeleteAllHistoryResponse> {
    return this.http
      .delete<DeleteAllHistoryResponse>(`${AI_API_BASE}/api/ai/conversations/my/all`, { headers: this.authHeaders() })
      .pipe(catchError((err) => throwError(() => new Error(this.toErrorMessage(err)))));
  }

  /** En-tête requis par le backend pour lier les conversations à l’utilisateur connecté. */
  private authHeaders(): HttpHeaders {
    const u = getSessionUser();
    if (!u) {
      throw new Error('Tu dois être connecté pour utiliser AI Assistant.');
    }
    return new HttpHeaders().set('X-User-Id', String(u.id));
  }

  private toErrorMessage(err: any): string {
    return (
      err?.error?.message ??
      (typeof err?.error === 'string' ? err.error : null) ??
      (err?.status === 0
        ? `Assistant indisponible (${AI_API_BASE}). Démarre le microservice « ai-assistant-service » (port 8095).`
        : err?.status === 401
          ? 'Accès non autorisé. Connecte-toi puis réessaie.'
          : err?.status === 503
            ? 'AI Assistant temporairement surcharge (503). Reessaie dans quelques secondes.'
          : "Impossible de contacter l'assistant pour le moment.")
    );
  }
}
