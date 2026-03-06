import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div class="w-full max-w-md space-y-8">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900">Trackr</h1>
          <p class="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6 rounded-lg bg-white p-8 shadow">
          @if (error()) {
            <div class="rounded bg-red-50 p-3 text-sm text-red-600">{{ error() }}</div>
          }

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading() ? 'Signing in...' : 'Sign in' }}
          </button>

          <p class="text-center text-sm text-gray-600">
            Don't have an account?
            <a routerLink="/auth/register" class="font-medium text-blue-600 hover:text-blue-500">Register</a>
          </p>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  readonly error = signal('');
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Invalid email or password');
      },
    });
  }
}
