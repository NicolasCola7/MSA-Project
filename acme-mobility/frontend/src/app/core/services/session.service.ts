import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly USER_ID_KEY = 'acme_user_id';

  readonly userId = signal<string>(this.resolveUserId());

  private resolveUserId(): string {
    const id = localStorage.getItem('currentUser');
    if (!id) {
      console.warn("Nessun utente loggato trovato nel localStorage! Reindirizzare al login.");
      return '';
    }
    return id;
  }

  loginUser(id: string) {
    localStorage.setItem('currentUser', id);
    this.userId.set(id);
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.userId.set('');
  }
}
