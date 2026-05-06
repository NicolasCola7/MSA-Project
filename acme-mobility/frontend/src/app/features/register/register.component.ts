import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { SessionService } from '@core/services/session.service';

@Component({
  selector: 'acme-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly sessionService = inject(SessionService);

  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  /** Custom validator: Password e Conferma Password devono coincidere */
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  get f() {
    return this.registerForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    if (this.registerForm.invalid) return;

    const { name, email, password } = this.registerForm.value;

    this.sessionService.register({ name, email, password }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.successMessage = res.message;
        } else {
          this.errorMessage = res.message;
        }
      },
      error: (err) => {
        if (err.status === 409) {
          this.errorMessage = err.error?.message || 'Email already registered.';
        } else {
          this.errorMessage = 'Network error. Please try again later.';
        }
      }
    });
  }
}
