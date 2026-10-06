import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, // <-- THIS IS REQUIRED FOR [formGroup]
    RouterLink
  ],
 templateUrl: './forgort-password.html',
  styleUrl: './forgort-password.css',
})
export class ForgortPassword {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  // UI State Management using Signals
  currentStep = signal<number>(1); // Step 1: Request OTP, Step 2: Verify & Reset
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Forms Setup
  requestForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  resetForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    new_password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Step 1: Send Request to Backend
  onRequestOTP() {
    if (this.requestForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const email = this.requestForm.value.email;

    this.http.post<{ message: string }>('http://localhost:8080/api/auth/forgot-password', { email }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set(res.message || 'OTP sent successfully! Check your inbox.');
        
        // Auto-fill the email in Step 2 form and move to next step
        this.resetForm.patchValue({ email });
        this.currentStep.set(2);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to send OTP. Please try again.');
      }
    });
  }

  // Step 2: Submit OTP & New Password
  onResetPassword() {
    if (this.resetForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.post<{ message: string }>('http://localhost:8080/api/auth/reset-password', this.resetForm.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set(res.message || 'Password reset successful!');
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Invalid or expired OTP code.');
      }
    });
  }
}