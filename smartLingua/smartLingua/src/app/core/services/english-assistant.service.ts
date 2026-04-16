import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MESSAGING_API_BASE } from '../api-config';

export interface AssistantResource {
  id: number;
  title: string;
  description: string;
  level: string;
  category: string;
  url: string;
}

export interface AssistantMessageResponse {
  reply: string;
  levelUsed: string | null;
  levelRequired: boolean;
  resources: AssistantResource[];
}

@Injectable({ providedIn: 'root' })
export class EnglishAssistantService {
  constructor(private http: HttpClient) {}

  sendMessage(userId: number, message: string, level?: string): Observable<AssistantMessageResponse> {
    return this.http.post<AssistantMessageResponse>(`${MESSAGING_API_BASE}/api/chatbot/message`, {
      userId,
      message,
      level: level ?? null,
    });
  }

  getHistory(userId: number): Observable<Array<{ id: number; message: string; response: string; level: string; createdAt: string }>> {
    return this.http.get<Array<{ id: number; message: string; response: string; level: string; createdAt: string }>>(
      `${MESSAGING_API_BASE}/api/chatbot/history/${userId}`
    );
  }

  saveResource(userId: number, resourceId: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${MESSAGING_API_BASE}/api/resources/recommend`, {
      userId,
      resourceId,
    });
  }
}
