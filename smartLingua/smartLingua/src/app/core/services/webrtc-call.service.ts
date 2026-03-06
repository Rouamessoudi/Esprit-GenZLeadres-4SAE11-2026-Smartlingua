import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  CallState,
  INITIAL_CALL_STATE,
} from './call-store';
import type { MessageDTO } from './messaging.service';
import { MESSAGING_API_BASE } from '../api-config';

const WS_BASE = MESSAGING_API_BASE;
const WS_ENDPOINT = '/ws-messaging';
const STUN_URL = 'stun:stun.l.google.com:19302';
const RETRY_DELAYS_MS = [1000, 2000, 5000, 10000];
const MAX_RETRY_INDEX = RETRY_DELAYS_MS.length - 1;

export type WsConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';

/** Payload reçu quand un utilisateur accepte notre invitation */
export interface InvitationAcceptedPayload {
  conversationId: number;
  acceptedByUserId: number;
  acceptedByUsername?: string;
}

/** Payload reçu quand on reçoit une nouvelle invitation (en temps réel) */
export interface NewInvitationPayload {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  invitationType: string;
  status: string;
  createdAt?: string;
}

/** Message de signalisation envoyé/reçu via WebSocket */
export interface CallSignalMessage {
  type: string;
  callId: string;
  fromUserId: number;
  toUserId: number;
  payload?: unknown;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class WebrtcCallService {
  private stompClient: Client | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localMediaStream: MediaStream | null = null;
  private currentUserId: number | null = null;
  private pendingOffer: CallSignalMessage | null = null;
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private retryIndex = 0;
  private readonly callStore = new BehaviorSubject<CallState>(INITIAL_CALL_STATE);
  private readonly connectionStatus$ = new BehaviorSubject<WsConnectionStatus>('DISCONNECTED');
  private readonly remoteStream$ = new Subject<MediaStream>();
  private readonly localStream$ = new Subject<MediaStream>();
  private readonly incomingChatMessages$ = new Subject<MessageDTO>();
  private readonly invitationAccepted$ = new Subject<InvitationAcceptedPayload>();
  private readonly newInvitation$ = new Subject<NewInvitationPayload>();
  private readonly invitationRejected$ = new Subject<{ invitationId: number; status: string; receiverId: number }>();

  readonly callState$ = this.callStore.asObservable();
  readonly connectionStatus = this.connectionStatus$.asObservable();
  readonly remoteStream = this.remoteStream$.asObservable();
  readonly localStream = this.localStream$.asObservable();
  /** Messages reçus en temps réel (expéditeur et destinataire) */
  readonly incomingChatMessages = this.incomingChatMessages$.asObservable();
  /** Notifié quand quelqu'un a accepté notre invitation (on peut démarrer la conversation) */
  readonly invitationAccepted = this.invitationAccepted$.asObservable();
  /** Notifié quand on reçoit une nouvelle invitation (récepteur) */
  readonly newInvitation = this.newInvitation$.asObservable();
  /** Notifié quand une invitation qu'on a envoyée a été refusée */
  readonly invitationRejected = this.invitationRejected$.asObservable();

  get callState(): CallState {
    return this.callStore.getValue();
  }

  get currentConnectionStatus(): WsConnectionStatus {
    return this.connectionStatus$.getValue();
  }

  /** Connexion STOMP pour la signalisation (à appeler après login avec userId). Reconnexion auto avec backoff. */
  connect(userId: number): void {
    if (this.currentUserId === userId && this.stompClient?.active) {
      this.connectionStatus$.next('CONNECTED');
      return;
    }
    this.disconnect();
    this.currentUserId = userId;
    this.tryConnect();
  }

  private tryConnect(): void {
    const userId = this.currentUserId;
    if (userId == null) return;
    this.clearRetryTimeout();
    this.connectionStatus$.next('CONNECTING');
    const url = `${WS_BASE}${WS_ENDPOINT}?userId=${userId}`;
    const sockJs = new SockJS(url);
    sockJs.onclose = () => this.onWsClose();
    const client = new Client({
      webSocketFactory: () => sockJs as unknown as WebSocket,
      onConnect: () => {
        this.retryIndex = 0;
        this.connectionStatus$.next('CONNECTED');
        this.subscribeToCallQueue(client);
        this.subscribeToMessagesQueue(client);
        this.subscribeToInvitationAcceptedQueue(client);
        this.subscribeToNewInvitationQueue(client);
        this.subscribeToInvitationRejectedQueue(client);
      },
      onStompError: (frame) => {
        console.error('[WebRTC] STOMP error', frame);
        this.connectionStatus$.next('DISCONNECTED');
        this.scheduleRetry();
      },
    });
    client.activate();
    this.stompClient = client;
  }

  private onWsClose(): void {
    this.connectionStatus$.next('DISCONNECTED');
    this.stompClient = null;
    if (this.currentUserId != null) this.scheduleRetry();
  }

  private scheduleRetry(): void {
    this.clearRetryTimeout();
    if (this.currentUserId == null) return;
    const delay = RETRY_DELAYS_MS[Math.min(this.retryIndex, MAX_RETRY_INDEX)];
    if (this.retryIndex <= MAX_RETRY_INDEX) this.retryIndex++;
    this.retryTimeoutId = setTimeout(() => {
      this.retryTimeoutId = null;
      this.tryConnect();
    }, delay);
  }

  private clearRetryTimeout(): void {
    if (this.retryTimeoutId != null) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }

  disconnect(): void {
    this.clearRetryTimeout();
    this.retryIndex = 0;
    this.endCall(this.callStore.getValue().callId);
    if (this.stompClient) {
      try {
        this.stompClient.deactivate();
      } catch {}
      this.stompClient = null;
    }
    this.currentUserId = null;
    this.pendingOffer = null;
    this.connectionStatus$.next('DISCONNECTED');
    this.callStore.next(INITIAL_CALL_STATE);
  }

  private subscribeToCallQueue(client: Client): void {
    client.subscribe('/user/queue/call', (message) => {
      try {
        const body = JSON.parse(message.body) as CallSignalMessage;
        this.handleIncomingSignal(body);
      } catch (e) {
        console.error('[WebRTC] Parse signal error', e);
      }
    });
  }

  private subscribeToMessagesQueue(client: Client): void {
    const userId = this.currentUserId;
    if (userId == null) return;
    client.subscribe('/queue/messages/' + userId, (message) => {
      try {
        const raw = JSON.parse(message.body) as Record<string, unknown>;
        const ts = raw['timestamp'];
        const timestampStr =
          typeof ts === 'string'
            ? ts
            : Array.isArray(ts)
              ? new Date((ts as number[])[0], (ts as number[])[1] - 1, (ts as number[])[2], (ts as number[])[3], (ts as number[])[4], (ts as number[])[5]).toISOString()
              : new Date().toISOString();
        const msg: MessageDTO = {
          id: Number(raw['id']),
          senderId: Number(raw['senderId']),
          receiverId: Number(raw['receiverId']),
          content: String(raw['content'] ?? ''),
          timestamp: timestampStr,
          isRead: Boolean(raw['isRead']),
          conversationId: raw['conversationId'] != null ? Number(raw['conversationId']) : undefined,
        };
        this.incomingChatMessages$.next(msg);
      } catch (e) {
        console.error('[Chat] Parse message error', e);
      }
    });
  }

  private subscribeToInvitationAcceptedQueue(client: Client): void {
    const userId = this.currentUserId;
    if (userId == null) return;
    client.subscribe('/queue/invitation-accepted/' + userId, (message) => {
      try {
        const raw = JSON.parse(message.body) as Record<string, unknown>;
        const payload: InvitationAcceptedPayload = {
          conversationId: Number(raw['conversationId']),
          acceptedByUserId: Number(raw['acceptedByUserId']),
          acceptedByUsername: raw['acceptedByUsername'] != null ? String(raw['acceptedByUsername']) : undefined,
        };
        this.invitationAccepted$.next(payload);
      } catch (e) {
        console.error('[Chat] Parse invitation-accepted error', e);
      }
    });
  }

  private subscribeToNewInvitationQueue(client: Client): void {
    const userId = this.currentUserId;
    if (userId == null) return;
    client.subscribe('/queue/invitations/' + userId, (message) => {
      try {
        const raw = JSON.parse(message.body) as Record<string, unknown>;
        const payload: NewInvitationPayload = {
          id: Number(raw['id']),
          senderId: Number(raw['senderId']),
          receiverId: Number(raw['receiverId']),
          message: String(raw['message'] ?? ''),
          invitationType: String(raw['invitationType'] ?? 'DISCUSSION'),
          status: String(raw['status'] ?? 'PENDING'),
          createdAt: raw['createdAt'] != null ? String(raw['createdAt']) : undefined,
        };
        this.newInvitation$.next(payload);
      } catch (e) {
        console.error('[Chat] Parse new invitation error', e);
      }
    });
  }

  private subscribeToInvitationRejectedQueue(client: Client): void {
    const userId = this.currentUserId;
    if (userId == null) return;
    client.subscribe('/queue/invitation-rejected/' + userId, (message) => {
      try {
        const raw = JSON.parse(message.body) as Record<string, unknown>;
        this.invitationRejected$.next({
          invitationId: Number(raw['invitationId']),
          status: String(raw['status'] ?? 'REJECTED'),
          receiverId: Number(raw['receiverId']),
        });
      } catch (e) {
        console.error('[Chat] Parse invitation-rejected error', e);
      }
    });
  }

  private sendSignal(msg: CallSignalMessage): void {
    if (!this.stompClient?.active) {
      console.warn('[WebRTC] STOMP not connected, cannot send signal');
      return;
    }
    this.stompClient.publish({
      destination: '/app/call.signal',
      body: JSON.stringify(msg),
    });
  }

  private handleIncomingSignal(msg: CallSignalMessage): void {
    const state = this.callStore.getValue();
    switch (msg.type) {
      case 'CALL_INVITE':
        if (state.status !== 'idle' && state.status !== 'ended') return;
        this.callStore.next({
          ...INITIAL_CALL_STATE,
          status: 'ringing',
          callId: msg.callId,
          remoteUserId: msg.fromUserId,
          remoteUsername: (msg.payload as { username?: string })?.username ?? null,
          outgoing: false,
          videoEnabled: (msg.payload as { video?: boolean })?.video ?? true,
        });
        break;
      case 'CALL_ACCEPT':
        if (state.callId !== msg.callId) return;
        this.callStore.next({ ...state, status: 'inCall' });
        break;
      case 'CALL_REJECT':
        this.callStore.next({
          ...INITIAL_CALL_STATE,
          status: 'ended',
          endReason: (msg.payload as { reason?: string })?.reason ?? 'REJECTED',
        });
        this.cleanupPeerConnection();
        break;
      case 'CALL_END':
        this.callStore.next({
          ...INITIAL_CALL_STATE,
          status: 'ended',
          endReason: 'HANG_UP',
        });
        this.cleanupPeerConnection();
        break;
      case 'RTC_OFFER':
        this.handleRemoteOffer(msg).catch((e) => console.error('[WebRTC] handleRemoteOffer', e));
        break;
      case 'RTC_ANSWER':
        this.handleRemoteAnswer(msg).catch((e) => console.error('[WebRTC] handleRemoteAnswer', e));
        break;
      case 'RTC_ICE':
        this.handleIceCandidate(msg).catch((e) => console.error('[WebRTC] handleIceCandidate', e));
        break;
      default:
        break;
    }
  }

  /** Démarrer un appel (audio ou vidéo) */
  startCall(toUserId: number, video = true, fromUsername?: string): void {
    const state = this.callStore.getValue();
    if (state.status !== 'idle' && state.status !== 'ended') return;
    if (this.currentUserId == null) return;
    const callId = this.uuid();
    this.callStore.next({
      ...INITIAL_CALL_STATE,
      status: 'calling',
      callId,
      remoteUserId: toUserId,
      remoteUsername: null,
      outgoing: true,
      videoEnabled: video,
    });
    this.sendSignal({
      type: 'CALL_INVITE',
      callId,
      fromUserId: this.currentUserId,
      toUserId,
      payload: { video, username: fromUsername },
      timestamp: Date.now(),
    });
    this.initPeerConnection(callId, toUserId, true, video);
  }

  /** Accepter un appel entrant */
  acceptCall(callId: string): void {
    const state = this.callStore.getValue();
    if (state.status !== 'ringing' || state.callId !== callId || state.remoteUserId == null || this.currentUserId == null) return;
    this.initPeerConnection(callId, state.remoteUserId, false, state.videoEnabled).then(() => {
      this.sendSignal({
        type: 'CALL_ACCEPT',
        callId,
        fromUserId: this.currentUserId!,
        toUserId: state.remoteUserId!,
        timestamp: Date.now(),
      });
      this.callStore.next({ ...state, status: 'inCall' });
      if (this.pendingOffer) {
        const msg = this.pendingOffer;
        this.pendingOffer = null;
        this.handleRemoteOffer(msg);
      }
    });
  }

  /** Refuser un appel entrant (ou annuler sortant) */
  rejectCall(callId: string, reason?: string): void {
    const state = this.callStore.getValue();
    const toUserId = state.outgoing ? state.remoteUserId : state.remoteUserId;
    if (toUserId != null && this.currentUserId != null) {
      this.sendSignal({
        type: 'CALL_REJECT',
        callId,
        fromUserId: this.currentUserId,
        toUserId,
        payload: reason ? { reason } : {},
        timestamp: Date.now(),
      });
    }
    this.callStore.next({ ...INITIAL_CALL_STATE, status: 'ended', endReason: reason ?? 'REJECTED' });
    this.cleanupPeerConnection();
  }

  /** Raccrocher */
  endCall(callId: string | null): void {
    const state = this.callStore.getValue();
    const id = callId ?? state.callId;
    if (id && state.remoteUserId != null && this.currentUserId != null) {
      this.sendSignal({
        type: 'CALL_END',
        callId: id,
        fromUserId: this.currentUserId,
        toUserId: state.remoteUserId,
        timestamp: Date.now(),
      });
    }
    this.callStore.next(INITIAL_CALL_STATE);
    this.cleanupPeerConnection();
  }

  toggleMic(): void {
    const state = this.callStore.getValue();
    const newMuted = !state.micMuted;
    this.localMediaStream?.getAudioTracks().forEach((t) => (t.enabled = !newMuted));
    this.callStore.next({ ...state, micMuted: newMuted });
  }

  toggleCamera(): void {
    const state = this.callStore.getValue();
    const newOff = !state.cameraOff;
    this.localMediaStream?.getVideoTracks().forEach((t) => (t.enabled = !newOff));
    this.callStore.next({ ...state, cameraOff: newOff });
  }

  /** Réinitialiser l'état après fermeture du modal "ended" */
  resetToIdle(): void {
    this.callStore.next(INITIAL_CALL_STATE);
  }

  private uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private async initPeerConnection(callId: string, remoteUserId: number, isOfferer: boolean, video: boolean): Promise<void> {
    this.cleanupPeerConnection();
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: STUN_URL }],
    });
    this.peerConnection = pc;

    try {
    this.localMediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video ? { facingMode: 'user' } : false,
    });
    this.localStream$.next(this.localMediaStream);
    } catch (e) {
      console.error('[WebRTC] getUserMedia failed', e);
      this.rejectCall(callId, 'MEDIA_DENIED');
      return;
    }

    this.localMediaStream.getTracks().forEach((track) => pc.addTrack(track, this.localMediaStream!));

    pc.ontrack = (ev) => {
      const stream = ev.streams[0];
      if (stream) this.remoteStream$.next(stream);
    };
    pc.onicecandidate = (ev) => {
      if (ev.candidate && this.currentUserId != null)
        this.sendSignal({
          type: 'RTC_ICE',
          callId,
          fromUserId: this.currentUserId,
          toUserId: remoteUserId,
          payload: ev.candidate.toJSON(),
          timestamp: Date.now(),
        });
    };

    if (isOfferer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (this.currentUserId != null)
        this.sendSignal({
          type: 'RTC_OFFER',
          callId,
          fromUserId: this.currentUserId,
          toUserId: remoteUserId,
          payload: offer,
          timestamp: Date.now(),
        });
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localMediaStream;
  }

  private async handleRemoteOffer(msg: CallSignalMessage): Promise<void> {
    const state = this.callStore.getValue();
    if (state.status === 'ringing') {
      this.pendingOffer = msg;
      return;
    }
    const offer = msg.payload as RTCSessionDescriptionInit;
    if (!this.peerConnection || !offer) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    if (this.currentUserId != null)
      this.sendSignal({
        type: 'RTC_ANSWER',
        callId: msg.callId,
        fromUserId: this.currentUserId,
        toUserId: msg.fromUserId,
        payload: answer,
        timestamp: Date.now(),
      });
  }

  private async handleRemoteAnswer(msg: CallSignalMessage): Promise<void> {
    const answer = msg.payload as RTCSessionDescriptionInit;
    if (!this.peerConnection || !answer) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  private async handleIceCandidate(msg: CallSignalMessage): Promise<void> {
    const candidate = msg.payload as RTCIceCandidateInit;
    if (!this.peerConnection || !candidate) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error('[WebRTC] addIceCandidate error', e);
    }
  }

  private async createAnswer(callId: string, remoteUserId: number): Promise<void> {
    if (!this.peerConnection || this.currentUserId == null) return;
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    this.sendSignal({
      type: 'RTC_ANSWER',
      callId,
      fromUserId: this.currentUserId,
      toUserId: remoteUserId,
      payload: answer,
      timestamp: Date.now(),
    });
  }

  private cleanupPeerConnection(): void {
    this.localMediaStream?.getTracks().forEach((t) => t.stop());
    this.localMediaStream = null;
    this.peerConnection?.close();
    this.peerConnection = null;
  }
}
