import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly USER_ID_KEY = 'acme_user_id';
  private readonly USER_NAME_KEY = 'acme_user_name';
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly userId = signal<string>(this.resolveUserId());
  readonly userName = signal<string>(this.resolveUserName());

  private resolveUserId(): string {
    const id = localStorage.getItem('currentUser');
    if (!id) {
      console.warn("No logged in user found in localStorage! Redirecting to login.");
      return '';
    }
    return id;
  }

  private resolveUserName(): string {
    return localStorage.getItem(this.USER_NAME_KEY) || '';
  }

  isLoggedIn(): boolean {
    return !!this.userId() && this.userId() !== '';
  }

  loginUser(id: string, name: string) {
    localStorage.setItem('currentUser', id);
    localStorage.setItem(this.USER_NAME_KEY, name);
    this.userId.set(id);
    this.userName.set(name);
  }

  register(data: { name: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${environment.apiBase}/api/auth/register`, data);
  }

  logout() {
    localStorage.clear();
    this.userId.set('');
    this.userName.set('');
    this.router.navigate(['/login']);
  }
}
