import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, of, switchMap } from 'rxjs';
import { aiAssistantGatewayPrefix, messagingGatewayPrefix } from '../api-gateway-urls';

export interface AiConversationDto {
  id: number;
  title: string | null;
  lastMessagePreview: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiChatRequest {
  message: string;
  conversationId?: number | null;
}

export interface AiChatResponse {
  reply: string;
  conversationId: number;
}

export interface AiMessageDto {
  id: number;
  sender: string;
  messageType: string;
  content: string;
  imageName: string | null;
  imageContentType: string | null;
  imageSize: number | null;
  timestamp: string;
}

export interface ChatMessageRequest {
  senderId: number;
  receiverId: number;
  content: string;
}

export interface ChatMessageResponse {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
}

export interface MessagingParticipantDto {
  id: number;
  username: string;
  displayName: string;
  role: 'TEACHER' | 'STUDENT' | 'ADMIN';
}

export interface MessagingConversationDto {
  id: number;
  teacherId: number;
  studentId: number;
  teacherName: string;
  studentName: string;
  lastMessagePreview: string;
  updatedAt: string;
}

export interface MessagingMessageDto {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface MessagingCreateConversationDto {
  id: number;
  teacherId: number;
  studentId: number;
  teacherName: string;
  studentName: string;
  lastMessagePreview: string;
  updatedAt: string;
}

interface MyMemoryResponseData {
  translatedText: string;
}

interface MyMemoryResponse {
  responseData: MyMemoryResponseData;
}

interface DuckDuckGoResponse {
  AbstractText?: string;
  Answer?: string;
  Definition?: string;
  RelatedTopics?: Array<{ Text?: string }>;
}

type WikiOpenSearchResponse = [string, string[], string[], string[]];

interface WikiSummaryResponse {
  extract?: string;
}

@Injectable({ providedIn: 'root' })
export class MessagingApiService {
  constructor(private readonly http: HttpClient) {}

  // Temporary fixed id expected by current AI Assistant backend contract.
  private readonly userId = 1;

  private aiBase(): string {
    return aiAssistantGatewayPrefix();
  }

  private messagingBase(): string {
    return messagingGatewayPrefix();
  }

  private aiHeaders(): HttpHeaders {
    return new HttpHeaders({ 'X-User-Id': String(this.userId) });
  }

  getMyConversations(): Observable<AiConversationDto[]> {
    return this.http.get<AiConversationDto[]>(`${this.aiBase()}/api/ai/conversations/my`, {
      headers: this.aiHeaders()
    });
  }

  createConversation(title?: string): Observable<AiConversationDto> {
    return this.http.post<AiConversationDto>(
      `${this.aiBase()}/api/ai/conversations`,
      { title: title ?? null },
      { headers: this.aiHeaders() }
    );
  }

  deleteConversation(conversationId: number): Observable<void> {
    return this.http.delete<void>(`${this.aiBase()}/api/ai/conversations/${conversationId}`, {
      headers: this.aiHeaders()
    });
  }

  deleteAllConversations(): Observable<{ deletedConversations: number }> {
    return this.http.delete<{ deletedConversations: number }>(`${this.aiBase()}/api/ai/conversations/my/all`, {
      headers: this.aiHeaders()
    });
  }

  chatWithAssistant(payload: AiChatRequest): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(`${this.aiBase()}/api/ai/chat`, payload, {
      headers: this.aiHeaders()
    });
  }

  getAiConversationMessages(conversationId: number): Observable<AiMessageDto[]> {
    return this.http.get<AiMessageDto[]>(`${this.aiBase()}/api/ai/conversations/${conversationId}/messages`, {
      headers: this.aiHeaders()
    });
  }

  postChatMessage(payload: ChatMessageRequest): Observable<ChatMessageResponse> {
    return this.http.post<ChatMessageResponse>(`${this.messagingBase()}/api/messages`, payload);
  }

  getChatConversation(userId: number, peerId: number): Observable<ChatMessageResponse[]> {
    return this.http.get<ChatMessageResponse[]>(`${this.messagingBase()}/api/messages`, {
      params: { userId, peerId }
    });
  }

  getTeacherStudents(): Observable<MessagingParticipantDto[]> {
    return this.http.get<MessagingParticipantDto[]>(`${this.messagingBase()}/api/messaging/teacher/students`);
  }

  getStudentTeacher(): Observable<MessagingParticipantDto> {
    return this.http.get<MessagingParticipantDto>(`${this.messagingBase()}/api/messaging/student/teacher`);
  }

  getRoleConversations(): Observable<MessagingConversationDto[]> {
    return this.http.get<MessagingConversationDto[]>(`${this.messagingBase()}/api/messaging/conversations`);
  }

  createRoleConversation(participantId: number): Observable<MessagingCreateConversationDto> {
    return this.http.post<MessagingCreateConversationDto>(`${this.messagingBase()}/api/messaging/conversations`, { participantId });
  }

  getConversationMessages(conversationId: number): Observable<MessagingMessageDto[]> {
    return this.http.get<MessagingMessageDto[]>(`${this.messagingBase()}/api/messaging/conversations/${conversationId}/messages`);
  }

  sendConversationMessage(conversationId: number, content: string): Observable<MessagingMessageDto> {
    return this.http.post<MessagingMessageDto>(`${this.messagingBase()}/api/messaging/conversations/${conversationId}/messages`, { content });
  }

  sendTeacherMessageToStudent(studentId: number, content: string): Observable<MessagingMessageDto> {
    return this.http.post<MessagingMessageDto>(`${this.messagingBase()}/api/messaging/teacher/students/${studentId}/messages`, { content });
  }

  translateWithMyMemory(text: string, sourceLanguage: string, targetLanguage: string): Observable<MyMemoryResponse> {
    const sourceCode = this.toLanguageCode(sourceLanguage);
    const targetCode = this.toLanguageCode(targetLanguage);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceCode}|${targetCode}`;
    return this.http.get<MyMemoryResponse>(url);
  }

  answerAnyQuestion(question: string): Observable<string> {
    const q = question.trim();
    if (!q) {
      return of('');
    }

    const duckUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`;
    return this.http.get<DuckDuckGoResponse>(duckUrl).pipe(
      map((res) => {
        const fromDuck =
          res.AbstractText?.trim() ||
          res.Answer?.trim() ||
          res.Definition?.trim() ||
          res.RelatedTopics?.[0]?.Text?.trim() ||
          '';
        return fromDuck;
      }),
      switchMap((duckAnswer) => {
        if (duckAnswer) {
          return of(duckAnswer);
        }
        const wikiSearchUrl =
          `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=1&namespace=0&format=json&origin=*`;
        return this.http.get<WikiOpenSearchResponse>(wikiSearchUrl).pipe(
          switchMap((search) => {
            const title = search?.[1]?.[0];
            if (!title) {
              return of('');
            }
            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
            return this.http.get<WikiSummaryResponse>(summaryUrl).pipe(
              map((summary) => summary.extract?.trim() || '')
            );
          })
        );
      }),
      catchError(() => of(''))
    );
  }

  private toLanguageCode(label: string): string {
    switch (label) {
      case 'French':
        return 'fr';
      case 'Arabic':
        return 'ar';
      case 'Portuguese':
        return 'pt';
      case 'English':
      default:
        return 'en';
    }
  }
}
