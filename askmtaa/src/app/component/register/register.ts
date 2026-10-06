import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiceApi, RegisterPayload } from '../../service/service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private api = inject(ServiceApi);
  private router = inject(Router);

  // Reactive State using Signals
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  registerForm = this.fb.group({
    phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9+]{10,15}$')]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload: RegisterPayload = {
      phoneNumber: this.registerForm.value.phoneNumber!,
      email: this.registerForm.value.email!,
      password: this.registerForm.value.password!,
      role: 'vendor'
    };

    this.api.register(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Vendor account created successfully! Redirecting...');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Registration failed. Please try again.');
      }
    });
  }
}