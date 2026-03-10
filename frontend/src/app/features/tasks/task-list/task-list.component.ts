import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import {
  MyTaskFilterParams,
  TaskPriority,
  TaskResponse,
  TaskStatus,
} from '../../../core/models/task.model';
import { ProjectResponse } from '../../../core/models/project.model';

@Component({
  selector: 'app-task-list',
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
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .animate-fade-in-up {
        animation: fadeInUp 0.4s ease-out both;
      }
      .animate-fade-in {
        animation: fadeIn 0.3s ease-out both;
      }
      select.styled-select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2371717a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
        background-position: right 0.25rem center;
        background-repeat: no-repeat;
        background-size: 1.25em 1.25em;
        padding-right: 1.75rem;
      }
    `,
  ],
  template: `
    <div class="animate-fade-in">
      <!-- Loading skeleton -->
      @if (loading()) {
        <div>
          <div class="h-4 w-28 animate-pulse rounded bg-zinc-800/60"></div>
          <div class="mt-3 h-7 w-48 animate-pulse rounded bg-zinc-800"></div>
          <div class="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-800/40"></div>

          <!-- Filter bar skeleton -->
          <div class="mt-6 flex flex-col gap-3 sm:flex-row">
            <div class="h-10 w-full animate-pulse rounded-lg bg-zinc-800/40 sm:w-64"></div>
            <div class="flex gap-3">
              <div class="h-10 w-full animate-pulse rounded-lg bg-zinc-800/40 sm:w-32"></div>
              <div class="h-10 w-full animate-pulse rounded-lg bg-zinc-800/40 sm:w-32"></div>
              <div class="h-10 w-full animate-pulse rounded-lg bg-zinc-800/40 sm:w-36"></div>
            </div>
          </div>

          <!-- Table skeleton -->
          <div class="mt-6 space-y-3">
            @for (_ of [1, 2, 3, 4, 5, 6]; track _) {
              <div class="flex items-center gap-4 rounded-lg border border-zinc-800/40 bg-zinc-900/30 p-4">
                <div class="h-4 w-1/3 animate-pulse rounded bg-zinc-800"></div>
                <div class="h-4 w-24 animate-pulse rounded bg-zinc-800/40"></div>
                <div class="h-5 w-16 animate-pulse rounded-full bg-zinc-800/40"></div>
                <div class="h-5 w-14 animate-pulse rounded-full bg-zinc-800/40"></div>
                <div class="h-4 w-20 animate-pulse rounded bg-zinc-800/30"></div>
              </div>
            }
          </div>
        </div>
      }

      @if (!loading()) {
        <!-- Breadcrumbs -->
        <nav class="flex items-center gap-1.5 text-sm">
          <a routerLink="/dashboard" class="text-zinc-600 transition-colors hover:text-zinc-400">Dashboard</a>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
          </svg>
          <span class="text-zinc-400">My Tasks</span>
        </nav>

        <!-- Header -->
        <div class="mt-4">
          <h1 class="text-2xl font-bold tracking-tight text-white">My Tasks</h1>
          <p class="mt-1 text-sm text-zinc-500">
            All tasks assigned to you across projects.
          </p>
        </div>

        <!-- Filter Bar -->
        <div
          class="mt-6 flex flex-col gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4 sm:flex-row sm:items-center sm:flex-wrap"
        >
          <!-- Search -->
          <div class="relative flex-1 sm:min-w-[200px] sm:max-w-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search tasks..."
              [value]="searchTerm()"
              (input)="onSearchInput($event)"
              class="block w-full rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-600 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
            />
          </div>

          <!-- Project filter -->
          <select
            class="styled-select rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-400 transition-colors focus:border-indigo-500 focus:outline-none"
            [value]="filterProjectId()"
            (change)="onFilterChange('project', $any($event.target).value)"
          >
            <option value="">All projects</option>
            @for (p of projects(); track p.id) {
              <option [value]="p.id">{{ p.name }}</option>
            }
          </select>

          <!-- Status filter -->
          <select
            class="styled-select rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-400 transition-colors focus:border-indigo-500 focus:outline-none"
            [value]="filterStatus()"
            (change)="onFilterChange('status', $any($event.target).value)"
          >
            <option value="">All statuses</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>

          <!-- Priority filter -->
          <select
            class="styled-select rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-400 transition-colors focus:border-indigo-500 focus:outline-none"
            [value]="filterPriority()"
            (change)="onFilterChange('priority', $any($event.target).value)"
          >
            <option value="">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <!-- Sort -->
          <select
            class="styled-select rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-400 transition-colors focus:border-indigo-500 focus:outline-none"
            [value]="sortBy()"
            (change)="onSortChange($any($event.target).value)"
          >
            <option value="">Default order</option>
            <option value="createdAt">Created date</option>
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
          </select>

          <!-- Sort direction toggle -->
          @if (sortBy()) {
            <button
              (click)="toggleSortDir()"
              class="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300"
              [title]="sortDir() === 'asc' ? 'Ascending' : 'Descending'"
            >
              @if (sortDir() === 'asc') {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
                </svg>
                Asc
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
                </svg>
                Desc
              }
            </button>
          }

          <!-- Clear filters -->
          @if (hasActiveFilters()) {
            <button
              (click)="clearFilters()"
              class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          }
        </div>

        <!-- Task count -->
        <div class="mt-4 text-xs text-zinc-600">
          {{ totalElements() }} {{ totalElements() === 1 ? 'task' : 'tasks' }}
        </div>

        <!-- Task List -->
        <div class="mt-3 space-y-2">
          @for (task of tasks(); track task.id; let i = $index) {
            <a
              [routerLink]="['/projects', task.projectId]"
              class="animate-fade-in-up flex items-center gap-4 rounded-lg border border-zinc-800/40 bg-zinc-950/40 px-4 py-3.5 transition-all hover:border-zinc-700/60 hover:bg-zinc-900/40"
              [style.animation-delay]="i * 30 + 'ms'"
            >
              <!-- Title + Project -->
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-zinc-200">{{ task.title }}</p>
                <p class="mt-0.5 truncate text-xs text-zinc-600">{{ task.projectName }}</p>
              </div>

              <!-- Status badge -->
              <span
                class="hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider sm:inline-block"
                [ngClass]="{
                  'border-zinc-500/20 bg-zinc-500/10 text-zinc-400': task.status === 'TODO',
                  'border-indigo-500/20 bg-indigo-500/10 text-indigo-400': task.status === 'IN_PROGRESS',
                  'border-emerald-500/20 bg-emerald-500/10 text-emerald-400': task.status === 'DONE',
                }"
              >
                {{ statusLabel(task.status) }}
              </span>

              <!-- Priority badge -->
              <span
                class="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                [ngClass]="{
                  'border-rose-500/20 bg-rose-500/10 text-rose-400': task.priority === 'HIGH',
                  'border-amber-500/20 bg-amber-500/10 text-amber-400': task.priority === 'MEDIUM',
                  'border-emerald-500/20 bg-emerald-500/10 text-emerald-400': task.priority === 'LOW',
                }"
              >
                {{ task.priority }}
              </span>

              <!-- Due date -->
              @if (task.dueDate) {
                <span
                  class="hidden shrink-0 items-center gap-1 text-xs sm:flex"
                  [ngClass]="isOverdue(task.dueDate) && task.status !== 'DONE' ? 'text-rose-400' : 'text-zinc-500'"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                    />
                  </svg>
                  {{ formatDate(task.dueDate) }}
                </span>
              }

              <!-- Arrow -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </a>
          } @empty {
            <div class="flex flex-col items-center py-16 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" viewBox="0 0 72 72" fill="none">
                <rect x="14" y="8" width="28" height="38" rx="4" class="fill-zinc-800/40 stroke-zinc-700/30" stroke-width="1.2"/>
                <rect x="20" y="4" width="16" height="8" rx="3" class="fill-zinc-800/60 stroke-zinc-700/40" stroke-width="1.2"/>
                <rect x="20" y="20" width="16" height="2" rx="1" class="fill-zinc-700/40"/>
                <rect x="20" y="26" width="12" height="2" rx="1" class="fill-zinc-700/30"/>
                <rect x="20" y="32" width="14" height="2" rx="1" class="fill-zinc-700/20"/>
                <path d="M44 28L50 34L62 22" class="stroke-emerald-500/30" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              @if (hasActiveFilters()) {
                <p class="mt-3 text-sm font-medium text-zinc-500">No tasks match your filters</p>
                <p class="mt-1 text-xs text-zinc-600">Try adjusting or clearing your filters.</p>
              } @else {
                <p class="mt-3 text-sm font-medium text-zinc-500">No tasks assigned to you</p>
                <p class="mt-1 text-xs text-zinc-600">Tasks assigned to you will appear here.</p>
              }
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="mt-6 flex items-center justify-between">
            <p class="text-xs text-zinc-600">
              Page {{ currentPage() + 1 }} of {{ totalPages() }}
            </p>
            <div class="flex gap-2">
              <button
                (click)="goToPage(currentPage() - 1)"
                [disabled]="currentPage() === 0"
                class="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Previous
              </button>
              <button
                (click)="goToPage(currentPage() + 1)"
                [disabled]="currentPage() >= totalPages() - 1"
                class="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class TaskListComponent implements OnInit, OnDestroy {
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);

  readonly loading = signal(true);
  readonly tasks = signal<TaskResponse[]>([]);
  readonly projects = signal<ProjectResponse[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly currentPage = signal(0);

  // Filter state
  readonly searchTerm = signal('');
  readonly filterProjectId = signal('');
  readonly filterStatus = signal('');
  readonly filterPriority = signal('');
  readonly sortBy = signal('');
  readonly sortDir = signal<'asc' | 'desc'>('desc');

  readonly hasActiveFilters = computed(
    () =>
      !!this.searchTerm() ||
      !!this.filterProjectId() ||
      !!this.filterStatus() ||
      !!this.filterPriority() ||
      !!this.sortBy(),
  );

  private readonly searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  ngOnInit(): void {
    this.searchSub = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.currentPage.set(0);
        this.loadTasks();
      });

    this.loadProjects();
    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearchInput(event: Event): void {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  onFilterChange(type: 'project' | 'status' | 'priority', value: string): void {
    if (type === 'project') this.filterProjectId.set(value);
    else if (type === 'status') this.filterStatus.set(value);
    else this.filterPriority.set(value);
    this.currentPage.set(0);
    this.loadTasks();
  }

  onSortChange(value: string): void {
    this.sortBy.set(value);
    if (!value) this.sortDir.set('desc');
    this.currentPage.set(0);
    this.loadTasks();
  }

  toggleSortDir(): void {
    this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    this.loadTasks();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterProjectId.set('');
    this.filterStatus.set('');
    this.filterPriority.set('');
    this.sortBy.set('');
    this.sortDir.set('desc');
    this.currentPage.set(0);
    this.loadTasks();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadTasks();
  }

  statusLabel(status: TaskStatus): string {
    switch (status) {
      case 'TODO':
        return 'Todo';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'DONE':
        return 'Done';
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  isOverdue(dateStr: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr + 'T00:00:00') < today;
  }

  private loadProjects(): void {
    this.projectService.getAll(0, 100).subscribe({
      next: (page) => this.projects.set(page.content),
      error: () => this.projects.set([]),
    });
  }

  private loadTasks(): void {
    const filters: MyTaskFilterParams = {
      page: this.currentPage(),
      size: 20,
    };
    if (this.searchTerm()) filters.search = this.searchTerm();
    if (this.filterProjectId()) filters.projectId = Number(this.filterProjectId());
    if (this.filterStatus()) filters.status = this.filterStatus() as TaskStatus;
    if (this.filterPriority()) filters.priority = this.filterPriority() as TaskPriority;
    if (this.sortBy()) filters.sort = `${this.sortBy()},${this.sortDir()}`;

    this.taskService.getMyTasks(filters).subscribe({
      next: (page) => {
        this.tasks.set(page.content);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
