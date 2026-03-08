import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { ProjectResponse } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-list',
  imports: [RouterLink, ReactiveFormsModule],
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
    `,
  ],
  template: `
    <div class="animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-white">Projects</h1>
          <p class="mt-1 text-sm text-zinc-500">Manage and organize your team's work</p>
        </div>
        <button
          (click)="openModal()"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:outline-none"
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
          New Project
        </button>
      </div>

      <!-- Loading skeletons -->
      @if (loading()) {
        <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          @for (i of [1, 2, 3]; track i) {
            <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6">
              <div class="h-5 w-2/3 animate-pulse rounded bg-zinc-800"></div>
              <div class="mt-3 h-4 w-full animate-pulse rounded bg-zinc-800/60"></div>
              <div class="mt-2 h-4 w-4/5 animate-pulse rounded bg-zinc-800/60"></div>
              <div class="mt-6 flex gap-4">
                <div class="h-4 w-16 animate-pulse rounded bg-zinc-800/40"></div>
                <div class="h-4 w-20 animate-pulse rounded bg-zinc-800/40"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && projects().length === 0) {
        <div class="mt-16 flex flex-col items-center justify-center text-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              />
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-semibold text-white">No projects yet</h3>
          <p class="mt-1 text-sm text-zinc-500">Create your first project to get started</p>
          <button
            (click)="openModal()"
            class="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500"
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
            Create Project
          </button>
        </div>
      }

      <!-- Project cards -->
      @if (!loading() && projects().length > 0) {
        <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          @for (project of projects(); track project.id; let i = $index) {
            <a
              [routerLink]="['/projects', project.id]"
              class="group relative rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6 transition-all duration-200 hover:border-zinc-700/80 hover:bg-zinc-900/60 animate-fade-in-up"
              [style.animation-delay]="i * 60 + 'ms'"
            >
              <h3
                class="text-base font-semibold text-white transition-colors group-hover:text-indigo-400"
              >
                {{ project.name }}
              </h3>

              @if (project.description) {
                <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">
                  {{ project.description }}
                </p>
              }

              <div class="mt-5 flex items-center gap-4 text-xs text-zinc-600">
                <span class="flex items-center gap-1.5">
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
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                  {{ project.memberCount }} {{ project.memberCount === 1 ? 'member' : 'members' }}
                </span>
                <span class="text-zinc-800">&middot;</span>
                <span>{{ project.ownerName }}</span>
              </div>

              <!-- Arrow -->
              <div
                class="absolute right-6 top-6 text-zinc-700 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400"
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
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </div>
            </a>
          }
        </div>
      }

      <!-- Create Project Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" (click)="closeModal()"></div>

          <div
            class="relative w-full max-w-md rounded-xl border border-zinc-800/60 bg-zinc-950 p-6 shadow-2xl animate-fade-in-up"
          >
            <h2 class="text-lg font-semibold text-white">Create Project</h2>
            <p class="mt-1 text-sm text-zinc-500">Add a new project to your workspace</p>

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
              <div>
                <label for="name" class="mb-1.5 block text-sm font-medium text-zinc-300"
                  >Project name</label
                >
                <input
                  id="name"
                  type="text"
                  formControlName="name"
                  class="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                  placeholder="e.g. Marketing Website Redesign"
                />
                @if (form.get('name')?.touched && form.get('name')?.hasError('required')) {
                  <p class="mt-1.5 text-xs text-red-400">Project name is required</p>
                }
              </div>

              <div>
                <label for="description" class="mb-1.5 block text-sm font-medium text-zinc-300"
                  >Description</label
                >
                <textarea
                  id="description"
                  formControlName="description"
                  rows="3"
                  class="block w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                  placeholder="What's this project about?"
                ></textarea>
              </div>

              <div class="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  (click)="closeModal()"
                  class="rounded-lg border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="form.invalid || creating()"
                  class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  @if (creating()) {
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
                    Create Project
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
export class ProjectListComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly projects = signal<ProjectResponse[]>([]);
  readonly showModal = signal(false);
  readonly creating = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', Validators.maxLength(1000)],
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  openModal(): void {
    this.form.reset();
    this.error.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.creating.set(true);
    this.error.set('');

    this.projectService.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.creating.set(false);
        this.showModal.set(false);
        this.loadProjects();
      },
      error: (err) => {
        this.creating.set(false);
        this.error.set(err.error?.message ?? 'Failed to create project');
      },
    });
  }

  private loadProjects(): void {
    this.loading.set(true);
    this.projectService.getAll().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
