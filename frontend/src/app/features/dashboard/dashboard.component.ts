import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div>
      <h1 class="text-2xl font-bold text-white">Dashboard</h1>
      <p class="mt-1 text-sm text-zinc-500">Welcome back, {{ authService.currentUser()?.name ?? 'User' }}.</p>

      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6">
          <p class="text-sm font-medium text-zinc-500">Total Projects</p>
          <p class="mt-2 text-3xl font-bold text-white">0</p>
        </div>
        <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6">
          <p class="text-sm font-medium text-zinc-500">Active Tasks</p>
          <p class="mt-2 text-3xl font-bold text-white">0</p>
        </div>
        <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6">
          <p class="text-sm font-medium text-zinc-500">Completed</p>
          <p class="mt-2 text-3xl font-bold text-white">0</p>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  constructor(public authService: AuthService) {}
}
