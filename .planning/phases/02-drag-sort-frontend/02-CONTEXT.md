# Phase 2: Drag-Sort Frontend - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable intra-column task reordering in the Kanban board. Remove `cdkDropListSortingDisabled` from all columns, implement position-aware drop handler that communicates with backend `/api/tasks/{id}/position` endpoint, and ensure tasks persist their order across page refreshes.

</domain>

<decisions>
## Implementation Decisions

### UI Update Strategy
- **D-01:** Use optimistic updates. On drop, immediately reorder the card in local signal. Call backend in background. Revert locally if request fails.
- **D-02:** While position update is in-flight, show subtle disabled state on the card (dim opacity or light spinner). This gives user visual assurance the drag was registered.

### Position Calculation (Frontend-Driven)
- **D-03:** Frontend calculates the new position number using gap-based logic:
  - Moving to start of column: `min(existing positions) / 2` (e.g., 500 if existing = [0, 1000, 2000])
  - Moving between two cards: `(prev.position + next.position) / 2` (e.g., 1500 between 1000 and 2000)
  - Moving to end of column: `max(existing positions) + 1000`
- **D-04:** When gap < 1 (adjacent positions), frontend calculates fractional middle anyway (e.g., 1500.5). Backend detects this, triggers automatic compaction of the column, and applies the position update after compaction.
- **D-05:** After backend returns updated TaskResponse, verify the task's position field matches what was sent. If order in response differs from local expectation, log warning and show info toast: "Task order synced from server."

### Endpoint Choice (Unified Path)
- **D-06:** All drops (intra-column reorders AND cross-column moves) call `PATCH /api/tasks/{id}/position` endpoint with body: `{ "position": number, "status": string }`.
- **D-07:** Intra-column drops send the same status (no change). Cross-column drops send the new status. Backend handles both cases identically.
- **D-08:** This simplifies handler logic: one `onTaskDrop` method, one endpoint call, one error path.

### Error Handling
- **D-09:** On position update failure (network error, 400, 403, 500):
  - Revert the card's position locally in the signal.
  - Show error toast: "Failed to reorder task. Try again."
  - Do NOT reload all tasks (preserves other local UI state).
  - Card becomes draggable again immediately.
- **D-10:** Treat 409 Conflict (concurrent edit, if backend returns it) same as 500 — revert locally and let user retry.

### Unchanged Behaviors
- **D-11:** Dragging between columns still works as before (cross-column move). The handler now sends this via `/position` instead of `/status`.
- **D-12:** No new fields added to TaskResponse — backend already includes `position` from Phase 1.
- **D-13:** Task list order on page load comes from backend (tasks array is already sorted by position from `GET /api/projects/{id}/tasks`). No client-side re-sort needed.

### Claude's Discretion
- Animation during drop: may use CDK's existing drag animation (no change).
- Loading skeleton: no changes to existing loading state.
- Debouncing: no debounce needed (CDK drop is a discrete event, not a stream).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Key Files (read before planning)
- `frontend/src/app/features/projects/project-detail/project-detail.component.ts` — Kanban board template and `onTaskDrop` handler to extend
- `frontend/src/app/core/services/task.service.ts` — add `updatePosition` method
- `frontend/src/app/core/models/task.model.ts` — TaskResponse already includes `position` from Phase 1
- `.planning/phases/01-drag-sort-backend/01-CONTEXT.md` — Phase 1 decisions on gap-based positioning and compaction

### Related Files
- `frontend/src/app/features/projects/project-detail/project-detail.component.spec.ts` — tests for drop handler

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Patterns
- `onTaskDrop(event: CdkDragDrop<TaskStatus>)` handler already exists — extend it to handle intra-column reorders.
- `this.tasks.update(...)` pattern already used for optimistic status updates — reuse for position updates.
- Error toast pattern: `this.toast.error(msg)` — reuse for position update failures.
- `recentlyDroppedIds` signal — use to suppress fade-in animation on dropped cards.

### Integration Points
- TaskService: add `updatePosition(taskId: number, request: TaskPositionRequest): Observable<TaskResponse>` method (follows same pattern as `updateStatus`).
- Must import/define `TaskPositionRequest` DTO (backend already has this in Phase 1).
- `cdkDropListSortingDisabled` attribute on all three drop lists must be removed to enable intra-column sorting.
- CDK already provides target column and index on drop — use CDK's `moveItemInArray` utility or manual array splice to reorder local signal.

### Position Calculation Helper
- Create private method to calculate new position: `calculateDropPosition(prevIndex: number, nextIndex: number, tasks: TaskResponse[]): number`
- Takes the cards that will be adjacent after drop, returns the middle position number.

</code_context>

<specifics>
## Specific Ideas

- Since CDK provides index from `event.currentIndex` after drop, use that to find adjacent cards and calculate position.
- Gap-based math is same for all three columns (TODO, IN_PROGRESS, DONE) — one calculation method works everywhere.
- Revert path: on error, use `CDK moveItemInArray` in reverse OR filter and splice the tasks array back to previous state.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-drag-sort-frontend*
*Context gathered: 2026-05-09*
