import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { getSessionUser, clearSession } from '../../core/services/local-session.service';
import {
  MessagingService,
  ConversationDTO,
  MessageDTO,
  UserDTO,
  InvitationDTO,
} from '../../core/services/messaging.service';
import { PresenceService } from '../../core/services/presence.service';
import { ChatSidebarComponent, type ChatTab } from './chat-sidebar/chat-sidebar.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { ModalCreateGroupComponent } from './modal-create-group/modal-create-group.component';
import { CallModalComponent } from './call-modal/call-modal.component';
import { Subscription } from 'rxjs';
import { WebrtcCallService, type WsConnectionStatus } from '../../core/services/webrtc-call.service';
import { MESSAGING_API_BASE } from '../../core/api-config';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ChatSidebarComponent,
    ChatWindowComponent,
    ModalCreateGroupComponent,
    CallModalComponent,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit, OnDestroy {
  username = '';
  currentUserId = 0;
  isTeacher = false;
  users: UserDTO[] = [];
  otherUsers: UserDTO[] = [];
  usersLoaded = false;
  conversations: ConversationDTO[] = [];
  convsLoaded = false;
  selectedConversation: ConversationDTO | null = null;
  messages: MessageDTO[] = [];
  newMessage = '';
  sending = false;
  showUserList = false;
  showCreateGroupModal = false;
  createGroupLoading = false;
  errorBackend = '';
  activeTab: ChatTab = 'all';
  pendingInvitations: InvitationDTO[] = [];
  pendingInvitationsCount = 0;
  /** Ids des utilisateurs à qui on a déjà envoyé une invitation (pour afficher l’icône succès) */
  sentInvitationToUserIds: number[] = [];
  /** Ids des utilisateurs que j'ai bloqués (pour afficher Bloquer / Débloquer dans le menu) */
  blockedUserIds = new Set<number>();
  wsConnectionStatus: WsConnectionStatus = 'DISCONNECTED';
  private pollSub?: Subscription;
  private wsStatusSub?: Subscription;
  private incomingMsgSub?: Subscription;
  private invitationAcceptedSub?: Subscription;
  private newInvitationSub?: Subscription;
  private invitationRejectedSub?: Subscription;

  constructor(
    private messaging: MessagingService,
    private router: Router,
    private presence: PresenceService,
    private webrtc: WebrtcCallService
  ) {}

  ngOnInit(): void {
    const u = getSessionUser();
    if (!u) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }
    this.username = u.username;
    this.currentUserId = u.id;
    this.isTeacher = u.role === 'teacher';
    try {
      this.presence.start(this.currentUserId);
    } catch (e) {
      console.warn('Presence non démarrée:', e);
    }
    try {
      this.webrtc.connect(this.currentUserId);
    } catch (e) {
      console.warn('WebRTC signalisation non connectée:', e);
    }
    this.wsStatusSub = this.webrtc.connectionStatus.subscribe((s) => (this.wsConnectionStatus = s));
    this.incomingMsgSub = this.webrtc.incomingChatMessages.subscribe((msg) => this.onIncomingMessage(msg));
    this.invitationAcceptedSub = this.webrtc.invitationAccepted.subscribe((payload) => this.onInvitationAccepted(payload));
    this.newInvitationSub = this.webrtc.newInvitation.subscribe(() => this.onNewInvitationReceived());
    this.invitationRejectedSub = this.webrtc.invitationRejected.subscribe(() => this.onInvitationRejected());
    this.loadUsers();
    this.loadConversations();
    this.loadPendingInvitations();
    this.loadBlockedUsers();
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }

  loadPendingInvitations(): void {
    this.messaging.getPendingInvitations(this.currentUserId).subscribe({
      next: (list) => (this.pendingInvitations = list),
      error: () => (this.pendingInvitations = []),
    });
    this.messaging.getPendingInvitationsCount(this.currentUserId).subscribe({
      next: (n) => (this.pendingInvitationsCount = n),
      error: () => (this.pendingInvitationsCount = 0),
    });
    this.messaging.getSentInvitations(this.currentUserId).subscribe({
      next: (list) => {
        const pendingReceiverIds = list.filter((i) => i.status === 'PENDING').map((i) => i.receiverId);
        this.sentInvitationToUserIds = [...new Set([...this.sentInvitationToUserIds, ...pendingReceiverIds])];
      },
      error: () => {},
    });
  }

  loadBlockedUsers(): void {
    this.messaging.getBlockedUserIds(this.currentUserId).subscribe({
      next: (ids) => (this.blockedUserIds = new Set(ids)),
      error: () => (this.blockedUserIds = new Set()),
    });
  }

  loadUsers(): void {
    this.messaging.getUsers().subscribe({
      next: (list) => {
        this.users = list;
        this.otherUsers = list.filter((x) => x.id !== this.currentUserId);
        this.usersLoaded = true;
      },
      error: () => {
        this.errorBackend =
          `Le serveur de chat (${MESSAGING_API_BASE}) est indisponible. Démarrez MySQL (XAMPP), puis le microservice Messaging dans IntelliJ.`;
      },
    });
  }

  loadConversations(): void {
    this.messaging.getUserConversations(this.currentUserId).subscribe({
      next: (list) => {
        this.conversations = list;
        this.convsLoaded = true;
      },
      error: () => {
        if (!this.errorBackend) {
          this.errorBackend =
            `Le serveur de chat (${MESSAGING_API_BASE}) est indisponible. Démarrez MySQL (XAMPP), puis le microservice Messaging dans IntelliJ.`;
        }
      },
    });
  }

  get filteredConversations(): ConversationDTO[] {
    if (this.activeTab === 'groups') return [];
    return this.conversations;
  }

  /** True si l'utilisateur actuel a bloqué l'autre participant de la conversation sélectionnée */
  get isOtherBlocked(): boolean {
    if (!this.selectedConversation) return false;
    const otherId =
      this.selectedConversation.participant1Id === this.currentUserId
        ? this.selectedConversation.participant2Id
        : this.selectedConversation.participant1Id;
    return this.blockedUserIds.has(otherId);
  }

  onTabChange(tab: ChatTab): void {
    this.activeTab = tab;
    if (tab === 'invitations') this.loadPendingInvitations();
  }

  onSelectConversation(c: ConversationDTO): void {
    this.selectedConversation = c;
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;

    this.conversations = this.conversations.map((x) =>
      x.id === c.id ? { ...x, unreadCount: 0 } : x
    );
    if (c.id !== 0) {
      this.messaging.markAsRead(this.currentUserId, c.id).subscribe();
    }

    if (c.id === 0) {
      this.messages = [];
      return;
    }
    this.messaging.getConversationMessages(c.id).subscribe({
      next: (list) => (this.messages = list),
      error: () => (this.messages = []),
    });
  }

  /** Reçoit les messages en temps réel via WebSocket (pas besoin de refresh). */
  onIncomingMessage(msg: MessageDTO): void {
    const convId = msg.conversationId;
    const conv = this.conversations.find(
      (c) =>
        c.id === convId ||
        (c.participant1Id === msg.senderId && c.participant2Id === msg.receiverId) ||
        (c.participant1Id === msg.receiverId && c.participant2Id === msg.senderId)
    );
    if (conv) {
      this.conversations = this.conversations.map((c) =>
        c.id === conv.id
          ? {
              ...c,
              lastMessagePreview: msg.content?.slice(0, 50) ?? c.lastMessagePreview,
              lastMessageAt: msg.timestamp ?? c.lastMessageAt,
            }
          : c
      );
    }
    const isSelectedConv = this.selectedConversation && conv && this.selectedConversation.id === conv.id;
    if (isSelectedConv) {
      const exists = this.messages.some((m) => m.id === msg.id);
      if (!exists) {
        const pending = this.messages.filter((m) => m.id === -1);
        this.messages = [...this.messages.filter((m) => m.id !== -1), msg, ...pending].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      }
      if (msg.receiverId === this.currentUserId && conv.id !== 0) {
        this.messaging.markAsRead(this.currentUserId, conv.id).subscribe();
      }
    }
    // Notifier l'utilisateur quand il reçoit un message (surtout si pas sur cette conversation ou fenêtre en arrière-plan)
    if (msg.receiverId === this.currentUserId && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const showNotify = !isSelectedConv || !document.hasFocus();
      if (showNotify) {
        const sender = this.users.find((u) => u.id === msg.senderId);
        const senderName = sender?.username ?? 'Quelqu\'un';
        const body = (msg.content ?? '').slice(0, 80);
        new Notification('SmartLingua – Nouveau message', {
          body: `${senderName} : ${body || '…'}`,
          icon: '/favicon.ico',
        });
      }
    }
  }

  /** Notifié en temps réel quand quelqu'un accepte notre invitation : on recharge les conversations et on affiche un message. */
  onInvitationAccepted(payload: { conversationId: number; acceptedByUserId: number; acceptedByUsername?: string }): void {
    const name = payload.acceptedByUsername ?? 'Un utilisateur';
    this.messaging.getUserConversations(this.currentUserId).subscribe({
      next: (list) => {
        this.conversations = list;
        this.convsLoaded = true;
        const conv = list.find((c) => c.id === payload.conversationId);
        if (conv) this.onSelectConversation(conv);
        this.errorBackend = name + ' a accepté votre invitation. Vous pouvez maintenant démarrer la conversation.';
        setTimeout(() => (this.errorBackend = ''), 6000);
      },
    });
  }

  /** Notifié en temps réel quand on reçoit une nouvelle invitation (récepteur). */
  onNewInvitationReceived(): void {
    this.loadPendingInvitations();
    this.errorBackend = 'Vous avez reçu une nouvelle invitation. Consultez l\'onglet Invitations.';
    setTimeout(() => (this.errorBackend = ''), 5000);
  }

  /** Notifié en temps réel quand une invitation qu'on a envoyée a été refusée. */
  onInvitationRejected(): void {
    this.errorBackend = 'Votre invitation a été refusée.';
    setTimeout(() => (this.errorBackend = ''), 5000);
  }

  /** Démarrer une conversation = envoyer une invitation. La conversation n'existe qu'après acceptation. */
  onStartConversation(other: UserDTO): void {
    this.showUserList = false;
    this.onSendInvitation(other);
  }

  /**
   * Ouvrir la zone chat avec un utilisateur (recherche ou liste).
   * Charge la conversation si elle existe, sinon affiche une conversation vide (invitation non acceptée).
   */
  onOpenChatWithUser(user: UserDTO): void {
    this.showUserList = false;
    this.errorBackend = '';
    this.messaging.getOrCreateConversation(this.currentUserId, user.id).subscribe({
      next: (conv) => {
        const existing = this.conversations.find((c) => c.id === conv.id);
        if (!existing) {
          this.conversations = [...this.conversations, { ...conv, unreadCount: 0 }];
        }
        this.selectedConversation = conv;
        this.messages = [];
        this.messaging.getConversationMessages(conv.id).subscribe({
          next: (list) => (this.messages = list),
          error: () => (this.messages = []),
        });
        this.messaging.markAsRead(this.currentUserId, conv.id).subscribe();
      },
      error: () => {
        const placeholder: ConversationDTO = {
          id: 0,
          participant1Id: this.currentUserId,
          participant2Id: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.selectedConversation = placeholder;
        this.messages = [];
      },
    });
  }

  onAcceptInvitation(inv: InvitationDTO): void {
    this.messaging.acceptInvitation(inv.id).subscribe({
      next: () => {
        this.pendingInvitations = this.pendingInvitations.filter((x) => x.id !== inv.id);
        this.pendingInvitationsCount = Math.max(0, this.pendingInvitationsCount - 1);
        this.messaging.getUserConversations(this.currentUserId).subscribe({
          next: (list) => {
            this.conversations = list;
            this.convsLoaded = true;
            const conv = list.find(
              (c) =>
                (c.participant1Id === this.currentUserId && c.participant2Id === inv.senderId) ||
                (c.participant2Id === this.currentUserId && c.participant1Id === inv.senderId)
            );
            if (conv) this.onSelectConversation(conv);
          },
        });
      },
      error: (err) => {
        this.errorBackend = this.getSafeErrorMessage(err, 'Impossible d\'accepter l\'invitation.');
        setTimeout(() => (this.errorBackend = ''), 6000);
        this.loadPendingInvitations();
      },
    });
  }

  onRejectInvitation(inv: InvitationDTO): void {
    this.messaging.rejectInvitation(inv.id).subscribe({
      next: () => {
        this.pendingInvitations = this.pendingInvitations.filter((x) => x.id !== inv.id);
        this.pendingInvitationsCount = Math.max(0, this.pendingInvitationsCount - 1);
      },
      error: (err) => {
        this.errorBackend = this.getSafeErrorMessage(err, 'Impossible de refuser l\'invitation.');
        setTimeout(() => (this.errorBackend = ''), 6000);
        this.loadPendingInvitations();
      },
    });
  }

  getSafeErrorMessage(err: { status?: number; error?: { message?: string }; message?: string } | null, defaultMsg: string): string {
    if (!err) return defaultMsg;
    const raw = err?.error?.message ?? err?.message ?? '';
    if (raw && (raw.includes('insert into') || raw.includes('constraint [') || raw.includes('could not execute statement') || raw.includes('SQL ['))) {
      console.error('[Chat] Backend error (hidden from UI):', raw);
      return defaultMsg;
    }
    if (err?.status === 0 || err?.message?.includes('Unknown Error') || err?.message?.includes('HttpFailureResponse')) {
      return `Le serveur de chat (${MESSAGING_API_BASE}) est indisponible. Démarrez MySQL (XAMPP), puis le microservice Messaging dans IntelliJ.`;
    }
    return err?.error?.message || err?.message || defaultMsg;
  }

  onSendInvitation(user: UserDTO): void {
    this.errorBackend = '';
    const message = 'Souhaite discuter avec toi.';
    const invitationType = 'DISCUSSION';
    this.messaging.createInvitation(this.currentUserId, user.id, message, invitationType).subscribe({
      next: () => {
        this.errorBackend = '';
        this.sentInvitationToUserIds = [...this.sentInvitationToUserIds, user.id];
        this.loadPendingInvitations();
        setTimeout(() => (this.errorBackend = ''), 0);
      },
      error: (err: { status?: number; error?: { message?: string }; message?: string }) => {
        const raw = err?.error?.message ?? err?.message ?? '';
        console.error('[Chat] Invitation non envoyée:', err, raw);
        this.errorBackend = this.getSafeErrorMessage(err, 'Invitation non envoyée.');
        setTimeout(() => (this.errorBackend = ''), 6000);
      },
    });
  }

  onStartCall(payload: { user: UserDTO; video: boolean }): void {
    this.webrtc.startCall(payload.user.id, payload.video, payload.user.username);
  }

  onOpenInfo(): void {
    // Infos conversation / utilisateur — à enrichir plus tard
  }

  onBlockUser(otherUserId: number): void {
    const isBlocked = this.blockedUserIds.has(otherUserId);
    const req = isBlocked
      ? this.messaging.unblockUser(this.currentUserId, otherUserId)
      : this.messaging.blockUser(this.currentUserId, otherUserId);
    req.subscribe({
      next: () => {
        if (isBlocked) {
          this.blockedUserIds.delete(otherUserId);
          this.blockedUserIds = new Set(this.blockedUserIds);
          this.errorBackend = 'Utilisateur débloqué.';
        } else {
          this.blockedUserIds.add(otherUserId);
          this.blockedUserIds = new Set(this.blockedUserIds);
          this.errorBackend = 'Utilisateur bloqué. Il ne peut plus vous envoyer de message.';
        }
        setTimeout(() => (this.errorBackend = ''), 4000);
      },
      error: () => {
        // Ne pas afficher de message d'erreur en cas d'échec
      },
    });
  }

  onSendAttachments(files: File[]): void {
    if (!files.length) return;
    if (!this.selectedConversation) {
      this.errorBackend = 'Sélectionnez une conversation pour envoyer des fichiers.';
      setTimeout(() => (this.errorBackend = ''), 4000);
      return;
    }
    if (this.selectedConversation.id === 0) {
      this.errorBackend = 'Envoyez une invitation « Ajouter ami » et attendez que l\'utilisateur l\'accepte.';
      setTimeout(() => (this.errorBackend = ''), 5000);
      return;
    }
    const otherId =
      this.selectedConversation.participant1Id === this.currentUserId
        ? this.selectedConversation.participant2Id
        : this.selectedConversation.participant1Id;

    const isImage = (f: File) => (f.type || '').startsWith('image/');
    const imageFiles = files.filter(isImage);
    const otherFiles = files.filter((f) => !isImage(f));

    const sendContent = (content: string) => {
      this.sending = true;
      const pending: MessageDTO = {
        id: -1,
        senderId: this.currentUserId,
        receiverId: otherId,
        content,
        timestamp: new Date().toISOString(),
        isRead: false,
        conversationId: this.selectedConversation!.id,
      };
      this.messages = [...this.messages, pending];
      this.messaging.sendMessage(this.currentUserId, otherId, content).subscribe({
        next: (msg) => {
          const idx = this.messages.findIndex((m) => m.id === -1);
          if (idx !== -1) {
            this.messages = [...this.messages.slice(0, idx), msg, ...this.messages.slice(idx + 1)];
          } else {
            this.messages = [...this.messages, msg];
          }
          this.sending = false;
        },
        error: () => {
          this.messages = this.messages.filter((m) => m.id !== -1);
          this.sending = false;
          this.errorBackend = 'Erreur lors de l\'envoi.';
          setTimeout(() => (this.errorBackend = ''), 4000);
        },
      });
    };

    const reduceImageAndSend = (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        this.resizeImageDataUrl(dataUrl, 600, 0.75).then((resized) => sendContent(resized ?? dataUrl)).catch(() => sendContent(dataUrl));
      };
      reader.readAsDataURL(file);
    };

    imageFiles.forEach(reduceImageAndSend);
    otherFiles.forEach((f) => sendContent(`📎 Fichier : ${f.name} (envoi bientôt disponible)`));
  }

  private resizeImageDataUrl(dataUrl: string, maxWidth: number, quality: number): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width <= maxWidth) {
          resolve(dataUrl);
          return;
        }
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  onSendMessage(content: string): void {
    if (!this.selectedConversation || !content.trim()) return;
    if (this.selectedConversation.id === 0) {
      this.errorBackend = 'Envoyez une invitation « Ajouter ami » et attendez que l\'utilisateur l\'accepte pour pouvoir envoyer des messages.';
      setTimeout(() => (this.errorBackend = ''), 5000);
      return;
    }
    const otherId =
      this.selectedConversation.participant1Id === this.currentUserId
        ? this.selectedConversation.participant2Id
        : this.selectedConversation.participant1Id;
    const text = content.trim();

    const pendingMessage: MessageDTO = {
      id: -1,
      senderId: this.currentUserId,
      receiverId: otherId,
      content: text,
      timestamp: new Date().toISOString(),
      isRead: false,
      conversationId: this.selectedConversation.id,
    };
    this.messages = [...this.messages, pendingMessage];
    this.sending = true;

    this.messaging.sendMessage(this.currentUserId, otherId, text).subscribe({
      next: (msg) => {
        const idx = this.messages.findIndex((m) => m.id === -1);
        if (idx !== -1) {
          this.messages = [
            ...this.messages.slice(0, idx),
            msg,
            ...this.messages.slice(idx + 1),
          ];
        } else {
          this.messages = [...this.messages, msg];
        }
        this.sending = false;
      },
      error: (err: { headers?: { get(name: string): string | null }; error?: { message?: string }; status?: number; message?: string }) => {
        this.messages = this.messages.filter((m) => m.id !== -1);
        this.sending = false;
        const fallback = err?.headers?.get?.('X-Error-Message') || err?.error?.message || 'Impossible d\'envoyer le message.';
        this.errorBackend = this.getSafeErrorMessage(err, fallback);
        setTimeout(() => (this.errorBackend = ''), 5000);
      },
    });
  }

  onOpenCreateGroup(): void {
    this.showCreateGroupModal = true;
  }

  onCancelCreateGroup(): void {
    this.showCreateGroupModal = false;
  }

  onCreateGroup(payload: { name: string; memberIds: number[] }): void {
    this.createGroupLoading = true;
    this.messaging.createGroup(payload.name, payload.memberIds).subscribe({
      next: () => {
        this.createGroupLoading = false;
        this.showCreateGroupModal = false;
        this.loadConversations();
      },
      error: (err: { error?: { message?: string; status?: number }; status?: number }) => {
        this.createGroupLoading = false;
        const msg = err?.error?.status === 501
          ? 'Création de groupes bientôt disponible.'
          : this.getSafeErrorMessage(err, 'Erreur lors de la création du groupe.');
        this.errorBackend = msg;
        if (err?.status !== 501) this.showCreateGroupModal = false;
        setTimeout(() => (this.errorBackend = ''), 5000);
      },
    });
  }

  onLogout(): void {
    this.pollSub?.unsubscribe();
    this.wsStatusSub?.unsubscribe();
    this.incomingMsgSub?.unsubscribe();
    this.invitationAcceptedSub?.unsubscribe();
    this.newInvitationSub?.unsubscribe();
    this.invitationRejectedSub?.unsubscribe();
    this.webrtc.disconnect();
    clearSession();
    window.location.href = '/login';
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.wsStatusSub?.unsubscribe();
    this.incomingMsgSub?.unsubscribe();
    this.invitationAcceptedSub?.unsubscribe();
    this.newInvitationSub?.unsubscribe();
    this.invitationRejectedSub?.unsubscribe();
    this.webrtc.disconnect();
  }
}
