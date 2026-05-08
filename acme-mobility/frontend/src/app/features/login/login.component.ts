import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { SessionService } from '@core/services/session.service';

@Component({
  selector: 'acme-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  readonly errorMessage = signal('');

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);

  onLogin() {
    this.errorMessage.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: (loginRes) => {
        if (loginRes?.success) {
          const userId = loginRes.userId;
          const userName = loginRes.userName;

          if (!userId || !userName) {
            this.errorMessage.set('Invalid login response.');
            return;
          }

          this.sessionService.loginUser(userId, userName);
          this.navigateAfterLogin(loginRes.targetRoute, loginRes.vehicleId);
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

  private navigateAfterLogin(targetRoute: string | null | undefined, vehicleId: string | null | undefined): void {
    const route = targetRoute || '/map';

    if ((route === '/scan' || route === '/book') && vehicleId) {
      this.router.navigate([route], { queryParams: { vehicleId } });
      return;
    }

    this.router.navigate([route]);
  }
}
