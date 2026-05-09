# Trackr — Milestone 2: Collaboration & UX Features

## What This Is

Trackr is a full-stack project management app with Kanban boards, team collaboration, and task tracking, built with Angular 21 + Spring Boot 3. This milestone adds three UX features to an already working v1: drag-to-reorder tasks within Kanban columns, a cross-project calendar view for tasks with due dates, and real-time task-change notifications via WebSockets.

## Core Value

Tasks can be prioritized visually and in real time — reordering sticks, deadlines are visible on a calendar, and collaborators see changes instantly.

## Requirements

### Validated

- ✓ User can register and log in with JWT auth — existing
- ✓ User can create/edit/delete projects — existing
- ✓ User can create/edit/delete tasks with status (TODO/IN_PROGRESS/DONE) and priority (LOW/MEDIUM/HIGH) — existing
- ✓ User can drag tasks between Kanban columns (cross-column) — existing
- ✓ User can filter and search tasks — existing
- ✓ User can manage project members — existing
- ✓ User can view dashboard with task stats — existing
- ✓ Tasks have a dueDate field (backend + frontend model) — existing

### Active

- [ ] User can drag tasks within a column to reorder them, and order persists after page refresh
- [ ] User can view all their tasks (cross-project) on a calendar grouped by dueDate
- [ ] User receives real-time notifications for task changes (create/update/delete/status) on tasks they own or are assigned to

### Out of Scope

- Task comments — deferred to future milestone
- OAuth / magic link login — deferred
- Calendar for project-scoped tasks only — using cross-project (my tasks) view instead
- Notifications for all project activity — only task-change events for assigned/owned tasks

## Context

**Existing codebase:** Angular 21 (standalone components, signals, CDK drag-drop), Spring Boot 3 (JWT stateless, Spring Data JPA, PostgreSQL). Angular CDK drag-drop already installed — `cdkDropListSortingDisabled` is active on all 3 Kanban columns, preventing intra-column reorder. Task model has `dueDate: LocalDate` on backend and `dueDate?: string` on frontend. No WebSocket infrastructure exists anywhere.

**Deployment:** Frontend on Netlify (static, `outputMode: static`), backend on Render, DB on Supabase PostgreSQL. WebSocket support on Render is available (not serverless).

**Test suite:** 95 frontend tests (Vitest), 118 backend tests (JUnit 5 + Mockito). All tests must pass after each phase.

## Constraints

- **Tech stack**: Angular 21 + Spring Boot 3 — no framework changes
- **Testing**: Vitest for frontend (NOT fakeAsync/tick), JUnit 5 + Mockito for backend
- **SSR**: `RenderMode.Client` — no SSR; guard localStorage with `isPlatformBrowser()`
- **CDK**: Hardcode drop list columns (not `@for` over signal) to keep DOM nodes stable
- **WebSockets**: Spring WebSocket + STOMP on backend; `@stomp/stompjs` on frontend

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Persist task position in DB via `position: int` field | User expects order to survive refresh | — Pending |
| Cross-project calendar (My Tasks scope) | Simpler data source — reuses TaskService | — Pending |
| Spring WebSocket + STOMP (not raw WS) | Native Spring support, works with existing security | — Pending |
| Notify only assigned/owned tasks | Reduces noise; project-wide activity is too broad for MVP | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-09 after Milestone 2 initialization*
