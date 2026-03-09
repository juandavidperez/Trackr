import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Subject, debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProjectMember, ProjectResponse } from '../../../core/models/project.model';
import { TaskFilterParams, TaskPriority, TaskRequest, TaskResponse, TaskStatus } from '../../../core/models/task.model';
import { TaskFormModalComponent } from '../../../shared/components/task-form-modal/task-form-modal.component';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, NgClass, ReactiveFormsModule, CdkDropList, CdkDrag, TaskFormModalComponent],
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
      .cdk-drag-preview {
        border-radius: 0.5rem;
        border: 1px solid rgba(99, 102, 241, 0.4);
        background: rgba(24, 24, 27, 0.95);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        transform: rotate(2deg);
      }
      .cdk-drag-placeholder {
        border-radius: 0.5rem;
        border: 2px dashed rgba(99, 102, 241, 0.3);
        background: rgba(99, 102, 241, 0.05);
        min-height: 80px;
        transition: all 0.2s ease;
      }
      .cdk-drag-placeholder * {
        visibility: hidden;
      }
      .cdk-drag-animating {
        transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
      }
      .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
        transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
      }
      .board-scroll {
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: rgba(63, 63, 70, 0.4) transparent;
      }
      .board-scroll::-webkit-scrollbar {
        height: 6px;
      }
      .board-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .board-scroll::-webkit-scrollbar-thumb {
        background: rgba(63, 63, 70, 0.4);
        border-radius: 3px;
      }
      @media (max-width: 1023px) {
        .board-scroll {
          scroll-snap-type: x mandatory;
        }
        .board-col {
          scroll-snap-align: start;
        }
      }
    `,
  ],
  template: `
    <div class="animate-fade-in">
      <!-- Loading skeleton -->
      @if (loading()) {
        <div>
          <!-- Header skeleton -->
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div class="h-4 w-28 animate-pulse rounded bg-zinc-800/60"></div>
              <div class="mt-3 h-7 w-56 animate-pulse rounded bg-zinc-800"></div>
              <div class="mt-2 h-4 w-80 animate-pulse rounded bg-zinc-800/40"></div>
            </div>
            <div class="flex gap-2">
              <div class="h-10 w-28 animate-pulse rounded-lg bg-zinc-800/60"></div>
              <div class="h-10 w-28 animate-pulse rounded-lg bg-zinc-800/60"></div>
            </div>
          </div>

          <!-- Filter bar skeleton -->
          <div class="mt-6 flex flex-col gap-3 sm:flex-row">
            <div class="h-10 w-full animate-pulse rounded-lg bg-zinc-800/40 sm:w-64"></div>
            <div class="flex gap-3">
              <div class="h-10 w-full animate-pulse rounded-lg bg-zinc-800/40 sm:w-32"></div>
              <div class="h-10 w-full animate-pulse rounded-lg bg-zinc-800/40 sm:w-32"></div>
            </div>
          </div>

          <!-- Kanban columns skeleton -->
          <div class="board-scroll mt-6 flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
            @for (col of [1, 2, 3]; track col) {
              <div class="board-col w-[280px] shrink-0 rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4 lg:w-auto lg:shrink">
                <div class="mb-4 flex items-center justify-between">
                  <div class="h-5 w-24 animate-pulse rounded bg-zinc-800"></div>
                  <div class="h-5 w-6 animate-pulse rounded-full bg-zinc-800/60"></div>
                </div>
                @for (card of col === 2 ? [1, 2] : [1, 2, 3]; track card) {
                  <div class="mb-3 rounded-lg border border-zinc-800/40 bg-zinc-900/50 p-4">
                    <div class="h-4 w-3/4 animate-pulse rounded bg-zinc-800"></div>
                    <div class="mt-3 flex items-center gap-2">
                      <div class="h-5 w-14 animate-pulse rounded-full bg-zinc-800/40"></div>
                      <div class="h-5 w-16 animate-pulse rounded-full bg-zinc-800/40"></div>
                    </div>
                    <div class="mt-3 flex items-center justify-between">
                      <div class="h-3 w-20 animate-pulse rounded bg-zinc-800/30"></div>
                      <div class="h-6 w-6 animate-pulse rounded-full bg-zinc-800/40"></div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      @if (!loading() && project()) {
        <!-- Breadcrumbs -->
        <nav class="flex items-center gap-1.5 text-sm">
          <a routerLink="/dashboard" class="text-zinc-600 transition-colors hover:text-zinc-400">Dashboard</a>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
          </svg>
          <a routerLink="/projects" class="text-zinc-600 transition-colors hover:text-zinc-400">Projects</a>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
          </svg>
          <span class="text-zinc-400">{{ project()!.name }}</span>
        </nav>

        <!-- Header -->
        <div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-white">
              {{ project()!.name }}
            </h1>
            @if (project()!.description) {
              <p class="mt-1 max-w-2xl text-sm text-zinc-500">{{ project()!.description }}</p>
            }
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button
              (click)="showMembersPanel.set(!showMembersPanel())"
              class="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50 hover:text-zinc-200"
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
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
              Members
              <span
                class="rounded-full bg-zinc-800 px-1.5 py-0.5 text-xs font-medium text-zinc-500"
              >
                {{ members().length }}
              </span>
            </button>
            <button
              (click)="openCreateTask()"
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
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              New Task
            </button>
          </div>
        </div>

        <!-- Members Panel -->
        @if (showMembersPanel()) {
          <div
            class="mt-6 rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-5 animate-fade-in-up"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-white">Project Members</h3>
              <button
                (click)="showMembersPanel.set(false)"
                class="rounded p-1 text-zinc-600 transition-colors hover:text-zinc-400"
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
              </button>
            </div>

            <!-- Owner -->
            <div class="mt-4 space-y-2">
              <div
                class="flex items-center justify-between rounded-lg border border-zinc-800/40 bg-zinc-950/40 px-4 py-3"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-semibold text-indigo-400"
                  >
                    {{ getInitials(project()!.ownerName) }}
                  </span>
                  <div>
                    <p class="text-sm font-medium text-zinc-200">{{ project()!.ownerName }}</p>
                    <p class="text-xs text-zinc-600">{{ project()!.ownerEmail }}</p>
                  </div>
                </div>
                <span
                  class="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-400"
                >
                  Owner
                </span>
              </div>

              <!-- Members list -->
              @for (member of members(); track member.id) {
                <div
                  class="flex items-center justify-between rounded-lg border border-zinc-800/40 bg-zinc-950/40 px-4 py-3"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700/30 text-xs font-semibold text-zinc-400"
                    >
                      {{ getInitials(member.name) }}
                    </span>
                    <div>
                      <p class="text-sm font-medium text-zinc-200">{{ member.name }}</p>
                      <p class="text-xs text-zinc-600">{{ member.email }}</p>
                    </div>
                  </div>
                  @if (isOwner()) {
                    <button
                      (click)="removeMember(member.id)"
                      class="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      title="Remove member"
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
                          d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                        />
                      </svg>
                    </button>
                  }
                </div>
              } @empty {
                <p class="py-2 text-center text-xs text-zinc-700">No additional members</p>
              }
            </div>

            <!-- Add member form -->
            @if (isOwner()) {
              <form
                [formGroup]="addMemberForm"
                (ngSubmit)="onAddMember()"
                class="mt-4 flex gap-2"
              >
                <input
                  type="email"
                  formControlName="email"
                  placeholder="Add member by email..."
                  class="block flex-1 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                />
                <button
                  type="submit"
                  [disabled]="addMemberForm.invalid || addingMember()"
                  class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  @if (addingMember()) {
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
                  } @else {
                    Add
                  }
                </button>
              </form>
              @if (memberError()) {
                <p class="mt-2 text-xs text-red-400">{{ memberError() }}</p>
              }
              @if (memberSuccess()) {
                <p class="mt-2 text-xs text-emerald-400">{{ memberSuccess() }}</p>
              }
            }
          </div>
        }

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

        <!-- Task Board -->
        <div class="board-scroll mt-6 flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
          @for (col of columns(); track col.status) {
            <div class="board-col w-[280px] shrink-0 rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-4 lg:w-auto lg:shrink">
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
              <div
                class="space-y-3 min-h-[60px]"
                cdkDropList
                [id]="'col-' + col.status"
                [cdkDropListData]="col.status"
                [cdkDropListConnectedTo]="['col-TODO', 'col-IN_PROGRESS', 'col-DONE']"
                (cdkDropListDropped)="onTaskDrop($event)"
              >
                @for (task of col.tasks; track task.id; let i = $index) {
                  <div
                    cdkDrag
                    [cdkDragData]="task"
                    class="group/card animate-fade-in-up cursor-grab rounded-lg border border-zinc-800/40 bg-zinc-950/60 p-4 transition-all hover:border-zinc-700/60 active:cursor-grabbing"
                    [style.animation-delay]="i * 50 + 'ms'"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <p class="min-w-0 break-words text-sm font-medium text-zinc-200">{{ task.title }}</p>
                      <button
                        (click)="openEditTask(task)"
                        class="shrink-0 rounded p-1 text-zinc-700 opacity-0 transition-all hover:bg-zinc-800 hover:text-zinc-400 group-hover/card:opacity-100"
                        title="Edit task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
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
                        <span class="flex min-w-0 items-center gap-1.5 text-xs text-zinc-500">
                          <span
                            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-[10px] font-semibold text-indigo-400"
                          >
                            {{ getInitials(task.assigneeName) }}
                          </span>
                          <span class="truncate">{{ task.assigneeName }}</span>
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
                  <div class="flex flex-col items-center py-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" viewBox="0 0 56 56" fill="none">
                      <!-- Clipboard -->
                      <rect x="14" y="8" width="28" height="38" rx="4" class="fill-zinc-800/40 stroke-zinc-700/30" stroke-width="1.2"/>
                      <rect x="20" y="4" width="16" height="8" rx="3" class="fill-zinc-800/60 stroke-zinc-700/40" stroke-width="1.2"/>
                      <!-- Lines -->
                      <rect x="20" y="20" width="16" height="2" rx="1" class="fill-zinc-700/40"/>
                      <rect x="20" y="26" width="12" height="2" rx="1" class="fill-zinc-700/30"/>
                      <rect x="20" y="32" width="14" height="2" rx="1" class="fill-zinc-700/20"/>
                    </svg>
                    <p class="mt-2 text-xs text-zinc-600">No tasks here</p>
                  </div>
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
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly project = signal<ProjectResponse | null>(null);
  readonly tasks = signal<TaskResponse[]>([]);
  readonly members = signal<ProjectMember[]>([]);
  readonly showTaskModal = signal(false);
  readonly taskModalMode = signal<'create' | 'edit'>('create');
  readonly editingTask = signal<TaskResponse | null>(null);
  readonly savingTask = signal(false);
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

  // Member management state
  readonly showMembersPanel = signal(false);
  readonly addingMember = signal(false);
  readonly memberError = signal('');
  readonly memberSuccess = signal('');

  readonly isOwner = computed(
    () => this.authService.currentUser()?.email === this.project()?.ownerEmail,
  );

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

  readonly addMemberForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
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

  // -- Filter methods --

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

  // -- Member management --

  onAddMember(): void {
    this.addMemberForm.markAllAsTouched();
    if (this.addMemberForm.invalid) return;

    this.addingMember.set(true);
    this.memberError.set('');
    this.memberSuccess.set('');

    const email = this.addMemberForm.getRawValue().email;
    this.projectService.addMember(this.projectId, { email }).subscribe({
      next: () => {
        this.addingMember.set(false);
        this.addMemberForm.reset();
        this.memberSuccess.set(`${email} has been added to the project`);
        this.toast.success(`${email} added to the project`);
        this.loadMembers();
      },
      error: (err) => {
        this.addingMember.set(false);
        const msg = err.error?.message ?? 'Failed to add member';
        this.memberError.set(msg);
        this.toast.error(msg);
      },
    });
  }

  removeMember(userId: number): void {
    this.memberError.set('');
    this.memberSuccess.set('');
    this.projectService.removeMember(this.projectId, userId).subscribe({
      next: () => {
        this.toast.success('Member removed');
        this.loadMembers();
      },
      error: (err) => {
        const msg = err.error?.message ?? 'Failed to remove member';
        this.memberError.set(msg);
        this.toast.error(msg);
      },
    });
  }

  // -- Task management --

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

    const isEdit = this.taskModalMode() === 'edit';
    obs.subscribe({
      next: () => {
        this.savingTask.set(false);
        this.showTaskModal.set(false);
        this.toast.success(isEdit ? 'Task updated' : 'Task created');
        this.loadTasks();
      },
      error: (err) => {
        this.savingTask.set(false);
        const msg = err.error?.message ?? 'Failed to save task';
        this.taskError.set(msg);
        this.toast.error(msg);
      },
    });
  }

  onTaskDrop(event: CdkDragDrop<TaskStatus>): void {
    const task: TaskResponse = event.item.data;
    const newStatus = event.container.data;
    if (task.status === newStatus) return;

    // Optimistic update: move task immediately in UI
    this.tasks.update((tasks) =>
      tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
    );

    this.taskService.updateStatus(task.id, { status: newStatus }).subscribe({
      next: (updatedTask) => {
        this.tasks.update((tasks) => tasks.map((t) => (t.id === task.id ? updatedTask : t)));
      },
      error: () => {
        this.toast.error('Failed to update task status');
        this.loadTasks();
      },
    });
  }

  changeStatus(taskId: number, newStatus: string): void {
    this.taskService.updateStatus(taskId, { status: newStatus as TaskStatus }).subscribe({
      next: (updatedTask) => {
        this.tasks.update((tasks) => tasks.map((t) => (t.id === taskId ? updatedTask : t)));
      },
      error: () => {
        this.toast.error('Failed to update task status');
        this.loadTasks();
      },
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
        this.titleService.setTitle(`${project.name} - Trackr`);
        this.loadTasks();
        this.loadMembers();
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
      filters.sort = `${this.sortBy()},${this.sortDir()}`;
    }
    filters.size = 100;

    this.taskService.getByProject(this.projectId, filters).subscribe({
      next: (page) => {
        this.tasks.set(page.content);
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
