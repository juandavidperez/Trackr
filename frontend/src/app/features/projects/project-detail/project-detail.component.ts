import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { ProjectResponse, ProjectMember } from '../../../core/models/project.model';
import { TaskRequest, TaskResponse, TaskStatus } from '../../../core/models/task.model';
import { TaskFormModalComponent } from '../../../shared/components/task-form-modal/task-form-modal.component';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, NgClass, TaskFormModalComponent],
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
      select.status-select {
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
            (click)="openCreateTask()"
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

        <!-- Task Board -->
        <div class="mt-8 grid gap-6 lg:grid-cols-3">
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
                    class="group/card animate-fade-in-up rounded-lg border border-zinc-800/40 bg-zinc-950/60 p-4 transition-all hover:border-zinc-700/60"
                    [style.animation-delay]="i * 50 + 'ms'"
                  >
                    <!-- Title + Edit button -->
                    <div class="flex items-start justify-between gap-2">
                      <p class="text-sm font-medium text-zinc-200">{{ task.title }}</p>
                      <button
                        (click)="openEditTask(task)"
                        class="shrink-0 rounded p-1 text-zinc-700 opacity-0 transition-all hover:bg-zinc-800 hover:text-zinc-400 group-hover/card:opacity-100"
                        title="Edit task"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                          />
                        </svg>
                      </button>
                    </div>

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
                        class="status-select rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-400 transition-colors focus:border-indigo-500 focus:outline-none"
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

      <!-- Task Form Modal -->
      <app-task-form-modal
        [visible]="showTaskModal()"
        [mode]="taskModalMode()"
        [task]="editingTask()"
        [members]="members()"
        [loading]="savingTask()"
        [error]="taskError()"
        (save)="onTaskSave($event)"
        (close)="closeTaskModal()"
      />
    </div>
  `,
})
export class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);

  readonly loading = signal(true);
  readonly project = signal<ProjectResponse | null>(null);
  readonly tasks = signal<TaskResponse[]>([]);
  readonly members = signal<ProjectMember[]>([]);
  readonly showTaskModal = signal(false);
  readonly taskModalMode = signal<'create' | 'edit'>('create');
  readonly editingTask = signal<TaskResponse | null>(null);
  readonly savingTask = signal(false);
  readonly taskError = signal('');

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

  private projectId = 0;

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadData();
  }

  openCreateTask(): void {
    this.editingTask.set(null);
    this.taskModalMode.set('create');
    this.taskError.set('');
    this.showTaskModal.set(true);
  }

  openEditTask(task: TaskResponse): void {
    this.editingTask.set(task);
    this.taskModalMode.set('edit');
    this.taskError.set('');
    this.showTaskModal.set(true);
  }

  closeTaskModal(): void {
    this.showTaskModal.set(false);
  }

  onTaskSave(request: TaskRequest): void {
    this.savingTask.set(true);
    this.taskError.set('');

    const obs =
      this.taskModalMode() === 'edit'
        ? this.taskService.update(this.editingTask()!.id, request)
        : this.taskService.create(this.projectId, request);

    obs.subscribe({
      next: () => {
        this.savingTask.set(false);
        this.showTaskModal.set(false);
        this.loadTasks();
      },
      error: (err) => {
        this.savingTask.set(false);
        this.taskError.set(err.error?.message ?? 'Failed to save task');
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
        this.loadMembers();
      },
      error: () => this.loading.set(false),
    });
  }

  private loadTasks(): void {
    this.taskService.getByProject(this.projectId).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadMembers(): void {
    this.projectService.getMembers(this.projectId).subscribe({
      next: (members) => this.members.set(members),
      error: () => this.members.set([]),
    });
  }
}
