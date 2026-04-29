import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, of, timeout } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { MessagingApiService, MessagingConversationDto } from '../../core/services/messaging-api.service';
import { UserSyncService } from '../../core/user-sync.service';
import { AuthService } from '../../core/auth.service';

type MessagingView = 'chat' | 'assistant' | 'translate';
type ChatContact = { id: number; name: string; preview: string; active: boolean; status: string; role?: AppRole; conversationId?: number | null; peerId?: number };
type ChatBubble = { id?: number; sender: 'me' | 'other'; text: string; timestamp?: string };
type AppRole = 'ADMIN' | 'TEACHER' | 'STUDENT';
type ChatUser = { id: number; username: string; status: string; role: AppRole };

@Component({
  selector: 'app-messaging-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="messaging-page">
      <header class="module-header">
        <h2>Messaging Module</h2>
        <p>{{ connectedRole === 'ADMIN' ? 'Vue admin supervision des discussions teacher/student.' : 'Chat, AI assistant, and translation in one place.' }}</p>
      </header>

      <div class="messaging-shell">
        <header class="smartlingua-header">
          <div class="brand">
            <span class="logo">文</span>
            <strong>SmartLingua</strong>
          </div>
          <nav>
            <button type="button" [class.active]="activeView === 'chat'" (click)="activeView = 'chat'">Chat</button>
            <button type="button" [class.active]="activeView === 'assistant'" (click)="activeView = 'assistant'">AI Assistant</button>
            <button type="button" [class.active]="activeView === 'translate'" (click)="activeView = 'translate'">Translate</button>
          </nav>
          <div class="user-pill">{{ username }}</div>
        </header>

        <div class="panel" *ngIf="activeView === 'chat'">
          <aside class="chat-list">
            <h3>Chats</h3>
            <input type="text" placeholder="Rechercher" [(ngModel)]="chatSearch" />
            <button type="button" class="new-chat" (click)="openNewConversationPicker()">+ Nouvelle conversation</button>
            <div class="user-picker" *ngIf="showUserPicker">
              <p>Selectionne un utilisateur :</p>
              <ul>
                <li *ngFor="let user of filteredAvailableUsers()" (click)="selectUserForConversation(user)">
                  <strong>{{ user.username }}</strong>
                  <span>{{ user.role }} · {{ user.status }}</span>
                </li>
              </ul>
              <button type="button" class="cancel-picker" (click)="showUserPicker = false">Annuler</button>
            </div>
            <ul>
              <li *ngFor="let item of filteredChatContacts()" [class.active]="item.active" (click)="selectContact(item.name)">
                <div class="avatar">{{ item.name[0] }}</div>
                <div>
                  <strong>{{ item.name }} <span class="role-chip" *ngIf="item.role">{{ item.role }}</span></strong>
                  <p>{{ item.preview }}</p>
                </div>
              </li>
            </ul>
            <p class="empty-list" *ngIf="connectedRole === 'TEACHER' && filteredChatContacts().length === 0">
              Aucun etudiant inscrit
            </p>
          </aside>

          <article class="chat-window">
            <header>
              <strong>{{ selectedContactName() }}</strong>
              <span>{{ selectedContactStatus() }}</span>
            </header>
            <div class="messages" id="chat-messages-container">
              <div class="bubble" *ngFor="let message of messages" [class.sent]="message.sender === 'me'" [class.received]="message.sender === 'other'">
                {{ message.text }}
                <button
                  *ngIf="connectedRole === 'ADMIN' && message.id"
                  type="button"
                  class="delete-message"
                  (click)="deleteMessageAsAdmin(message.id!)"
                >
                  Supprimer
                </button>
              </div>
              <p class="empty-thread" *ngIf="messages.length === 0">Aucun message</p>
            </div>
            <footer>
              <input type="text" placeholder="Ecris un message..." [(ngModel)]="draftMessage" (keydown.enter)="sendMessage()" [disabled]="connectedRole === 'ADMIN'" />
              <button type="button" (click)="sendMessage()" [disabled]="isSendingMessage || !canSendMessage()">Envoyer</button>
            </footer>
            <p class="error-text" *ngIf="chatError">{{ chatError }}</p>
          </article>
        </div>

        <div class="panel assistant-panel" *ngIf="activeView === 'assistant'">
          <aside class="history">
            <button type="button" class="new-chat" (click)="newAssistantConversation()">Nouvelle conversation</button>
            <ul>
              <li
                *ngFor="let conversation of displayedAssistantHistory(); let i = index"
                [class.active]="conversation.id === selectedAssistantHistoryId"
                (click)="openAssistantHistory(conversation, i)"
              >
                <div class="history-open">
                  <div class="history-title">{{ conversation.title }}</div>
                  <div class="history-date">{{ conversation.updatedAt | date:'dd/MM/yyyy HH:mm:ss' }}</div>
                </div>
                <button type="button" class="delete-link" (click)="$event.stopPropagation(); deleteAssistantConversation(i)">Supprimer</button>
              </li>
            </ul>
            <button type="button" class="clear-all" (click)="clearAssistantHistory()">Supprimer tout l'historique</button>
          </aside>
          <article class="assistant-window">
            <header>Ask grammar, vocabulary, and image-based questions.</header>
            <p class="active-conversation" *ngIf="activeConversationTitle">
              Conversation active: <strong>{{ activeConversationTitle }}</strong>
            </p>
            <p class="assistant-user" *ngIf="assistantPrompt">{{ assistantPrompt }}</p>
            <div class="assistant-answer">
              <p class="assistant-reply" *ngIf="assistantReply">{{ assistantReply }}</p>
              <p *ngIf="!assistantReply">Pose une question et clique sur Envoyer.</p>
            </div>
            <footer class="assistant-footer">
              <input type="text" placeholder="Ecris ta question..." [(ngModel)]="assistantPrompt" (keydown.enter)="askAssistant()" />
              <button type="button" class="translate-btn" (click)="askAssistant()" [disabled]="assistantLoading">
                {{ assistantLoading ? 'Envoi...' : 'Envoyer' }}
              </button>
            </footer>
            <p class="error-text" *ngIf="assistantError">{{ assistantError }}</p>
          </article>
        </div>

        <div class="panel translate-panel" *ngIf="activeView === 'translate'">
        <article class="translate-form">
          <h3>Translate</h3>
          <textarea rows="6" placeholder="Enter your text here..." [(ngModel)]="inputText"></textarea>
          <div class="translate-actions">
            <select [(ngModel)]="sourceLanguage">
              <option>English</option>
              <option>French</option>
              <option>Arabic</option>
              <option>Portuguese</option>
            </select>
            <span class="arrow">↔</span>
            <select [(ngModel)]="targetLanguage">
              <option>French</option>
              <option>English</option>
              <option>Arabic</option>
              <option>Portuguese</option>
            </select>
          </div>
          <button type="button" class="translate-btn" (click)="translateText()">Translate</button>
          <div class="result">{{ translatedText || 'Your translated text will appear here.' }}</div>
          <p class="info-text" *ngIf="translateError">{{ translateError }}</p>
        </article>
          <aside class="translate-history">
            <h4>History</h4>
            <ul>
              <li *ngFor="let entry of translateHistory">
                <strong>{{ entry.lang }}</strong>
                <p>{{ entry.original }}</p>
                <span>{{ entry.translated }}</span>
              </li>
            </ul>
          </aside>
        </div>
      </div>

      <button type="button" class="floating-bot">🤖</button>
    </section>
  `,
  styles: [`
    .messaging-page {
      position: relative;
      display: grid;
      gap: 14px;
    }
    .messaging-shell {
      border: 1px solid #e2e5f5;
      border-radius: 10px;
      background: #fff;
      overflow: hidden;
    }
    .smartlingua-header {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid #eceef8;
      padding: 10px 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #1d2654;
    }
    .logo {
      color: #7a6cf3;
      font-weight: 700;
    }
    .smartlingua-header nav {
      display: flex;
      gap: 14px;
      align-items: center;
      justify-content: center;
    }
    .smartlingua-header nav button {
      border: none;
      background: transparent;
      color: #6a7192;
      padding: 6px 10px;
      border-radius: 8px;
      cursor: pointer;
    }
    .smartlingua-header nav button.active {
      color: #5543d1;
      background: #efeaff;
      font-weight: 600;
    }
    .user-pill {
      background: #f5f3ff;
      color: #3a4070;
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 600;
    }
    .module-header h2 {
      margin: 0;
      color: #222a55;
    }
    .module-header p {
      margin: 4px 0 0;
      color: #687198;
    }
    .tabs {
      display: flex;
      gap: 8px;
    }
    .tabs button {
      border: 1px solid #d9def8;
      background: #fff;
      border-radius: 10px;
      padding: 8px 14px;
      color: #445080;
      cursor: pointer;
      font-weight: 600;
    }
    .tabs button.active {
      background: #efeaff;
      border-color: #8c7af5;
      color: #5d4ad6;
    }
    .panel {
      background: #fff;
      border: 1px solid #e6ebff;
      border-radius: 0;
      padding: 0;
      min-height: 620px;
    }
    .panel,
    .assistant-panel,
    .translate-panel {
      display: grid;
      gap: 12px;
    }
    .panel {
      grid-template-columns: 280px 1fr;
    }
    .chat-list {
      border-right: 1px solid #edf0ff;
      padding: 14px;
    }
    .chat-list input,
    .chat-window footer input,
    textarea,
    select {
      width: 100%;
      border: 1px solid #dce3ff;
      border-radius: 10px;
      padding: 10px;
      font: inherit;
    }
    .new-chat,
    .chat-window footer button,
    .translate-btn {
      margin-top: 8px;
      border: none;
      border-radius: 10px;
      background: #7b66f4;
      color: #fff;
      padding: 10px 12px;
      font-weight: 700;
      cursor: pointer;
    }
    .user-picker {
      border: 1px solid #e4e8fb;
      border-radius: 10px;
      background: #f9faff;
      padding: 10px;
      margin-top: 10px;
    }
    .user-picker p {
      margin: 0 0 8px;
      font-size: 12px;
      color: #58618b;
      font-weight: 600;
    }
    .user-picker ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 6px;
      max-height: 160px;
      overflow: auto;
    }
    .user-picker li {
      border: 1px solid #e5e9fd;
      border-radius: 8px;
      background: #fff;
      padding: 8px 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .user-picker li:hover {
      border-color: #c9d2ff;
      background: #f5f7ff;
    }
    .user-picker span {
      color: #6f789e;
      font-size: 12px;
    }
    .cancel-picker {
      margin-top: 8px;
      width: 100%;
      border: none;
      border-radius: 8px;
      background: #eceffd;
      color: #485189;
      font-weight: 600;
      padding: 8px 10px;
      cursor: pointer;
    }
    .chat-list ul,
    .translate-history ul,
    .history ul {
      list-style: none;
      margin: 10px 0 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }
    .chat-list li {
      display: flex;
      gap: 10px;
      align-items: center;
      border: 1px solid #ecefff;
      border-radius: 10px;
      padding: 8px;
    }
    .chat-list li.active {
      background: #f1eeff;
      border-color: #cabfff;
    }
    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #7060ea;
      color: #fff;
      display: grid;
      place-items: center;
      font-weight: 700;
    }
    .chat-list p {
      margin: 2px 0 0;
      color: #7a84aa;
      font-size: 12px;
    }
    .role-chip {
      display: inline-block;
      margin-left: 6px;
      padding: 1px 6px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      background: #efeaff;
      color: #5d4ad6;
      vertical-align: middle;
    }
    .empty-list {
      margin: 10px 0 0;
      color: #7a84aa;
      font-size: 13px;
      font-weight: 600;
    }
    .chat-window {
      display: grid;
      grid-template-rows: auto 1fr auto;
      padding: 14px;
    }
    .chat-window header {
      border-bottom: 1px solid #edf0ff;
      padding-bottom: 10px;
    }
    .chat-window header span {
      display: block;
      color: #8a94ba;
      font-size: 12px;
    }
    .messages {
      padding: 12px 0;
      display: grid;
      gap: 8px;
      align-content: start;
      justify-items: end;
    }
    .empty-thread {
      justify-self: start;
      color: #7a84aa;
      font-size: 13px;
      margin: 0;
    }
    .bubble {
      border-radius: 14px;
      padding: 8px 12px;
      max-width: 60%;
      position: relative;
    }
    .bubble.sent {
      background: #6f5ee8;
      color: #fff;
    }
    .chat-window footer {
      display: flex;
      gap: 10px;
    }
    .chat-window footer button {
      margin-top: 0;
      white-space: nowrap;
    }
    .delete-message {
      margin-left: 8px;
      border: 1px solid #d66d5f;
      color: #d66d5f;
      background: #fff;
      border-radius: 8px;
      padding: 2px 8px;
      font-size: 11px;
      cursor: pointer;
    }
    .assistant-panel,
    .translate-panel {
      grid-template-columns: 260px 1fr;
    }
    .history,
    .translate-history {
      border-right: 1px solid #edf0ff;
      padding: 14px;
    }
    .history li {
      border-bottom: 1px solid #f0f2fb;
      padding: 8px 0;
      position: relative;
    }
    .history li.active {
      background: #f5f2ff;
      border-radius: 8px;
      padding-left: 8px;
    }
    .history-open {
      display: block;
      width: calc(100% - 84px);
      text-align: left;
      padding: 0;
      pointer-events: none;
    }
    .history-title {
      font-weight: 600;
      color: #1f2854;
    }
    .history-date {
      font-size: 11px;
      color: #9198b6;
      margin-top: 2px;
    }
    .delete-link {
      position: absolute;
      right: 0;
      top: 10px;
      z-index: 2;
      border: none;
      background: transparent;
      color: #b98080;
      font-size: 12px;
      cursor: pointer;
    }
    .clear-all {
      margin-top: 10px;
      width: 100%;
      border: 1px solid #dedff2;
      border-radius: 8px;
      background: #fff;
      color: #5f6584;
      padding: 8px;
      cursor: pointer;
    }
    .assistant-window {
      display: grid;
      grid-template-rows: auto auto 1fr auto auto;
    }
    .assistant-window > header {
      border-bottom: 1px solid #eceef8;
      color: #727997;
      padding: 12px 14px;
      font-size: 14px;
    }
    .assistant-answer {
      background: #fbfbff;
      border: 1px solid #ecefff;
      border-radius: 12px;
      padding: 14px;
      color: #3f4a75;
      max-width: 760px;
      margin: 0 14px 14px;
      line-height: 1.55;
    }
    .assistant-reply {
      white-space: pre-line;
    }
    .active-conversation {
      margin: 8px 14px 0;
      color: #4a578a;
      font-size: 13px;
    }
    .assistant-user {
      justify-self: end;
      background: #f1eeff;
      border-radius: 10px;
      padding: 8px 12px;
      color: #5f4ed9;
      font-weight: 600;
      margin: 14px;
    }
    .assistant-footer {
      display: flex;
      gap: 10px;
      padding: 0 14px 14px;
      align-items: center;
    }
    .assistant-footer input {
      width: 100%;
      border: 1px solid #dce3ff;
      border-radius: 10px;
      padding: 10px;
      font: inherit;
      min-height: 44px;
      max-height: 44px;
      box-sizing: border-box;
    }
    .assistant-footer .translate-btn {
      margin-top: 0;
      white-space: nowrap;
      min-height: 44px;
      max-height: 44px;
      padding: 0 16px;
      align-self: center;
    }
    .error-text {
      margin: 0 14px 14px;
      color: #b64646;
      font-size: 13px;
    }
    .info-text {
      margin: 0 14px 14px;
      color: #6f7898;
      font-size: 13px;
    }
    .translate-panel {
      grid-template-columns: 1fr 280px;
    }
    .translate-actions {
      margin-top: 8px;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 8px;
      align-items: center;
    }
    .arrow {
      color: #6b59e3;
      font-size: 20px;
      font-weight: 700;
    }
    .result {
      margin-top: 10px;
      border: 1px solid #ecefff;
      border-radius: 10px;
      padding: 12px;
      color: #7a84aa;
      background: #fafbff;
    }
    .translate-history li {
      border: 1px solid #ecefff;
      border-radius: 10px;
      padding: 10px;
    }
    .translate-history li p {
      margin: 6px 0 2px;
    }
    .translate-history li span {
      color: #6f5ee8;
    }
    .floating-bot {
      position: fixed;
      right: 28px;
      bottom: 24px;
      width: 54px;
      height: 54px;
      border-radius: 50%;
      border: none;
      background: radial-gradient(circle at 30% 30%, #8b7bfa, #5f4dd8);
      color: #fff;
      font-size: 22px;
      cursor: pointer;
      box-shadow: 0 8px 22px rgba(74, 61, 165, 0.35);
    }
    @media (max-width: 1180px) {
      .panel,
      .assistant-panel,
      .translate-panel {
        grid-template-columns: 1fr;
      }
      .chat-list,
      .history,
      .translate-history {
        border-right: none;
        border-bottom: 1px solid #edf0ff;
        padding-right: 0;
        padding-bottom: 12px;
      }
      .chat-window footer {
        flex-direction: column;
      }
    }
  `]
})
export class MessagingPageComponent implements OnInit {
  private loggedUserId = 1;
  private selectedConversationId: number | null = null;

  constructor(
    private readonly messagingApi: MessagingApiService,
    private readonly userSyncService: UserSyncService,
    private readonly keycloakService: KeycloakService,
    private readonly authService: AuthService
  ) {}

  activeView: MessagingView = 'chat';
  readonly chatStorageKey = 'smartlingua.messaging.chat';
  readonly assistantHistoryStorageKey = 'smartlingua.messaging.assistant-history';
  readonly translateHistoryStorageKey = 'smartlingua.messaging.translate-history';

  username = '';
  chatSearch = '';
  draftMessage = '';
  chatError = '';
  isSendingMessage = false;
  assistantPrompt = '';
  assistantReply = '';
  activeConversationTitle = '';
  assistantLoading = false;
  assistantError = '';
  sourceLanguage = 'English';
  targetLanguage = 'French';
  inputText = '';
  translatedText = '';
  translateLoading = false;
  translateError = '';
  connectedRole: AppRole = 'STUDENT';

  showUserPicker = false;

  chatContacts: ChatContact[] = [];
  availableUsers: ChatUser[] = [];

  assistantConversations: Array<{ id: number; title: string; updatedAt: string; lastMessagePreview: string | null }> = [];
  localAssistantHistory: Array<{ id: number; title: string; updatedAt: string; prompt: string; reply: string }> = [];
  selectedAssistantHistoryId: number | null = null;
  selectedAssistantConversationId: number | null = null;

  messages: ChatBubble[] = [];

  translateHistory = [
    { lang: 'EN -> FR', original: 'hi how are you', translated: 'coucou comment allez vous' },
    { lang: 'EN -> AR', original: 'hi how are you', translated: 'مرحبا كيف حالك' },
    { lang: 'EN -> PT', original: 'hi how are you', translated: 'Hi! how are you' }
  ];

  ngOnInit(): void {
    this.username = this.keycloakService.getUsername() || 'Utilisateur';
    this.connectedRole = this.resolveConnectedRole();
    this.applyRoleVisibilityRules();
    this.restoreLocalChat();
    this.restoreLocalAssistantHistory();
    this.restoreTranslateHistory();
    this.loadAssistantConversations();
    this.resolveCurrentUserId();
    this.loadRoleChatDirectory();
  }

  filteredChatContacts() {
    const q = this.chatSearch.trim().toLowerCase();
    const roleFiltered = this.filterContactsByRole(this.chatContacts);
    if (!q) {
      return roleFiltered;
    }
    return roleFiltered.filter((c) => c.name.toLowerCase().includes(q));
  }

  selectContact(name: string): void {
    const selectedContact = this.chatContacts.find((c) => c.name === name);
    this.chatContacts = this.chatContacts.map((contact) => ({
      ...contact,
      active: contact.name === name
    }));
    if (selectedContact) {
      this.selectedConversationId = selectedContact.conversationId ?? selectedContact.id;
    }
    this.draftMessage = '';
    this.chatError = '';
    this.showUserPicker = false;
    this.loadActiveChatMessages();
  }

  selectedContactName(): string {
    return this.chatContacts.find((c) => c.active)?.name ?? 'Contact';
  }

  selectedContactStatus(): string {
    return this.chatContacts.find((c) => c.active)?.status ?? 'Inconnu';
  }

  canSendMessage(): boolean {
    if (this.connectedRole === 'ADMIN') {
      return false;
    }
    return !!this.draftMessage.trim() && this.activeChatContact() !== null;
  }

  sendMessage(): void {
    const text = this.draftMessage.trim();
    const selected = this.activeChatContact();
    if (!selected) {
      this.chatError = 'Selectionne une conversation avant d envoyer.';
      return;
    }
    if (!text || this.isSendingMessage) {
      return;
    }
    this.chatError = '';
    this.isSendingMessage = true;

    const sendNow = (conversationId: number) => {
      this.messagingApi
        .sendConversationMessage(conversationId, text)
        .pipe(
          finalize(() => {
            this.isSendingMessage = false;
          })
        )
        .subscribe({
          next: (response) => {
            this.messages = [...this.messages, { sender: 'me', text: response.content, timestamp: response.createdAt }];
            this.draftMessage = '';
            this.updateContactPreview(conversationId, response.content);
            this.persistLocalChat();
            this.scrollChatToBottom();
          },
          error: (err) => {
            console.error('[Messaging] send error', err);
            this.chatError = this.describeChatError(err);
          }
        });
    };

    if (this.selectedConversationId == null) {
      if (selected.peerId == null) {
        this.chatError = 'Aucun destinataire valide pour cette conversation.';
        this.isSendingMessage = false;
        return;
      }

      if (this.connectedRole === 'TEACHER') {
        this.messagingApi.sendTeacherMessageToStudent(selected.peerId, text).subscribe({
          next: (response) => {
            this.messages = [...this.messages, { sender: 'me', text: response.content, timestamp: response.createdAt }];
            this.draftMessage = '';
            this.chatContacts = this.chatContacts.map((c) =>
              c.name === selected.name ? { ...c, conversationId: response.conversationId, id: response.conversationId, preview: response.content } : c
            );
            this.selectedConversationId = response.conversationId;
            this.persistLocalChat();
            this.scrollChatToBottom();
            this.isSendingMessage = false;
          },
          error: (err) => {
            this.isSendingMessage = false;
            this.chatError = this.describeChatError(err);
          }
        });
      } else {
        this.messagingApi.createRoleConversation(selected.peerId).subscribe({
          next: (created) => {
            this.selectedConversationId = created.id;
            this.chatContacts = this.chatContacts.map((c) =>
              c.name === selected.name ? { ...c, id: created.id, conversationId: created.id } : c
            );
            sendNow(created.id);
          },
          error: (err) => {
            this.isSendingMessage = false;
            this.chatError = this.describeChatError(err);
          }
        });
      }
      return;
    }

    sendNow(this.selectedConversationId);
  }

  deleteMessageAsAdmin(messageId: number): void {
    if (this.connectedRole !== 'ADMIN') {
      return;
    }
    this.messagingApi.deleteAdminMessage(messageId).subscribe({
      next: () => {
        this.messages = this.messages.filter((m) => m.id !== messageId);
      },
      error: (err) => {
        this.chatError = this.describeChatError(err);
      }
    });
  }

  openNewConversationPicker(): void {
    this.chatError = '';
    this.showUserPicker = true;
  }

  filteredAvailableUsers(): ChatUser[] {
    const q = this.chatSearch.trim().toLowerCase();
    const users = this.availableUsers.filter((u) => u.id !== this.currentUserId());
    const roleFiltered = this.filterUsersByRole(users);
    if (!q) {
      return roleFiltered;
    }
    return roleFiltered.filter((u) => u.username.toLowerCase().includes(q));
  }

  selectUserForConversation(user: ChatUser): void {
    const existing = this.chatContacts.find((c) => c.name === user.username);
    if (existing) {
      this.selectContact(existing.name);
      this.showUserPicker = false;
      return;
    }
    this.showUserPicker = false;
  }

  newAssistantConversation(): void {
    this.assistantError = '';
    this.messagingApi.createConversation('Nouvelle conversation').subscribe({
      next: () => this.loadAssistantConversations(),
      error: () => {
        const now = new Date().toISOString();
        const localItem = {
          id: Date.now(),
          title: `Nouvelle conversation ${this.localAssistantHistory.length + 1}`,
          updatedAt: now,
          prompt: '',
          reply: ''
        };
        this.localAssistantHistory = [localItem, ...this.localAssistantHistory];
        this.selectedAssistantHistoryId = localItem.id;
        this.persistLocalAssistantHistory();
        this.assistantError = "Service IA indisponible: conversation locale creee.";
      }
    });
  }

  deleteAssistantConversation(index: number): void {
    const currentList = this.displayedAssistantHistory();
    const conversation = currentList[index];
    if (!conversation) {
      return;
    }

    if (this.assistantConversations.length === 0) {
      this.localAssistantHistory = this.localAssistantHistory.filter((item) => item.id !== conversation.id);
      if (this.selectedAssistantHistoryId === conversation.id) {
        this.selectedAssistantHistoryId = this.localAssistantHistory[0]?.id ?? null;
        this.assistantReply = this.localAssistantHistory[0]?.reply ?? '';
      }
      this.persistLocalAssistantHistory();
      return;
    }

    this.assistantError = '';
    this.messagingApi.deleteConversation(conversation.id).subscribe({
      next: () => this.loadAssistantConversations(),
      error: () => {
        this.assistantError = 'Impossible de supprimer la conversation.';
      }
    });
  }

  clearAssistantHistory(): void {
    if (this.assistantConversations.length === 0) {
      this.localAssistantHistory = [];
      this.selectedAssistantHistoryId = null;
      this.assistantReply = '';
      this.persistLocalAssistantHistory();
      return;
    }

    this.assistantError = '';
    this.messagingApi.deleteAllConversations().subscribe({
      next: () => this.loadAssistantConversations(),
      error: () => {
        this.assistantError = "Impossible de vider l'historique.";
      }
    });
  }

  askAssistant(): void {
    const prompt = this.assistantPrompt.trim();
    if (!prompt || this.assistantLoading) {
      return;
    }
    const currentPrompt = prompt;
    this.assistantLoading = true;
    this.assistantError = '';
    const conversationId = this.selectedAssistantConversationId ?? this.assistantConversations[0]?.id ?? null;
    console.info('[AI Assistant] Sending message', { endpoint: '/api/ai/chat', conversationId, message: currentPrompt });
    this.messagingApi
      .chatWithAssistant({ message: currentPrompt, conversationId })
      .pipe(
        timeout(30000),
        catchError((error: unknown) => of({ __error: error } as const)),
        finalize(() => {
          this.assistantLoading = false;
        })
      )
      .subscribe((response) => {
        if ((response as { reply?: string } | null)?.reply) {
          const ok = response as { reply: string; conversationId: number };
          if (ok.reply.startsWith('[AI_NOT_CONFIGURED]')) {
            console.warn('[AI Assistant] Backend AI not configured');
            this.assistantReply = '';
            this.assistantError = "IA non configuree cote backend: ajoute GEMINI_API_KEY dans ai-assistant-service.";
            this.assistantPrompt = '';
            return;
          }
          console.info('[AI Assistant] Response received', {
            conversationId: ok.conversationId,
            replyLength: ok.reply.length
          });
          this.assistantReply = ok.reply;
          this.assistantError = '';
          this.selectedAssistantConversationId = ok.conversationId;
          this.loadAssistantConversations();
          this.pushAssistantHistory(currentPrompt, ok.reply);
          this.assistantPrompt = '';
          return;
        }

        const failure = response as { __error?: unknown } | null;
        const rawError = failure?.__error;
        console.error('[AI Assistant] Request failed', rawError);
        const message = this.describeAssistantError(rawError);
        this.assistantError = message;
        this.assistantReply = '';
      });
  }

  private describeAssistantError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage =
        typeof error.error === 'string'
          ? error.error
          : typeof error.error?.message === 'string'
            ? error.error.message
            : '';
      if (error.status === 0) {
        return "Connexion IA impossible. Verifie que le frontend est relance avec le proxy et que le service ai-assistant-service tourne.";
      }
      if (error.status === 401 || error.status === 403) {
        return "Acces IA refuse (401/403). Verifie les entetes utilisateur/authentification.";
      }
      if (error.status === 404) {
        return "Endpoint IA introuvable. Verifie POST /api/ai/chat.";
      }
      if (error.status >= 500) {
        return backendMessage
          ? `Erreur backend IA (${error.status}): ${backendMessage}`
          : `Erreur backend IA (${error.status}).`;
      }
      return backendMessage
        ? `Erreur IA (${error.status}): ${backendMessage}`
        : `Erreur IA (${error.status}).`;
    }

    const timeoutMessage =
      typeof error === 'object' && error !== null && 'name' in error && (error as { name?: string }).name === 'TimeoutError';
    if (timeoutMessage) {
      return "L'IA met trop de temps a repondre. Reessaye dans quelques secondes.";
    }

    return "Service IA indisponible pour le moment. Reessaye.";
  }

  translateText(): void {
    const content = this.inputText.trim();
    if (!content) {
      this.translatedText = '';
      return;
    }
    this.translateLoading = true;
    this.translateError = '';
    this.messagingApi.translateWithMyMemory(content, this.sourceLanguage, this.targetLanguage).subscribe({
      next: (response) => {
        this.translatedText = response.responseData.translatedText;
        this.translateHistory = [
          {
            lang: `${this.toLanguageCode(this.sourceLanguage)} -> ${this.toLanguageCode(this.targetLanguage)}`,
            original: content,
            translated: this.translatedText
          },
          ...this.translateHistory
        ].slice(0, 8);
        this.persistTranslateHistory();
      },
      error: () => {
        this.translatedText = this.localTranslateFallback(content, this.sourceLanguage, this.targetLanguage);
        this.translateError = "Service de traduction externe indisponible. Resultat local affiche.";
        this.translateHistory = [
          {
            lang: `${this.toLanguageCode(this.sourceLanguage)} -> ${this.toLanguageCode(this.targetLanguage)}`,
            original: content,
            translated: this.translatedText
          },
          ...this.translateHistory
        ].slice(0, 8);
        this.persistTranslateHistory();
      },
      complete: () => {
        this.translateLoading = false;
      }
    });
  }

  private loadAssistantConversations(): void {
    this.messagingApi.getMyConversations().subscribe({
      next: (list) => {
        this.assistantConversations = list.map((item) => ({
          id: item.id,
          title: item.title ?? `Conversation ${item.id}`,
          updatedAt: item.updatedAt,
          lastMessagePreview: item.lastMessagePreview
        }));
        if (this.assistantConversations.length > 0) {
          if (!this.selectedAssistantConversationId) {
            this.selectedAssistantConversationId = this.assistantConversations[0].id;
            this.selectedAssistantHistoryId = this.assistantConversations[0].id;
          }
        }
      },
      error: () => {
        this.assistantConversations = [];
      }
    });
  }

  displayedAssistantHistory(): Array<{ id: number; title: string; updatedAt: string }> {
    return this.assistantConversations.length > 0 ? this.assistantConversations : this.localAssistantHistory;
  }

  openAssistantHistory(conversation: { id: number; title: string; updatedAt: string }, index: number): void {
    const selected = this.displayedAssistantHistory()[index];
    if (!selected) {
      return;
    }
    this.activeConversationTitle = selected.title;
    this.selectedAssistantHistoryId = selected.id;
    // Always update UI immediately based on clicked title.
    const selectedQuizLevel = this.extractQuizLevel(selected.title);
    this.assistantReply = selectedQuizLevel ? this.buildQuizReplyByLevel(selectedQuizLevel) : this.buildLocalAssistantReply(selected.title);
    this.assistantError = '';

    // Hard rule: for quiz history, never overwrite with backend preview.
    if (selectedQuizLevel) {
      this.selectedAssistantConversationId = null;
      this.upsertLocalHistory(selected.title, this.assistantReply);
      return;
    }

    if (this.assistantConversations.length > 0) {
      const backendItem = this.assistantConversations[index];
      this.selectedAssistantConversationId = backendItem?.id ?? null;
      const localMatch = this.findLocalHistoryByTitle(selected.title);
      if (localMatch?.reply) {
        this.assistantReply = localMatch.reply;
      }
      if (!this.selectedAssistantConversationId) {
        this.assistantReply = this.assistantReply || this.buildLocalAssistantReply(selected.title) || 'Conversation chargee.';
        this.assistantError = '';
        return;
      }

      this.assistantLoading = true;
      this.assistantError = '';
      this.messagingApi
        .getAiConversationMessages(this.selectedAssistantConversationId)
        .pipe(
          timeout(6000),
          catchError(() => of([])),
          finalize(() => {
            this.assistantLoading = false;
          })
        )
        .subscribe((messages) => {
          const assistantMessages = messages.filter((m) => {
            const sender = (m.sender || '').toUpperCase();
            return sender.includes('ASSISTANT') || sender.includes('AI') || sender.includes('BOT');
          });
          const lastAssistant = assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : null;
          const titleBasedFallback = this.buildLocalAssistantReply(selected.title);
          const titleLooksLikeQuiz = this.extractQuizLevel(selected.title) !== null;
          this.assistantReply =
            titleLooksLikeQuiz
              ? titleBasedFallback
              : localMatch?.reply || lastAssistant?.content || titleBasedFallback || backendItem?.lastMessagePreview || 'Conversation chargee.';

          if (titleLooksLikeQuiz) {
            this.upsertLocalHistory(selected.title, this.assistantReply);
          }
        });
      return;
    }
    const localItem = this.localAssistantHistory[index];
    this.assistantReply = localItem?.reply || this.buildLocalAssistantReply(localItem?.prompt || conversation.title);
  }

  private persistLocalChat(): void {
    try {
      localStorage.setItem(this.chatStorageKey, JSON.stringify(this.messages));
    } catch {
      // ignore local storage write failures in private mode
    }
  }

  private restoreLocalChat(): void {
    try {
      const raw = localStorage.getItem(this.chatStorageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Array<{ sender: 'me' | 'other'; text: string }>;
      if (Array.isArray(parsed)) {
        this.messages = parsed.filter((item) => typeof item.text === 'string' && (item.sender === 'me' || item.sender === 'other'));
      }
    } catch {
      // ignore malformed local storage content
    }
  }

  private activeChatContact(): ChatContact | null {
    return this.chatContacts.find((c) => c.active) ?? null;
  }

  private currentUserId(): number {
    return this.loggedUserId;
  }

  private resolveConnectedRole(): AppRole {
    if (this.authService.hasRole('admin')) {
      return 'ADMIN';
    }
    if (this.authService.hasRole('teacher')) {
      return 'TEACHER';
    }
    return 'STUDENT';
  }

  private filterUsersByRole(users: ChatUser[]): ChatUser[] {
    if (this.connectedRole === 'ADMIN') {
      return users;
    }
    if (this.connectedRole === 'TEACHER') {
      return users.filter((u) => u.role === 'STUDENT');
    }
    return users.filter((u) => u.role === 'TEACHER');
  }

  private filterContactsByRole(contacts: ChatContact[]): ChatContact[] {
    if (this.connectedRole === 'ADMIN') {
      return contacts;
    }
    if (this.connectedRole === 'TEACHER') {
      return contacts.filter((c) => c.role === 'STUDENT');
    }
    return contacts.filter((c) => c.role === 'TEACHER');
  }

  private applyRoleVisibilityRules(): void {
    this.availableUsers = this.filterUsersByRole(this.availableUsers);
    this.chatContacts = this.filterContactsByRole(this.chatContacts);

    if (this.chatContacts.length === 0) {
      this.messages = [];
      return;
    }

    const hasActive = this.chatContacts.some((c) => c.active);
    if (!hasActive) {
      this.chatContacts = this.chatContacts.map((c, idx) => ({ ...c, active: idx === 0 }));
    }
  }

  private resolveCurrentUserId(): void {
    const cachedId = this.userSyncService.getStoredStudentId();
    if (cachedId != null) {
      this.loggedUserId = cachedId;
      console.log('[Messaging] current user from local sync cache', this.loggedUserId);
      return;
    }

    this.userSyncService.resolveStudentId()
      .then((id) => {
        if (id != null) {
          this.loggedUserId = id;
          console.log('[Messaging] current user resolved from Keycloak sync', this.loggedUserId);
          this.loadActiveChatMessages();
          return;
        }
        console.warn('[Messaging] user sync missing, fallback userId=1');
      })
      .catch((error) => {
        console.error('[Messaging] unable to resolve current user id, fallback userId=1', error);
      });
  }

  private loadActiveChatMessages(): void {
    if (this.selectedConversationId == null) {
      this.messages = [];
      return;
    }

    this.messagingApi.getConversationMessages(this.selectedConversationId).subscribe({
      next: (rows) => {
        this.messages = rows.map((row) => ({
          id: row.id,
          sender: row.senderId === this.currentUserId() ? 'me' : 'other',
          text: row.content,
          timestamp: row.createdAt
        }));
        this.scrollChatToBottom();
      },
      error: (err) => {
        console.error('[Messaging] load conversation error', err);
        this.messages = [];
      }
    });
  }

  private updateContactPreview(contactId: number, content: string): void {
    this.chatContacts = this.chatContacts.map((c) => (c.id === contactId ? { ...c, preview: content } : c));
  }

  private loadRoleChatDirectory(): void {
    this.chatError = '';
    if (this.connectedRole === 'TEACHER') {
      forkJoin({
        students: this.messagingApi.getTeacherStudents(),
        conversations: this.messagingApi.getRoleConversations()
      }).subscribe({
        next: ({ students, conversations }) => {
          const convByStudentId = new Map<number, MessagingConversationDto>(
            conversations.map((c) => [c.studentId, c] as const)
          );

          this.chatContacts = students
            .filter((s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx)
            .map((s) => {
            const c = convByStudentId.get(s.id);
            return {
              id: c?.id ?? s.id,
              name: s.displayName || s.username,
              preview: c?.lastMessagePreview || 'Aucun message',
              active: false,
              status: 'En ligne',
              role: 'STUDENT' as const,
              conversationId: c?.id ?? null,
              peerId: s.id
            };
          });

          this.availableUsers = students.map((s) => ({
            id: s.id,
            username: s.displayName || s.username,
            status: 'En ligne',
            role: 'STUDENT' as const
          }));

          this.applyRoleVisibilityRules();
          if (this.chatContacts.length > 0) {
            const active = this.chatContacts[0];
            const relatedConversation = conversations.find((c) => c.studentId === active.peerId);
            this.selectedConversationId = relatedConversation?.id ?? null;
            this.selectContact(active.name);
          } else {
            this.selectedConversationId = null;
            this.messages = [];
          }
        },
        error: () => {
          this.chatContacts = [];
          this.availableUsers = [];
          this.messages = [];
          this.chatError = "Impossible de charger les etudiants inscrits. Verifie le backend messaging/users.";
        }
      });
      return;
    }

    this.messagingApi.getRoleConversations().subscribe({
      next: (conversations) => {
        this.chatContacts = conversations.map((c) => this.conversationToContact(c));
        this.availableUsers = this.contactsToUsers(this.chatContacts);
        this.applyRoleVisibilityRules();
        if (this.chatContacts.length > 0) {
          const active = this.chatContacts.find((c) => c.active) ?? this.chatContacts[0];
          this.selectedConversationId = active.id;
          this.selectContact(active.name);
        } else {
          this.selectedConversationId = null;
          this.messages = [];
        }
      },
      error: () => {
        this.chatContacts = [];
        this.availableUsers = [];
        this.messages = [];
        this.chatError = "Impossible de charger les conversations. Verifie le backend messaging.";
      }
    });
  }

  private conversationToContact(c: MessagingConversationDto): ChatContact {
    const isTeacher = this.connectedRole === 'TEACHER';
    const isAdmin = this.connectedRole === 'ADMIN';
    const peerName = isAdmin ? `${c.teacherName} ↔ ${c.studentName}` : (isTeacher ? c.studentName : c.teacherName);
    const peerRole: AppRole = isAdmin ? 'ADMIN' : (isTeacher ? 'STUDENT' : 'TEACHER');
    return {
      id: c.id,
      name: peerName,
      preview: c.lastMessagePreview || 'Aucun message',
      active: false,
      status: 'En ligne',
      role: peerRole,
      conversationId: c.id,
      peerId: this.connectedRole === 'TEACHER' ? c.studentId : c.teacherId
    };
  }

  private contactsToUsers(contacts: ChatContact[]): ChatUser[] {
    return contacts.map((c) => ({
      id: c.id,
      username: c.name,
      status: c.status,
      role: c.role ?? 'STUDENT'
    }));
  }

  private scrollChatToBottom(): void {
    setTimeout(() => {
      const el = document.getElementById('chat-messages-container');
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 0);
  }

  private describeChatError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Impossible de joindre le service messaging. Verifie qu il tourne sur le backend.';
      }
      return `Erreur envoi message (${error.status}).`;
    }
    return 'Erreur envoi message.';
  }

  private pushAssistantHistory(prompt: string, reply: string): void {
    const now = new Date().toISOString();
    const title = prompt.length > 45 ? `${prompt.slice(0, 45)}...` : prompt;
    const item = { id: Date.now(), title, updatedAt: now, prompt, reply };
    this.localAssistantHistory = [item, ...this.localAssistantHistory].slice(0, 30);
    this.selectedAssistantHistoryId = item.id;
    this.activeConversationTitle = item.title;
    this.persistLocalAssistantHistory();
  }

  private upsertLocalHistory(prompt: string, reply: string): void {
    const now = new Date().toISOString();
    const title = prompt.length > 45 ? `${prompt.slice(0, 45)}...` : prompt;
    const existingIndex = this.localAssistantHistory.findIndex(
      (item) => item.title.trim().toLowerCase() === title.trim().toLowerCase()
    );
    if (existingIndex >= 0) {
      const existing = this.localAssistantHistory[existingIndex];
      this.localAssistantHistory[existingIndex] = { ...existing, updatedAt: now, prompt, reply };
    } else {
      this.localAssistantHistory = [{ id: Date.now(), title, updatedAt: now, prompt, reply }, ...this.localAssistantHistory].slice(0, 30);
    }
    this.persistLocalAssistantHistory();
  }

  private isQuizPrompt(text: string): boolean {
    return this.extractQuizLevel(text) !== null;
  }

  private extractQuizLevel(text: string): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null {
    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    if (!normalized.includes('quiz') && !normalized.includes('qcm')) {
      return null;
    }
    const levelMatch = normalized.match(/\b(a1|a2|b1|b2|c1|c2)\b/i);
    return levelMatch ? (levelMatch[1].toUpperCase() as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2') : 'A1';
  }

  private buildQuizReplyByLevel(level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'): string {
    switch (level) {
      case 'A2':
        return [
          'Great! Mini A2 quiz:',
          '1) Choose the correct sentence: "Yesterday, I ___ to the market." (go / went / goes)',
          '2) Rewrite: "She can to swim."',
          '3) Complete: "If it rains, we ___ at home." (stay / stayed / will stay)'
        ].join('\n');
      case 'B1':
        return [
          'Great! Mini B1 quiz:',
          '1) Choose: "I have lived here ___ 2019." (for / since / during)',
          '2) Transform to passive: "They built the bridge in 2010."',
          '3) Complete: "By the time we arrived, the film ___." (started / had started / has started)'
        ].join('\n');
      case 'B2':
        return [
          'Excellent! Mini B2 quiz:',
          '1) Choose: "Hardly ___ the meeting started when he interrupted." (had / has / did)',
          '2) Rephrase with modal deduction: "I am sure she forgot."',
          '3) Complete: "Were I ___ more time, I would join the project." (have / to have / had)'
        ].join('\n');
      case 'C1':
      case 'C2':
        return [
          'Advanced quiz:',
          '1) Correct the register in: "The results are kind of bad."',
          '2) Complete: "No sooner ___ than the audience applauded."',
          '3) Rewrite using inversion: "You should not reveal confidential data under any circumstances."'
        ].join('\n');
      case 'A1':
      default:
        return [
          'Sure! Mini A1 quiz:',
          '1) Choose the correct sentence: "I ___ a student." (am / is / are)',
          '2) Translate to English: "Bonjour, je m\'appelle Sara."',
          '3) Complete: "She ___ from France." (is / are / am)'
        ].join('\n');
    }
  }

  private findLocalHistoryByTitle(title: string): { id: number; title: string; updatedAt: string; prompt: string; reply: string } | undefined {
    const target = title.trim().toLowerCase();
    return this.localAssistantHistory.find((item) => item.title.trim().toLowerCase() === target);
  }

  private persistLocalAssistantHistory(): void {
    try {
      localStorage.setItem(this.assistantHistoryStorageKey, JSON.stringify(this.localAssistantHistory));
    } catch {
      // ignore local storage issues
    }
  }

  private restoreLocalAssistantHistory(): void {
    try {
      const raw = localStorage.getItem(this.assistantHistoryStorageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Array<{ id: number; title: string; updatedAt: string; prompt?: string; reply?: string }>;
      if (Array.isArray(parsed)) {
        this.localAssistantHistory = parsed
          .filter(
            (item) =>
              typeof item.id === 'number' &&
              typeof item.title === 'string' &&
              typeof item.updatedAt === 'string' &&
              typeof item.prompt === 'string' &&
              typeof item.reply === 'string'
          )
          .map((item) => ({
            id: item.id,
            title: item.title,
            updatedAt: item.updatedAt,
            prompt: item.prompt as string,
            reply: item.reply as string
          }));
        if (this.localAssistantHistory.length > 0) {
          this.selectedAssistantHistoryId = this.localAssistantHistory[0].id;
        }
      }
    } catch {
      // ignore malformed local data
    }
  }

  private toLanguageCode(label: string): string {
    switch (label) {
      case 'French':
        return 'FR';
      case 'Arabic':
        return 'AR';
      case 'Portuguese':
        return 'PT';
      default:
        return 'EN';
    }
  }

  private localTranslateFallback(text: string, sourceLanguage: string, targetLanguage: string): string {
    const normalized = text.trim().toLowerCase();
    if (!normalized) {
      return '';
    }
    if (sourceLanguage === 'English' && targetLanguage === 'French') {
      const map: Record<string, string> = {
        'i want to eat': 'je veux manger',
        'i want to read': 'je veux lire',
        'i want to write': 'je veux ecrire',
        'i want to learn english': "je veux apprendre l'anglais",
        'hi how are you': 'salut, comment vas-tu ?',
        'what is your name': "comment t'appelles-tu ?"
      };
      if (map[normalized]) {
        return map[normalized];
      }
      if (normalized.startsWith('i want to ')) {
        const verb = normalized.replace('i want to ', '').trim();
        const verbMap: Record<string, string> = {
          eat: 'manger',
          read: 'lire',
          write: 'ecrire',
          learn: 'apprendre',
          speak: 'parler',
          study: 'etudier',
          travel: 'voyager',
          work: 'travailler'
        };
        const frVerb = verbMap[verb];
        if (frVerb) {
          return `je veux ${frVerb}`;
        }
      }
      return `[FR] ${text}`;
    }
    if (sourceLanguage === 'English' && targetLanguage === 'Arabic') {
      const map: Record<string, string> = {
        'i want to eat': 'اريد ان اكل',
        'i want to read': 'اريد ان اقرأ',
        'i want to write': 'اريد ان اكتب',
        'i want to learn english': 'اريد ان اتعلم الانجليزية',
        'hi how are you': 'مرحبا كيف حالك',
        'what is your name': 'ما اسمك'
      };
      if (map[normalized]) {
        return map[normalized];
      }
      if (normalized.startsWith('i want to ')) {
        const verb = normalized.replace('i want to ', '').trim();
        const verbMap: Record<string, string> = {
          eat: 'اكل',
          read: 'اقرأ',
          write: 'اكتب',
          learn: 'اتعلم',
          speak: 'اتكلم',
          study: 'ادرس',
          travel: 'اسافر',
          work: 'اعمل'
        };
        const arVerb = verbMap[verb];
        if (arVerb) {
          return `اريد ان ${arVerb}`;
        }
      }
      return `[AR] ${text}`;
    }
    if (sourceLanguage === 'English' && targetLanguage === 'Portuguese') {
      const map: Record<string, string> = {
        'i want to eat': 'eu quero comer',
        'hi how are you': 'oi, como voce esta?',
        'what is your name': 'qual e o seu nome?'
      };
      return map[normalized] ?? `[PT] ${text}`;
    }
    return `[${this.toLanguageCode(targetLanguage)}] ${text}`;
  }

  private persistTranslateHistory(): void {
    try {
      localStorage.setItem(this.translateHistoryStorageKey, JSON.stringify(this.translateHistory));
    } catch {
      // ignore local storage issues
    }
  }

  private restoreTranslateHistory(): void {
    try {
      const raw = localStorage.getItem(this.translateHistoryStorageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Array<{ lang?: string; original?: string; translated?: string }>;
      if (!Array.isArray(parsed)) {
        return;
      }
      this.translateHistory = parsed
        .filter(
          (item) =>
            typeof item.lang === 'string' &&
            typeof item.original === 'string' &&
            typeof item.translated === 'string'
        )
        .slice(0, 8)
        .map((item) => ({
          lang: item.lang as string,
          original: item.original as string,
          translated: item.translated as string
        }));
    } catch {
      // ignore malformed local data
    }
  }

  private buildLocalAssistantReply(prompt: string): string {
    const text = prompt.toLowerCase();

    if (text.includes('animal')) {
      return [
        'Great topic! Here are short animal descriptions:',
        '- A lion is a strong wild cat that lives in Africa.',
        '- A dolphin is an intelligent sea animal that can communicate with sounds.',
        '- An elephant is very large, has a trunk, and lives in Africa and Asia.'
      ].join('\n');
    }

    if (text.includes('vocabulaire') || text.includes('vocabulary')) {
      if (text.includes('cuisine') || text.includes('kitchen') || text.includes('food')) {
        return [
          'Vocabulary topic: Kitchen / Food',
          '- spoon = cuillere',
          '- fork = fourchette',
          '- knife = couteau',
          '- pan = poele',
          '- pot = casserole',
          '- oven = four',
          '- fridge = refrigerateur',
          '- recipe = recette',
          '- boil = bouillir',
          '- bake = cuire au four'
        ].join('\n');
      }
      return [
        'Sure! Here is vocabulary by topic:',
        '- travel: ticket, luggage, passport, delay, destination',
        '- work: meeting, deadline, report, schedule, salary',
        '- health: headache, fever, treatment, clinic, recovery',
        'Tip: ask "Give me 20 words about <topic> with French translation".'
      ].join('\n');
    }

    if (text.includes('grammar') || text.includes('grammaire')) {
      if (text.includes('present simple') || text.includes('present continuous')) {
        return [
          'Present Simple vs Present Continuous:',
          '- Present Simple: habits/facts -> "She works every day."',
          '- Present Continuous: action now -> "She is working now."',
          'Signal words:',
          '- Simple: always, usually, often',
          '- Continuous: now, at the moment, currently'
        ].join('\n');
      }
      return [
        'Grammar help:',
        '- Ask: "Explain since vs for with examples"',
        '- Ask: "Correct this sentence: ... "',
        '- Ask: "Give me 5 examples of past simple"'
      ].join('\n');
    }

    if (text.includes('corrige') || text.includes('correct')) {
      return [
        'I can correct your sentence.',
        'Please send it like this:',
        '"Correct this: She go to school every day."',
        'Example correction:',
        '- She goes to school every day.'
      ].join('\n');
    }

    if (text.includes('quiz') || text.includes('qcm')) {
      const level = this.extractQuizLevel(prompt) ?? 'A1';
      return this.buildQuizReplyByLevel(level);
    }

    return [
      'I can help you practice English.',
      'Try asking for:',
      '- vocabulary by topic',
      '- short grammar explanations',
      '- A1/A2 quizzes',
      '- writing corrections'
    ].join('\n');
  }
}
