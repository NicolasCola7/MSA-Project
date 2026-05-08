import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';

export interface LoginResponse {
  userId: string | null;
  userName: string | null;
  success: boolean;
  message: string;
  targetRoute?: string | null;
  vehicleId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiBase}/api/auth/login`, {
      email,
      password,
    });
  }
}
