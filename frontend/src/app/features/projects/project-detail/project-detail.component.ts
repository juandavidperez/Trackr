import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { ProjectResponse } from '../../../core/models/project.model';
import { TaskFilterParams, TaskPriority, TaskResponse, TaskStatus } from '../../../core/models/task.model';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, NgClass, ReactiveFormsModule],
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
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.25em 1.25em;
        padding-right: 2rem;
      }
    `,
  ],
  template: `
    <div class="animate-fade-in">
      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <svg
            class="h-8 w-8 animate-spin text-indigo-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
        </div>
      }

      @if (!loading() && project()) {
        <!-- Header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <a
              routerLink="/projects"
              class="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
              Back to Projects
            </a>
            <h1 class="mt-2 text-2xl font-bold tracking-tight text-white">
              {{ project()!.name }}
            </h1>
            @if (project()!.description) {
              <p class="mt-1 max-w-2xl text-sm text-zinc-500">{{ project()!.description }}</p>
            }
          </div>
          <button
            (click)="openTaskModal()"
            class="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Task
          </button>
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"
                  />
                </svg>
                Asc
              } @else {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25"
                  />
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear
            </button>
          }
        </div>

        <!-- Task Board -->
        <div class="mt-6 grid gap-6 lg:grid-cols-3">
          @for (col of columns(); track col.status) {
            <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-4">
              <!-- Column header -->
              <div class="mb-4 flex items-center gap-2.5">
                <div class="h-2.5 w-2.5 rounded-full" [ngClass]="col.dotColor"></div>
                <h2 class="text-sm font-semibold text-zinc-300">{{ col.label }}</h2>
                <span
                  class="ml-auto rounded-full bg-zinc-800/60 px-2 py-0.5 text-xs font-medium text-zinc-500"
                >
                  {{ col.tasks.length }}
                </span>
              </div>

              <!-- Task cards -->
              <div class="space-y-3">
                @for (task of col.tasks; track task.id; let i = $index) {
                  <div
                    class="animate-fade-in-up rounded-lg border border-zinc-800/40 bg-zinc-950/60 p-4 transition-all hover:border-zinc-700/60"
                    [style.animation-delay]="i * 50 + 'ms'"
                  >
                    <p class="text-sm font-medium text-zinc-200">{{ task.title }}</p>

                    @if (task.description) {
                      <p class="mt-1 line-clamp-1 text-xs text-zinc-600">{{ task.description }}</p>
                    }

                    <!-- Priority + Assignee -->
                    <div class="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        [ngClass]="{
                          'border-rose-500/20 bg-rose-500/10 text-rose-400':
                            task.priority === 'HIGH',
                          'border-amber-500/20 bg-amber-500/10 text-amber-400':
                            task.priority === 'MEDIUM',
                          'border-emerald-500/20 bg-emerald-500/10 text-emerald-400':
                            task.priority === 'LOW',
                        }"
                      >
                        {{ task.priority }}
                      </span>

                      @if (task.assigneeName) {
                        <span class="flex items-center gap-1.5 text-xs text-zinc-500">
                          <span
                            class="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600/20 text-[10px] font-semibold text-indigo-400"
                          >
                            {{ getInitials(task.assigneeName) }}
                          </span>
                          {{ task.assigneeName }}
                        </span>
                      }
                    </div>

                    <!-- Due date + Status change -->
                    <div class="mt-3 flex items-center justify-between gap-2">
                      @if (task.dueDate) {
                        <span
                          class="flex items-center gap-1 text-xs"
                          [ngClass]="isOverdue(task.dueDate) ? 'text-rose-400' : 'text-zinc-500'"
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
                      } @else {
                        <span></span>
                      }

                      <select
                        class="styled-select rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-400 transition-colors focus:border-indigo-500 focus:outline-none"
                        [value]="task.status"
                        (change)="changeStatus(task.id, $any($event.target).value)"
                      >
                        <option value="TODO">Todo</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                  </div>
                } @empty {
                  <p class="py-6 text-center text-xs text-zinc-700">No tasks</p>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Create Task Modal -->
      @if (showTaskModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            class="absolute inset-0 bg-black/70 backdrop-blur-sm"
            (click)="closeTaskModal()"
          ></div>

          <div
            class="relative w-full max-w-md rounded-xl border border-zinc-800/60 bg-zinc-950 p-6 shadow-2xl animate-fade-in-up"
          >
            <h2 class="text-lg font-semibold text-white">Create Task</h2>
            <p class="mt-1 text-sm text-zinc-500">Add a new task to this project</p>

            @if (taskError()) {
              <div
                class="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                {{ taskError() }}
              </div>
            }

            <form [formGroup]="taskForm" (ngSubmit)="onTaskSubmit()" class="mt-6 space-y-4">
              <div>
                <label for="title" class="mb-1.5 block text-sm font-medium text-zinc-300"
                  >Title</label
                >
                <input
                  id="title"
                  type="text"
                  formControlName="title"
                  class="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                  placeholder="e.g. Design landing page mockup"
                />
                @if (
                  taskForm.get('title')?.touched && taskForm.get('title')?.hasError('required')
                ) {
                  <p class="mt-1.5 text-xs text-red-400">Title is required</p>
                }
              </div>

              <div>
                <label for="taskDescription" class="mb-1.5 block text-sm font-medium text-zinc-300"
                  >Description</label
                >
                <textarea
                  id="taskDescription"
                  formControlName="description"
                  rows="3"
                  class="block w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                  placeholder="Describe the task..."
                ></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="priority" class="mb-1.5 block text-sm font-medium text-zinc-300"
                    >Priority</label
                  >
                  <select
                    id="priority"
                    formControlName="priority"
                    class="styled-select block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label for="dueDate" class="mb-1.5 block text-sm font-medium text-zinc-300"
                    >Due date</label
                  >
                  <input
                    id="dueDate"
                    type="date"
                    formControlName="dueDate"
                    class="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div class="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  (click)="closeTaskModal()"
                  class="rounded-lg border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="taskForm.invalid || creatingTask()"
                  class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  @if (creatingTask()) {
                    <svg
                      class="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
                    </svg>
                    Creating...
                  } @else {
                    Create Task
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly project = signal<ProjectResponse | null>(null);
  readonly tasks = signal<TaskResponse[]>([]);
  readonly showTaskModal = signal(false);
  readonly creatingTask = signal(false);
  readonly taskError = signal('');

  // Filter state
  readonly searchTerm = signal('');
  readonly filterStatus = signal('');
  readonly filterPriority = signal('');
  readonly sortBy = signal('');
  readonly sortDir = signal<'asc' | 'desc'>('desc');

  readonly hasActiveFilters = computed(
    () => !!this.searchTerm() || !!this.filterStatus() || !!this.filterPriority() || !!this.sortBy(),
  );

  private readonly searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  readonly todoTasks = computed(() => this.tasks().filter((t) => t.status === 'TODO'));
  readonly inProgressTasks = computed(() =>
    this.tasks().filter((t) => t.status === 'IN_PROGRESS'),
  );
  readonly doneTasks = computed(() => this.tasks().filter((t) => t.status === 'DONE'));

  readonly columns = computed(() => [
    {
      status: 'TODO' as TaskStatus,
      label: 'Todo',
      dotColor: 'bg-zinc-400',
      tasks: this.todoTasks(),
    },
    {
      status: 'IN_PROGRESS' as TaskStatus,
      label: 'In Progress',
      dotColor: 'bg-indigo-400',
      tasks: this.inProgressTasks(),
    },
    {
      status: 'DONE' as TaskStatus,
      label: 'Done',
      dotColor: 'bg-emerald-400',
      tasks: this.doneTasks(),
    },
  ]);

  readonly taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', Validators.maxLength(1000)],
    priority: ['MEDIUM' as TaskPriority],
    dueDate: [''],
  });

  private projectId = 0;

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.searchSub = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.loadTasks();
      });
    this.loadData();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearchInput(event: Event): void {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  onFilterChange(type: 'status' | 'priority', value: string): void {
    if (type === 'status') this.filterStatus.set(value);
    else this.filterPriority.set(value);
    this.loadTasks();
  }

  onSortChange(value: string): void {
    this.sortBy.set(value);
    if (!value) this.sortDir.set('desc');
    this.loadTasks();
  }

  toggleSortDir(): void {
    this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    this.loadTasks();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterStatus.set('');
    this.filterPriority.set('');
    this.sortBy.set('');
    this.sortDir.set('desc');
    this.loadTasks();
  }

  openTaskModal(): void {
    this.taskForm.reset({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
    this.taskError.set('');
    this.showTaskModal.set(true);
  }

  closeTaskModal(): void {
    this.showTaskModal.set(false);
  }

  onTaskSubmit(): void {
    this.taskForm.markAllAsTouched();
    if (this.taskForm.invalid) return;

    this.creatingTask.set(true);
    this.taskError.set('');

    const value = this.taskForm.getRawValue();
    this.taskService
      .create(this.projectId, {
        title: value.title,
        description: value.description || undefined,
        priority: value.priority,
        dueDate: value.dueDate || undefined,
      })
      .subscribe({
        next: () => {
          this.creatingTask.set(false);
          this.showTaskModal.set(false);
          this.loadTasks();
        },
        error: (err) => {
          this.creatingTask.set(false);
          this.taskError.set(err.error?.message ?? 'Failed to create task');
        },
      });
  }

  changeStatus(taskId: number, newStatus: string): void {
    this.taskService.updateStatus(taskId, { status: newStatus as TaskStatus }).subscribe({
      next: (updatedTask) => {
        this.tasks.update((tasks) => tasks.map((t) => (t.id === taskId ? updatedTask : t)));
      },
      error: () => this.loadTasks(),
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  private loadData(): void {
    this.loading.set(true);
    this.projectService.getById(this.projectId).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loadTasks();
      },
      error: () => this.loading.set(false),
    });
  }

  private loadTasks(): void {
    const filters: TaskFilterParams = {};
    if (this.searchTerm()) filters.search = this.searchTerm();
    if (this.filterStatus()) filters.status = this.filterStatus() as TaskStatus;
    if (this.filterPriority()) filters.priority = this.filterPriority() as TaskPriority;
    if (this.sortBy()) {
      filters.sortBy = this.sortBy();
      filters.sortDir = this.sortDir();
    }

    this.taskService.getByProject(this.projectId, filters).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
