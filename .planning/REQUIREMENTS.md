# Requirements — Trackr Milestone 2

## v1 Requirements (This Milestone)

### Drag-Sort (DRAG)

- [ ] **DRAG-01**: User can drag a task card within a Kanban column to reorder it relative to other tasks in the same column
- [ ] **DRAG-02**: Task order within a column persists after page refresh (stored in database)
- [ ] **DRAG-03**: Task order is preserved independently per column (TODO / IN_PROGRESS / DONE have separate orderings)
- [ ] **DRAG-04**: When a task is moved between columns (existing behavior), its position in the target column defaults to the end
- [ ] **DRAG-05**: Backend exposes a PATCH endpoint to update task position: `PATCH /api/tasks/{id}/position` with `{ position: int, status: string }`

### Calendar (CAL)

- [ ] **CAL-01**: User can navigate to a calendar view at `/calendar` showing all their tasks (cross-project) that have a dueDate
- [ ] **CAL-02**: Tasks appear on the calendar on their dueDate — clicking a task opens the existing TaskFormModal in edit mode
- [ ] **CAL-03**: Calendar supports month navigation (previous / next month)
- [ ] **CAL-04**: Tasks without a dueDate do not appear on the calendar
- [ ] **CAL-05**: Calendar view is accessible from the sidebar navigation alongside Projects, My Tasks, and Dashboard

### Notifications (NOTIF)

- [ ] **NOTIF-01**: Backend establishes a WebSocket endpoint with STOMP at `/ws`
- [ ] **NOTIF-02**: Frontend connects to the WebSocket on login and disconnects on logout
- [ ] **NOTIF-03**: User receives a real-time notification when a task they own or are assigned to is created, updated, deleted, or has its status changed
- [ ] **NOTIF-04**: Notifications are displayed using the existing ToastService (success for create, info for update/status, error/warning for delete)
- [ ] **NOTIF-05**: WebSocket connection requires JWT authentication (token passed as query param or STOMP header)
- [ ] **NOTIF-06**: Frontend handles reconnection automatically if connection drops

## v2 Requirements (Deferred)

- Task-level comments and mentions
- Notification preferences / mute per project
- Calendar with project-scoped filter toggle
- Notifications for member add/remove events
- Notification history / inbox page

## Out of Scope

- Project-scoped calendar — using cross-project My Tasks calendar instead
- Notifications for all project activity — only assigned/owned task events
- OAuth / magic link — separate auth milestone
- Task due-time (time of day) — date only via existing `dueDate: LocalDate`

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| DRAG-01 | Phase 2 | Pending |
| DRAG-02 | Phase 1 | Pending |
| DRAG-03 | Phase 1 | Pending |
| DRAG-04 | Phase 1 | Pending |
| DRAG-05 | Phase 1 | Pending |
| CAL-01 | Phase 3 | Pending |
| CAL-02 | Phase 3 | Pending |
| CAL-03 | Phase 3 | Pending |
| CAL-04 | Phase 3 | Pending |
| CAL-05 | Phase 3 | Pending |
| NOTIF-01 | Phase 4 | Pending |
| NOTIF-02 | Phase 5 | Pending |
| NOTIF-03 | Phase 5 | Pending |
| NOTIF-04 | Phase 5 | Pending |
| NOTIF-05 | Phase 4 | Pending |
| NOTIF-06 | Phase 5 | Pending |
