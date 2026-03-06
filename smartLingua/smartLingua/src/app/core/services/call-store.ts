/**
 * État global d'un appel WebRTC (1-to-1).
 * Un seul appel actif à la fois.
 */
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'inCall' | 'ended';

export interface CallState {
  status: CallStatus;
  callId: string | null;
  /** Utilisateur distant (celui qu'on appelle ou qui nous appelle) */
  remoteUserId: number | null;
  remoteUsername: string | null;
  /** true = appel sortant, false = entrant */
  outgoing: boolean;
  /** Appel avec vidéo (caméra) ou audio seul */
  videoEnabled: boolean;
  /** Micro coupé par l'utilisateur local */
  micMuted: boolean;
  /** Caméra coupée par l'utilisateur local */
  cameraOff: boolean;
  /** Raison de fin (ex: OFFLINE, REJECTED) */
  endReason: string | null;
}

export const INITIAL_CALL_STATE: CallState = {
  status: 'idle',
  callId: null,
  remoteUserId: null,
  remoteUsername: null,
  outgoing: false,
  videoEnabled: true,
  micMuted: false,
  cameraOff: false,
  endReason: null,
};
