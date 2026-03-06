import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebrtcCallService } from '../../../core/services/webrtc-call.service';
import { CallState } from '../../../core/services/call-store';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-call-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './call-modal.component.html',
  styleUrl: './call-modal.component.scss',
})
export class CallModalComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;

  state: CallState | null = null;
  callDurationSeconds = 0;
  private callStateSub?: Subscription;
  private remoteStreamSub?: Subscription;
  private durationInterval?: ReturnType<typeof setInterval>;

  constructor(public webrtc: WebrtcCallService) {}

  ngOnInit(): void {
    this.callStateSub = this.webrtc.callState$.subscribe((s) => {
      this.state = s;
      if (s.status === 'inCall' && !this.durationInterval) {
        this.callDurationSeconds = 0;
        this.durationInterval = setInterval(() => this.callDurationSeconds++, 1000);
      } else if (s.status !== 'inCall') {
        if (this.durationInterval) {
          clearInterval(this.durationInterval);
          this.durationInterval = undefined;
        }
      }
    });
    this.remoteStreamSub = this.webrtc.remoteStream.subscribe((stream) => {
      if (this.remoteVideoRef?.nativeElement) {
        this.remoteVideoRef.nativeElement.srcObject = stream;
      }
    });
    this.webrtc.localStream.subscribe((stream) => {
      if (this.localVideoRef?.nativeElement) {
        this.localVideoRef.nativeElement.srcObject = stream;
      }
    });
  }

  ngAfterViewInit(): void {
    this.attachLocalStream();
  }

  ngOnDestroy(): void {
    this.callStateSub?.unsubscribe();
    this.remoteStreamSub?.unsubscribe();
    if (this.durationInterval) clearInterval(this.durationInterval);
  }

  private attachLocalStream(): void {
    const stream = this.webrtc.getLocalStream();
    if (this.localVideoRef?.nativeElement && stream) {
      this.localVideoRef.nativeElement.srcObject = stream;
    }
  }

  get statusLabel(): string {
    if (!this.state) return '';
    switch (this.state.status) {
      case 'calling': return 'Appel en cours…';
      case 'ringing': return this.state.outgoing ? 'Appel en cours…' : 'Appel entrant…';
      case 'inCall': return 'En communication';
      case 'ended': return this.endedLabel;
      default: return '';
    }
  }

  get endedLabel(): string {
    const reason = this.state?.endReason;
    if (reason === 'OFFLINE') return 'Utilisateur hors ligne';
    if (reason === 'REJECTED') return 'Appel refusé';
    if (reason === 'HANG_UP') return 'Appel terminé';
    if (reason === 'MEDIA_DENIED') return 'Accès micro/caméra refusé';
    return 'Appel terminé';
  }

  get showModal(): boolean {
    if (!this.state) return false;
    return this.state.status !== 'idle';
  }

  get isRingingIncoming(): boolean {
    return this.state?.status === 'ringing' && !this.state.outgoing;
  }

  get isInCall(): boolean {
    return this.state?.status === 'inCall';
  }

  get canShowVideos(): boolean {
    return this.state?.status === 'inCall' || this.state?.status === 'ringing' || this.state?.status === 'calling';
  }

  accept(): void {
    if (this.state?.callId) this.webrtc.acceptCall(this.state.callId);
    setTimeout(() => this.attachLocalStream(), 500);
  }

  reject(): void {
    if (this.state?.callId) this.webrtc.rejectCall(this.state.callId);
  }

  hangUp(): void {
    this.webrtc.endCall(this.state?.callId ?? null);
  }

  toggleMic(): void {
    this.webrtc.toggleMic();
  }

  toggleCamera(): void {
    this.webrtc.toggleCamera();
  }

  closeEnded(): void {
    this.webrtc.resetToIdle();
  }

  formatDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
