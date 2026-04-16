import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly USER_ID_KEY = 'acme_user_id';

  readonly userId = signal<string>(this.resolveUserId());

  private resolveUserId(): string {
    let id = sessionStorage.getItem(this.USER_ID_KEY);
    if (!id) {
      id = 'user-' + Math.random().toString(36).slice(2, 7);
      sessionStorage.setItem(this.USER_ID_KEY, id);
    }
    return id;
  }
}
