import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { SessionService } from '@core/services/session.service';
import { v4 } from 'uuid';

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
  
  private readonly INITIAL_BALANCE = 100.00;

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
    const accountId = v4();

    this.sessionService.register({ name, email, password, accountId }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.successMessage = res.message;
          console.log(res.message);
          //if registration is successful, create a bank account with the initial balance
          this.sessionService.createBankAccount({ accountId: accountId, balance: this.INITIAL_BALANCE }).subscribe({
            next: (res: any) => {
              console.log(res.message);
              alert('Registration successful! Your account has been created with an initial balance of $100. Please log in to continue.');
              this.registerForm.reset();
              this.submitted = false;
            },
            error: (err) => {
              console.log(err.error?.message);
              this.errorMessage = err.error?.message || 'Error creating bank account.';
            }
          });
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
