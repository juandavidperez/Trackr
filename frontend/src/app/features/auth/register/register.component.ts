import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="relative flex min-h-screen overflow-hidden bg-zinc-950">
      <!-- Ambient glow -->
      <div
        class="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full opacity-20 blur-[120px]"
        style="background: radial-gradient(circle, #6366f1 0%, transparent 70%)"
      ></div>
      <div
        class="pointer-events-none absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full opacity-15 blur-[100px]"
        style="background: radial-gradient(circle, #a78bfa 0%, transparent 70%)"
      ></div>

      <!-- Left panel — form -->
      <div class="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 relative z-10">
        <div class="w-full max-w-sm">
          <!-- Mobile logo -->
          <div class="mb-10 flex items-center gap-3 lg:hidden">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
              </svg>
            </div>
            <span class="text-lg font-semibold text-white">Trackr</span>
          </div>

          <div class="mb-8">
            <h2 class="text-2xl font-bold text-white">Create your account</h2>
            <p class="mt-1 text-sm text-zinc-500">Start managing projects in minutes</p>
          </div>

          @if (error()) {
            <div class="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              {{ error() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label for="name" class="mb-1.5 block text-sm font-medium text-zinc-300">Full name</label>
              <input
                id="name"
                type="text"
                formControlName="name"
                class="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                placeholder="Jane Doe"
              />
              @if (form.get('name')?.touched && form.get('name')?.hasError('required')) {
                <p class="mt-1.5 text-xs text-red-400">Name is required</p>
              }
            </div>

            <div>
              <label for="email" class="mb-1.5 block text-sm font-medium text-zinc-300">Email</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                placeholder="you@company.com"
              />
              @if (form.get('email')?.touched && form.get('email')?.hasError('required')) {
                <p class="mt-1.5 text-xs text-red-400">Email is required</p>
              }
              @if (form.get('email')?.touched && form.get('email')?.hasError('email')) {
                <p class="mt-1.5 text-xs text-red-400">Enter a valid email address</p>
              }
            </div>

            <div>
              <label for="password" class="mb-1.5 block text-sm font-medium text-zinc-300">Password</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                class="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                placeholder="Min. 8 characters"
              />
              @if (form.get('password')?.touched && form.get('password')?.hasError('required')) {
                <p class="mt-1.5 text-xs text-red-400">Password is required</p>
              }
              @if (form.get('password')?.touched && form.get('password')?.hasError('minlength')) {
                <p class="mt-1.5 text-xs text-red-400">Password must be at least 8 characters</p>
              }
            </div>

            <div>
              <label for="confirmPassword" class="mb-1.5 block text-sm font-medium text-zinc-300">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                class="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                placeholder="Repeat your password"
              />
              @if (form.get('confirmPassword')?.touched && form.get('confirmPassword')?.hasError('required')) {
                <p class="mt-1.5 text-xs text-red-400">Please confirm your password</p>
              }
              @if (form.get('confirmPassword')?.touched && form.get('confirmPassword')?.hasError('passwordMismatch')) {
                <p class="mt-1.5 text-xs text-red-400">Passwords do not match</p>
              }
            </div>

            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              @if (loading()) {
                <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Creating account...
              } @else {
                Create account
              }
            </button>
          </form>

          <p class="mt-8 text-center text-sm text-zinc-500">
            Already have an account?
            <a routerLink="/auth/login" class="font-medium text-indigo-400 transition-colors hover:text-indigo-300">Sign in</a>
          </p>
        </div>
      </div>

      <!-- Right panel — brand -->
      <div class="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative z-10">
        <div class="flex justify-end">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
              </svg>
            </div>
            <span class="text-xl font-semibold tracking-tight text-white">Trackr</span>
          </div>
        </div>

        <div class="max-w-md ml-auto text-right">
          <h1 class="text-4xl leading-tight font-bold tracking-tight text-white">
            Your team,<br/>
            <span class="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">organized.</span>
          </h1>
          <p class="mt-4 text-lg leading-relaxed text-zinc-400">
            From backlog to done. Track every task, hit every deadline.
          </p>
        </div>

        <p class="text-right text-sm text-zinc-600">&copy; 2026 Trackr. Built for teams that ship.</p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly error = signal('');
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: RegisterComponent.passwordsMatch },
  );

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    const { confirmPassword, ...data } = this.form.getRawValue();
    this.authService.register(data).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Registration failed. Please try again.');
      },
    });
  }

  private static passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;

    if (confirm && password !== confirm) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }
}
