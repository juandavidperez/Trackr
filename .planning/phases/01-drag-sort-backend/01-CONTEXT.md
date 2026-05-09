# Phase 1: Drag-Sort Backend - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Add backend support for per-column task ordering: add `position` integer column to the `tasks` table, expose `PATCH /api/tasks/{id}/position` to update a task's position within or across columns, and update the existing `PATCH /api/tasks/{id}/status` endpoint to auto-assign position when a task moves to a different column. No frontend changes.

</domain>

<decisions>
## Implementation Decisions

### Position Numbering
- **D-01:** Use gap-based integers (0, 1000, 2000, …). Only the moved task is updated — no cascade writes on reorder.
- **D-02:** Initial gap size = 1000. New tasks appended to a column get `max(position) + 1000`.
- **D-03:** Compaction trigger: when inserting between two tasks would produce a gap < 1 (i.e., positions are adjacent integers), reindex the entire column back to multiples of 1000.
- **D-04:** Migration assigns initial positions using `createdAt ASC` order within each `(project_id, status)` group, spaced 1000 apart (0, 1000, 2000, …).

### List Endpoint Ordering
- **D-05:** `GET /api/projects/{id}/tasks` default sort changes to `position ASC` within each status group. Frontend Kanban receives tasks already ordered — no explicit sort param needed.
- **D-06:** `GET /api/tasks/me` (My Tasks) keeps its existing sort unchanged. Position ordering across projects and columns is not meaningful for that view.

### Cross-Column Move Behavior
- **D-07:** The existing `PATCH /api/tasks/{id}/status` endpoint is updated to automatically set the task's position to the end of the target column (i.e., `max(position in target column) + 1000`). Cross-column drags call this single endpoint.
- **D-08:** The new `PATCH /api/tasks/{id}/position` endpoint handles intra-column reorders AND can also handle cross-column moves when the caller passes a `status` field. Both endpoints correctly maintain position.

### PATCH /position Endpoint Contract
- **D-09:** `PATCH /api/tasks/{id}/position` body: `{ "position": int, "status": string }` as specified in DRAG-05. Returns updated `TaskResponse` (200). `position` field must be included in `TaskResponse`.

### Claude's Discretion
- Concurrency: last-write-wins (no optimistic locking needed at this scale).
- Error handling: follow existing patterns (`ResourceNotFoundException` / `AccessDeniedException`).
- Authorization: same member-of-project check as `updateStatus`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above. Read project codebase files directly.

### Key Files (read before planning)
- `backend/src/main/java/com/trackr/model/Task.java` — entity to extend with `position` field
- `backend/src/main/java/com/trackr/controller/TaskController.java` — endpoint to extend
- `backend/src/main/java/com/trackr/service/TaskService.java` — service logic to extend
- `backend/src/main/java/com/trackr/repository/TaskRepository.java` — JPQL queries to update
- `backend/src/main/java/com/trackr/dto/TaskResponse.java` — DTO to extend with `position`
- `backend/src/main/java/com/trackr/dto/TaskStatusRequest.java` — existing cross-column DTO
- `.planning/REQUIREMENTS.md` — DRAG-02 through DRAG-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TaskStatusRequest.java` — existing DTO for `/status` PATCH; new `TaskPositionRequest` DTO follows same pattern
- `@Transactional` + `taskRepository.save(task)` pattern in `TaskService` — reuse for position update
- `requireMember()` helper — reuse for authorization in new endpoint

### Established Patterns
- PATCH endpoints return `TaskResponse` with 200 — `/position` follows the same convention
- JPQL in `TaskRepository` — position-aware queries added the same way
- Lombok `@Getter @Setter` on entities — add `position` field with same annotations

### Integration Points
- `TaskResponse` constructor (all-args via Lombok) needs `position` added as a field — all callers that build `TaskResponse` via `toResponse()` in `TaskService` will be updated in one place
- Migration SQL (Liquibase or Flyway if present, otherwise `ddl-auto: update`) must handle `position` column backfill

</code_context>

<specifics>
## Specific Ideas

- Gap-based numbering keeps reorder writes to a single row in the common case — important because Kanban drag fires frequently.
- Compaction is rare (requires ~1000 reorders in a single column before triggering) — implement as a private service method called after the position update when gap < 1.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-drag-sort-backend*
*Context gathered: 2026-05-09*
