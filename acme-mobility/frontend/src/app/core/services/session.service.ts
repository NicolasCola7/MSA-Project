import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly USER_ID_KEY = 'acme_user_id';
  private readonly USER_NAME_KEY = 'acme_user_name';
  private readonly router = inject(Router);

  readonly userId = signal<string>(this.resolveUserId());
  readonly userName = signal<string>(this.resolveUserName());

  private resolveUserId(): string {
    const id = localStorage.getItem('currentUser');
    if (!id) {
      console.warn("Nessun utente loggato trovato nel localStorage! Reindirizzare al login.");
      return '';
    }
    return id;
  }

  private resolveUserName(): string {
    return localStorage.getItem(this.USER_NAME_KEY) || '';
  }

  loginUser(id: string, name: string) {
    localStorage.setItem('currentUser', id);
    localStorage.setItem(this.USER_NAME_KEY, name);
    this.userId.set(id);
    this.userName.set(name);
  }

  logout() {
    localStorage.clear();
    this.userId.set('');
    this.userName.set('');
    this.router.navigate(['/']);
  }
}
