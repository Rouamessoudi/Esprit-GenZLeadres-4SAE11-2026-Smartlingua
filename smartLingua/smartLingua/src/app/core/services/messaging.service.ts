import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MESSAGING_API_BASE } from '../api-config';

const API = MESSAGING_API_BASE;

export interface ConversationDTO {
  id: number;
  participant1Id: number;
  participant2Id: number;
  createdAt: string;
  updatedAt: string;
  messages?: MessageDTO[];
  unreadCount?: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
}

export interface MessageDTO {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
  conversationId?: number;
}

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  role?: 'student' | 'teacher';
}

export interface InvitationDTO {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  invitationType: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  respondedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class MessagingService {
  constructor(private http: HttpClient) {}

  getUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${API}/api/auth/users`);
  }

  getTeachers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${API}/api/teachers`);
  }

  getUserConversations(userId: number): Observable<ConversationDTO[]> {
    return this.http.get<ConversationDTO[]>(`${API}/messaging/conversations/user/${userId}`);
  }

  getConversation(conversationId: number, userId: number): Observable<ConversationDTO> {
    return this.http.get<ConversationDTO>(`${API}/messaging/conversations/${conversationId}/user/${userId}`);
  }

  getOrCreateConversation(userId1: number, userId2: number): Observable<ConversationDTO> {
    return this.http.get<ConversationDTO>(`${API}/messaging/conversations/between/${userId1}/${userId2}`);
  }

  getConversationMessages(conversationId: number): Observable<MessageDTO[]> {
    return this.http.get<MessageDTO[]>(`${API}/messaging/messages/conversation/${conversationId}`);
  }

  sendMessage(senderId: number, receiverId: number, content: string): Observable<MessageDTO> {
    return this.http.post<MessageDTO>(`${API}/messaging/messages/send/${senderId}`, {
      receiverId,
      content,
    });
  }

  /** Marquer les messages d'une conversation comme lus */
  markAsRead(userId: number, conversationId: number): Observable<void> {
    return this.http.put<void>(
      `${API}/messaging/messages/mark-read/${userId}/${conversationId}`,
      {}
    );
  }

  /** Créer un groupe (endpoint à implémenter côté backend) */
  createGroup(name: string, memberIds: number[]): Observable<{ id: number; name: string }> {
    return this.http.post<{ id: number; name: string }>(`${API}/messaging/groups`, { name, memberIds });
  }

  // ——— Invitations ———
  getPendingInvitations(userId: number): Observable<InvitationDTO[]> {
    return this.http.get<InvitationDTO[]>(`${API}/messaging/invitations/pending/${userId}`);
  }

  getPendingInvitationsCount(userId: number): Observable<number> {
    return this.http.get<number>(`${API}/messaging/invitations/pending-count/${userId}`);
  }

  /** Invitations envoyées par l'utilisateur (pour afficher l'icône succès côté recherche) */
  getSentInvitations(userId: number): Observable<InvitationDTO[]> {
    return this.http.get<InvitationDTO[]>(`${API}/messaging/invitations/sent/${userId}`);
  }

  createInvitation(senderId: number, receiverId: number, message: string, invitationType: string): Observable<InvitationDTO> {
    const payload = {
      senderId,
      receiverId,
      message: message || '',
      invitationType: invitationType && invitationType.trim() ? invitationType.trim() : 'DISCUSSION',
    };
    console.log('[Messaging] POST /messaging/invitations/create payload:', payload);
    return this.http.post<InvitationDTO>(`${API}/messaging/invitations/create`, payload);
  }

  acceptInvitation(invitationId: number): Observable<InvitationDTO> {
    return this.http.put<InvitationDTO>(`${API}/messaging/invitations/${invitationId}/accept`, {});
  }

  rejectInvitation(invitationId: number): Observable<InvitationDTO> {
    return this.http.put<InvitationDTO>(`${API}/messaging/invitations/${invitationId}/reject`, {});
  }

  // ——— Blocage ———
  blockUser(blockerId: number, blockedId: number): Observable<void> {
    return this.http.post<void>(`${API}/messaging/block/${blockerId}/${blockedId}`, {});
  }

  unblockUser(blockerId: number, blockedId: number): Observable<void> {
    return this.http.delete<void>(`${API}/messaging/block/${blockerId}/${blockedId}`);
  }

  getBlockedUserIds(blockerId: number): Observable<number[]> {
    return this.http.get<number[]>(`${API}/messaging/block/list/${blockerId}`);
  }
}
