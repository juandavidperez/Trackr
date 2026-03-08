import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskPriority, TaskRequest, TaskResponse, TaskStatus } from '../../../core/models/task.model';
import { ProjectMember } from '../../../core/models/project.model';

@Component({
  selector: 'app-task-form-modal',
  imports: [ReactiveFormsModule],
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
    @if (visible()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" (click)="onClose()"></div>

        <div
          class="relative w-full max-w-lg rounded-xl border border-zinc-800/60 bg-zinc-950 p-6 shadow-2xl animate-fade-in-up"
        >
          <h2 class="text-lg font-semibold text-white">{{ heading() }}</h2>
          <p class="mt-1 text-sm text-zinc-500">{{ subheading() }}</p>

          @if (error()) {
            <div
              class="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ error() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-6 space-y-4">
            <!-- Title -->
            <div>
              <label for="taskTitle" class="mb-1.5 block text-sm font-medium text-zinc-300"
                >Title</label
              >
              <input
                id="taskTitle"
                type="text"
                formControlName="title"
                class="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                placeholder="e.g. Design landing page mockup"
              />
              @if (form.get('title')?.touched && form.get('title')?.hasError('required')) {
                <p class="mt-1.5 text-xs text-red-400">Title is required</p>
              }
            </div>

            <!-- Description -->
            <div>
              <label for="taskDesc" class="mb-1.5 block text-sm font-medium text-zinc-300"
                >Description</label
              >
              <textarea
                id="taskDesc"
                formControlName="description"
                rows="3"
                class="block w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                placeholder="Describe the task..."
              ></textarea>
            </div>

            <!-- Status + Priority -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="taskStatus" class="mb-1.5 block text-sm font-medium text-zinc-300"
                  >Status</label
                >
                <select
                  id="taskStatus"
                  formControlName="status"
                  class="styled-select block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                >
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div>
                <label for="taskPriority" class="mb-1.5 block text-sm font-medium text-zinc-300"
                  >Priority</label
                >
                <select
                  id="taskPriority"
                  formControlName="priority"
                  class="styled-select block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <!-- Assignee + Due Date -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="taskAssignee" class="mb-1.5 block text-sm font-medium text-zinc-300"
                  >Assignee</label
                >
                <select
                  id="taskAssignee"
                  formControlName="assigneeId"
                  class="styled-select block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                >
                  <option [ngValue]="null">Unassigned</option>
                  @for (member of members(); track member.id) {
                    <option [ngValue]="member.id">{{ member.name }}</option>
                  }
                </select>
              </div>

              <div>
                <label for="taskDueDate" class="mb-1.5 block text-sm font-medium text-zinc-300"
                  >Due date</label
                >
                <input
                  id="taskDueDate"
                  type="date"
                  formControlName="dueDate"
                  class="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                />
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                (click)="onClose()"
                class="rounded-lg border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="form.invalid || loading()"
                class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                @if (loading()) {
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
                  Saving...
                } @else {
                  {{ isEdit() ? 'Update Task' : 'Create Task' }}
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class TaskFormModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly visible = input(false);
  readonly mode = input<'create' | 'edit'>('create');
  readonly task = input<TaskResponse | null>(null);
  readonly members = input<ProjectMember[]>([]);
  readonly loading = input(false);
  readonly error = input('');

  readonly save = output<TaskRequest>();
  readonly close = output<void>();

  readonly isEdit = computed(() => this.mode() === 'edit');
  readonly heading = computed(() => (this.isEdit() ? 'Edit Task' : 'Create Task'));
  readonly subheading = computed(() =>
    this.isEdit() ? 'Update the task details' : 'Add a new task to this project',
  );

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', Validators.maxLength(1000)],
    status: ['TODO' as string],
    priority: ['MEDIUM' as string],
    assigneeId: [null as number | null],
    dueDate: [''],
  });

  constructor() {
    effect(() => {
      const visible = this.visible();
      const task = this.task();
      if (!visible) return;

      if (task) {
        const assigneeId = this.members().find((m) => m.name === task.assigneeName)?.id ?? null;
        this.form.setValue({
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          priority: task.priority,
          assigneeId,
          dueDate: task.dueDate ?? '',
        });
      } else {
        this.form.reset({
          title: '',
          description: '',
          status: 'TODO',
          priority: 'MEDIUM',
          assigneeId: null,
          dueDate: '',
        });
      }
    });
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    this.save.emit({
      title: v.title!,
      description: v.description || undefined,
      status: v.status as TaskStatus,
      priority: v.priority as TaskPriority,
      assigneeId: v.assigneeId ?? undefined,
      dueDate: v.dueDate || undefined,
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
