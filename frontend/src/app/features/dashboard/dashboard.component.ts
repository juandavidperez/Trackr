import {
  Component,
  AfterViewInit,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardResponse, DashboardTask } from '../../core/models/dashboard.model';

Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, NgClass],
  styles: [
    `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in-up {
        animation: fadeInUp 0.4s ease-out both;
      }
    `,
  ],
  template: `
    <div class="animate-fade-in-up">
      <h1 class="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
      <p class="mt-1 text-sm text-zinc-500">
        Welcome back, {{ authService.currentUser()?.name ?? 'User' }}.
      </p>

      <!-- Loading skeleton -->
      @if (loading()) {
        <!-- Summary cards skeleton -->
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (_ of [1, 2, 3, 4]; track _) {
            <div class="animate-pulse rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6">
              <div class="flex items-center justify-between">
                <div class="h-4 w-24 rounded bg-zinc-800"></div>
                <div class="h-9 w-9 rounded-lg bg-zinc-800/60"></div>
              </div>
              <div class="mt-3 h-8 w-16 rounded bg-zinc-800"></div>
            </div>
          }
        </div>

        <!-- Chart + Stats skeleton -->
        <div class="mt-6 grid gap-6 lg:grid-cols-3">
          <div class="animate-pulse rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6">
            <div class="h-4 w-32 rounded bg-zinc-800"></div>
            <div class="mx-auto mt-6 h-40 w-40 rounded-full bg-zinc-800/40"></div>
            <div class="mt-4 flex justify-center gap-4">
              @for (_ of [1, 2, 3]; track _) {
                <div class="h-3 w-16 rounded bg-zinc-800/30"></div>
              }
            </div>
          </div>
          <div class="animate-pulse rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6 lg:col-span-2">
            <div class="h-4 w-24 rounded bg-zinc-800"></div>
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              @for (_ of [1, 2, 3, 4]; track _) {
                <div class="rounded-lg border border-zinc-800/40 bg-zinc-950/40 px-4 py-3">
                  <div class="h-3 w-20 rounded bg-zinc-800/40"></div>
                  <div class="mt-2 h-7 w-12 rounded bg-zinc-800"></div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Task lists skeleton -->
        <div class="mt-6 grid gap-6 lg:grid-cols-2">
          @for (_ of [1, 2]; track _) {
            <div class="animate-pulse rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6">
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-zinc-800"></div>
                <div class="h-4 w-28 rounded bg-zinc-800"></div>
              </div>
              <div class="mt-4 space-y-2">
                @for (c of [1, 2, 3]; track c) {
                  <div class="rounded-lg border border-zinc-800/40 bg-zinc-950/30 p-3">
                    <div class="h-4 w-3/4 rounded bg-zinc-800/60"></div>
                    <div class="mt-2 flex gap-2">
                      <div class="h-3 w-16 rounded bg-zinc-800/30"></div>
                      <div class="h-3 w-20 rounded bg-zinc-800/30"></div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (!loading() && data()) {
        <!-- Summary Cards -->
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Assigned Tasks -->
          <div
            class="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700/60"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-zinc-500">Assigned Tasks</p>
              <div class="rounded-lg bg-indigo-500/10 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
            </div>
            <p class="mt-3 text-3xl font-bold text-white">{{ data()!.assignedTasks }}</p>
          </div>

          <!-- Completed (Done) -->
          <div
            class="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700/60"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-zinc-500">Completed</p>
              <div class="rounded-lg bg-emerald-500/10 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p class="mt-3 text-3xl font-bold text-white">{{ data()!.tasksByStatus.done }}</p>
          </div>

          <!-- In Progress -->
          <div
            class="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700/60"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-zinc-500">In Progress</p>
              <div class="rounded-lg bg-amber-500/10 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p class="mt-3 text-3xl font-bold text-white">{{ data()!.tasksByStatus.inProgress }}</p>
          </div>

          <!-- Overdue -->
          <div
            class="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700/60"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-zinc-500">Overdue</p>
              <div class="rounded-lg bg-rose-500/10 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
            </div>
            <p class="mt-3 text-3xl font-bold text-white" [ngClass]="data()!.overdueTasks > 0 ? 'text-rose-400' : ''">
              {{ data()!.overdueTasks }}
            </p>
          </div>
        </div>

        <!-- Chart + Stats row -->
        <div class="mt-6 grid gap-6 lg:grid-cols-3">
          <!-- Doughnut Chart -->
          <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6">
            <h2 class="text-sm font-semibold text-zinc-300">Task Distribution</h2>
            <div class="mx-auto mt-4 flex max-w-[200px] items-center justify-center">
              <canvas #chartCanvas></canvas>
            </div>
            <div class="mt-4 flex justify-center gap-4">
              <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 rounded-full bg-zinc-400"></span>
                <span class="text-xs text-zinc-500">Todo</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 rounded-full bg-indigo-400"></span>
                <span class="text-xs text-zinc-500">In Progress</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
                <span class="text-xs text-zinc-500">Done</span>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6 lg:col-span-2">
            <h2 class="text-sm font-semibold text-zinc-300">Quick Stats</h2>
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="rounded-lg border border-zinc-800/40 bg-zinc-950/40 px-4 py-3">
                <p class="text-xs text-zinc-500">Active Projects</p>
                <p class="mt-1 text-2xl font-bold text-white">{{ data()!.activeProjects }}</p>
              </div>
              <div class="rounded-lg border border-zinc-800/40 bg-zinc-950/40 px-4 py-3">
                <p class="text-xs text-zinc-500">Completed (Last 7 Days)</p>
                <p class="mt-1 text-2xl font-bold text-emerald-400">{{ data()!.completedLast7Days }}</p>
              </div>
              <div class="rounded-lg border border-zinc-800/40 bg-zinc-950/40 px-4 py-3">
                <p class="text-xs text-zinc-500">Todo</p>
                <p class="mt-1 text-2xl font-bold text-white">{{ data()!.tasksByStatus.todo }}</p>
              </div>
              <div class="rounded-lg border border-zinc-800/40 bg-zinc-950/40 px-4 py-3">
                <p class="text-xs text-zinc-500">Completion Rate</p>
                <p class="mt-1 text-2xl font-bold text-indigo-400">{{ completionRate() }}%</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Task lists -->
        <div class="mt-6 grid gap-6 lg:grid-cols-2">
          <!-- Overdue Tasks -->
          <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6">
            <div class="flex items-center gap-2">
              <div class="h-2 w-2 rounded-full bg-rose-400"></div>
              <h2 class="text-sm font-semibold text-zinc-300">Overdue Tasks</h2>
              @if (data()!.overdueTaskList.length > 0) {
                <span class="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400">
                  {{ data()!.overdueTaskList.length }}
                </span>
              }
            </div>
            <div class="mt-4 space-y-2">
              @for (task of data()!.overdueTaskList; track task.id) {
                <a
                  [routerLink]="['/projects', task.projectId]"
                  class="flex items-center justify-between rounded-lg border border-zinc-800/40 bg-zinc-950/40 px-4 py-3 transition-colors hover:border-zinc-700/60"
                >
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-zinc-200">{{ task.title }}</p>
                    <p class="mt-0.5 text-xs text-zinc-600">{{ task.projectName }}</p>
                  </div>
                  <div class="ml-3 flex shrink-0 items-center gap-2">
                    <span
                      class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      [ngClass]="{
                        'border-rose-500/20 bg-rose-500/10 text-rose-400': task.priority === 'HIGH',
                        'border-amber-500/20 bg-amber-500/10 text-amber-400': task.priority === 'MEDIUM',
                        'border-emerald-500/20 bg-emerald-500/10 text-emerald-400': task.priority === 'LOW',
                      }"
                    >
                      {{ task.priority }}
                    </span>
                    @if (task.dueDate) {
                      <span class="text-xs text-rose-400">{{ formatDate(task.dueDate) }}</span>
                    }
                  </div>
                </a>
              } @empty {
                <div class="flex flex-col items-center py-6 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" viewBox="0 0 72 72" fill="none">
                    <!-- Shield -->
                    <path d="M36 10L14 20V34C14 48.36 23.64 61.56 36 65C48.36 61.56 58 48.36 58 34V20L36 10Z" class="fill-zinc-800/30 stroke-zinc-700/30" stroke-width="1.2"/>
                    <!-- Checkmark -->
                    <path d="M26 37L33 44L46 28" class="stroke-emerald-500/40" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <p class="mt-2 text-xs font-medium text-zinc-600">All caught up!</p>
                  <p class="mt-0.5 text-[11px] text-zinc-700">No overdue tasks right now</p>
                </div>
              }
            </div>
          </div>

          <!-- Recently Assigned -->
          <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6">
            <div class="flex items-center gap-2">
              <div class="h-2 w-2 rounded-full bg-indigo-400"></div>
              <h2 class="text-sm font-semibold text-zinc-300">Recently Assigned</h2>
            </div>
            <div class="mt-4 space-y-2">
              @for (task of data()!.recentTaskList; track task.id) {
                <a
                  [routerLink]="['/projects', task.projectId]"
                  class="flex items-center justify-between rounded-lg border border-zinc-800/40 bg-zinc-950/40 px-4 py-3 transition-colors hover:border-zinc-700/60"
                >
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-zinc-200">{{ task.title }}</p>
                    <p class="mt-0.5 text-xs text-zinc-600">{{ task.projectName }}</p>
                  </div>
                  <div class="ml-3 flex shrink-0 items-center gap-2">
                    <span
                      class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      [ngClass]="{
                        'border-zinc-500/20 bg-zinc-500/10 text-zinc-400': task.status === 'TODO',
                        'border-indigo-500/20 bg-indigo-500/10 text-indigo-400': task.status === 'IN_PROGRESS',
                      }"
                    >
                      {{ task.status === 'TODO' ? 'Todo' : 'In Progress' }}
                    </span>
                    <span class="text-xs text-zinc-600">{{ formatDate(task.createdAt) }}</span>
                  </div>
                </a>
              } @empty {
                <div class="flex flex-col items-center py-6 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" viewBox="0 0 72 72" fill="none">
                    <!-- Inbox tray -->
                    <rect x="14" y="24" width="44" height="32" rx="4" class="fill-zinc-800/30 stroke-zinc-700/30" stroke-width="1.2"/>
                    <path d="M14 42H26L30 48H42L46 42H58" class="stroke-zinc-700/40" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                    <!-- Arrow down -->
                    <path d="M36 14V32M30 26L36 32L42 26" class="stroke-zinc-600/30" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <p class="mt-2 text-xs font-medium text-zinc-600">No recent tasks</p>
                  <p class="mt-0.5 text-[11px] text-zinc-700">New task assignments will appear here</p>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);

  readonly loading = signal(true);
  readonly data = signal<DashboardResponse | null>(null);

  readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  private chart: Chart<'doughnut'> | null = null;

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (response) => {
        this.data.set(response);
        this.loading.set(false);
        setTimeout(() => this.createChart(), 0);
      },
      error: () => this.loading.set(false),
    });
  }

  ngAfterViewInit(): void {
    if (this.data()) {
      this.createChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  completionRate(): number {
    const d = this.data();
    if (!d || d.assignedTasks === 0) return 0;
    return Math.round((d.tasksByStatus.done / d.assignedTasks) * 100);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private createChart(): void {
    const canvas = this.chartCanvas();
    const d = this.data();
    if (!canvas || !d) return;

    this.chart?.destroy();

    const { todo, inProgress, done } = d.tasksByStatus;
    const total = todo + inProgress + done;

    this.chart = new Chart(canvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Todo', 'In Progress', 'Done'],
        datasets: [
          {
            data: total > 0 ? [todo, inProgress, done] : [1],
            backgroundColor: total > 0 ? ['#a1a1aa', '#818cf8', '#34d399'] : ['#27272a'],
            borderColor: 'transparent',
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: total > 0,
            backgroundColor: '#18181b',
            titleColor: '#e4e4e7',
            bodyColor: '#a1a1aa',
            borderColor: '#3f3f46',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
          },
        },
      },
    });
  }
}
