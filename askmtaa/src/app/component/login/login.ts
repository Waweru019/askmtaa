import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ServiceApi, LoginPayload } from '../../service/service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private api = inject(ServiceApi);
  private router = inject(Router);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload: LoginPayload = {
      identifier: this.loginForm.value.identifier || '',
      password: this.loginForm.value.password || ''
    };

   this.api.login(payload).subscribe({
  next: (res) => {
    this.isLoading.set(false);
    
    // 1. Save BOTH token and user object
    this.api.saveToken(res.token);
    this.api.saveUser(res.user); // Must save res.user so authGuard can read it!

    const role = res.user?.role?.toLowerCase() || '';

    if (role === 'vendor') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/admin']);
    }
  },
  error: (err) => {
    this.isLoading.set(false);
    this.errorMessage.set(
      err.error?.message || err.error?.error || 'Invalid email/phone number or password.'
    );
  }
});
  }
}