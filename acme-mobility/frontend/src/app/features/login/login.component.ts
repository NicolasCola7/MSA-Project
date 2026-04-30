import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SessionService } from '@core/services/session.service';
import { environment } from '@env/environment';

@Component({
  selector: 'acme-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  errorMessage = '';

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);

  onLogin() {
    this.errorMessage = '';
    
    // Login to backend
    this.http.post<any>(`${environment.apiBase}/api/auth/login`, {
      email: this.email,
      password: this.password
    }).pipe(
      catchError(err => {
        this.errorMessage = 'Credenziali non valide o errore di rete.';
        return of(null);
      })
    ).subscribe(loginRes => {
      if (loginRes && loginRes.success) {
        const userId = loginRes.userId;
        
        // Save to SessionService
        this.sessionService.loginUser(userId);

        // Call the endpoint to instantiate the Camunda process
        this.http.post<any>(`${environment.apiBase}/api/rentals/init`, {
          userId: userId
        }).subscribe(camundaRes => {
          if (camundaRes && camundaRes.processInstanceKey) {
             localStorage.setItem('currentProcessInstance', camundaRes.processInstanceKey.toString());
          }
          
          // Redirect to vehicles/map
          this.router.navigate(['/vehicles']);
        });
      } else if (loginRes && !loginRes.success) {
         this.errorMessage = loginRes.message;
      }
    });
  }
}
