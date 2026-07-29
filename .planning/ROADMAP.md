# Roadmap: Trackr — Milestone 2: Collaboration & UX Features

## Overview

Milestone 2 adds three UX features to the working v1: drag-to-reorder tasks within Kanban columns with DB persistence, a cross-project calendar view for tasks with due dates, and real-time WebSocket notifications for task changes. Each feature maps to its own phase, with backend and frontend work split where they are independently executable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Drag-Sort Backend** - Add `position` field to Task, expose PATCH endpoint, update cross-column behavior
- [ ] **Phase 2: Drag-Sort Frontend** - Remove `cdkDropListSortingDisabled`, wire intra-column reorder to PATCH endpoint
- [ ] **Phase 3: Calendar View** - Build `/calendar` route with month navigation showing tasks by dueDate
- [ ] **Phase 4: WebSocket Infrastructure** - Spring WebSocket + STOMP endpoint with JWT auth on backend
- [ ] **Phase 5: Real-Time Notifications Frontend** - Connect frontend to WebSocket, display task-change toasts

## Phase Details

### Phase 1: Drag-Sort Backend
**Goal**: Backend can store and update per-column task order, cross-column moves default position to end
**Depends on**: Nothing (first phase)
**Requirements**: DRAG-02, DRAG-03, DRAG-04, DRAG-05
**Success Criteria** (what must be TRUE):
  1. `tasks` table has a `position` integer column; existing rows get positions assigned by creation order
  2. `PATCH /api/tasks/{id}/position` with `{ position: int, status: string }` returns 200 and persists the new order
  3. When a task is moved to a different column via existing cross-column drag, its position is set to the end of the target column
  4. All 118 backend tests pass; `position` field is included in TaskResponse DTO
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Foundation: entity, DTO, repository queries, Wave 0 failing test stubs
- [x] 01-02-PLAN.md — Service logic: create/updateStatus/updatePosition position assignment and compaction
- [x] 01-03-PLAN.md — Controller endpoint, DataSeeder positions, full suite green

### Phase 2: Drag-Sort Frontend
**Goal**: Users can drag tasks within a Kanban column and the new order survives page refresh
**Depends on**: Phase 1
**Requirements**: DRAG-01
**Success Criteria** (what must be TRUE):
  1. User can drag a card up or down within a Kanban column; the card drops and re-renders in the new position
  2. After a page refresh, tasks in each column appear in the order last set by drag
  3. Dragging between columns still works and the moved task appears at the bottom of the target column
  4. All 95 frontend tests pass
**Plans**: 1 plan

Plans:
- [x] 02-01-PLAN.md — Implement position-aware drop handler, gap-based calculation, optimistic updates with error recovery

### Phase 3: Calendar View
**Goal**: Users can see all their tasks with due dates on a navigable monthly calendar
**Depends on**: Phase 1
**Requirements**: CAL-01, CAL-02, CAL-03, CAL-04, CAL-05
**Success Criteria** (what must be TRUE):
  1. Sidebar has a "Calendar" link that navigates to `/calendar`
  2. Calendar renders the current month grid; tasks with a dueDate appear on their correct day cell
  3. Clicking a task on the calendar opens the TaskFormModal in edit mode
  4. Previous/Next month buttons navigate the calendar; tasks update to match the displayed month
  5. Tasks without a dueDate do not appear anywhere on the calendar
**Plans**: TBD
**UI hint**: yes

### Phase 4: WebSocket Infrastructure
**Goal**: Backend exposes a secure STOMP/WebSocket endpoint that delivers task-change events to authenticated users
**Depends on**: Phase 1
**Requirements**: NOTIF-01, NOTIF-05
**Success Criteria** (what must be TRUE):
  1. A WebSocket handshake to `/ws` with a valid JWT (query param or STOMP header) succeeds
  2. A connection attempt without a valid JWT is rejected (401/403)
  3. Task create, update, delete, and status-change events are published to the correct user-scoped STOMP topic
  4. All 118 backend tests pass; no regressions in existing auth or task endpoints
**Plans**: TBD

### Phase 5: Real-Time Notifications Frontend
**Goal**: Users receive real-time toast notifications for changes to tasks they own or are assigned to
**Depends on**: Phase 4
**Requirements**: NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-06
**Success Criteria** (what must be TRUE):
  1. App connects to WebSocket automatically after login and disconnects on logout
  2. When another user changes a task assigned to the current user, a toast appears within 2 seconds without a page refresh
  3. Toast type matches event: success for create, info for update/status change, warning for delete
  4. If the connection drops, the app reconnects automatically without user action
  5. All 95 frontend tests pass
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Drag-Sort Backend | 3/3 | COMPLETE | 2026-05-09 |
| 2. Drag-Sort Frontend | 0/1 | Not started | - |
| 3. Calendar View | 0/TBD | Not started | - |
| 4. WebSocket Infrastructure | 0/TBD | Not started | - |
| 5. Real-Time Notifications Frontend | 0/TBD | Not started | - |
