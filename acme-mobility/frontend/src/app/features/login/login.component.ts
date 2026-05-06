import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { environment } from '@env/environment';

@Component({
  selector: 'acme-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  readonly errorMessage = signal('');

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);

  onLogin() {
    this.errorMessage.set('');

    this.http.post<any>(`${environment.apiBase}/api/auth/login`, {
      email: this.email,
      password: this.password
    }).subscribe({
      next: (loginRes) => {
        if (loginRes?.success) {
          const userId = loginRes.userId;
          const userName = loginRes.userName;

          this.sessionService.loginUser(userId, userName);

          // Avvia processo Camunda (non bloccante: se fallisce, naviga comunque)
          this.http.post<any>(`${environment.apiBase}/api/rentals/init`, { userId }).subscribe({
            next: (camundaRes) => {
              if (camundaRes?.processInstanceKey) {
                localStorage.setItem('currentProcessInstance', camundaRes.processInstanceKey.toString());
              }
            },
            error: () => { /* Camunda non critico, ignoriamo */ }
          });

          this.router.navigate(['/map']);
        } else {
          this.errorMessage.set(loginRes?.message ?? 'Unknown error.');
        }
      },
      error: (err) => {
        // 401 Unauthorized o errori di rete
        this.errorMessage.set(err.error?.message ?? 'Invalid credentials.');
      }
    });
  }
}
