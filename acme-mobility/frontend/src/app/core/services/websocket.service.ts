import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { EMPTY, Subscription } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { environment } from '@env/environment';
import { WsInboundMessage } from '@core/models/ws-messages.model';

export type WsConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  // ── Signals ────────────────────────────────────────────────────────────────
  readonly connectionState = signal<WsConnectionState>('idle');
  readonly isConnected = computed(() => this.connectionState() === 'connected');

  // ── Message stream consumed by feature services ───────────────────────────
  private readonly _messages$ = new Subject<WsInboundMessage>();
  readonly messages$ = this._messages$.asObservable();

  private wsSubject: WebSocketSubject<WsInboundMessage> | null = null;
  private subscription: Subscription | null = null;

  /**
   * Opens the WebSocket for the given userId.
   * MUST be called BEFORE the HTTP /api/vehicles request so that
   * the Zeebe Worker finds the session in the push registry.
   */
  connect(userId: string): void {
    if (this.wsSubject) this.disconnect();

    const url = `${environment.wsBase}?userId=${userId}`;
    this.connectionState.set('connecting');

    this.wsSubject = webSocket<WsInboundMessage>({
      url,
      openObserver:  { next: () => this.connectionState.set('connected') },
      closeObserver: { next: () => this.connectionState.set('closed') },
    });

    this.subscription = this.wsSubject
      .pipe(
        tap(msg => this._messages$.next(msg)),
        catchError(err => {
          console.error('[WebSocketService]', err);
          this.connectionState.set('error');
          return EMPTY;
        }),
      )
      .subscribe();
  }

  disconnect(): void {
    this.subscription?.unsubscribe();
    this.wsSubject?.complete();
    this.wsSubject = null;
    this.subscription = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
    this._messages$.complete();
  }
}
