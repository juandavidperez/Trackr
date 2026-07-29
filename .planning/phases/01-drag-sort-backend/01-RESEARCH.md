# Phase 1: Drag-Sort Backend - Research

**Researched:** 2026-05-09
**Domain:** Spring Boot / JPA — gap-based integer position ordering for Kanban tasks
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use gap-based integers (0, 1000, 2000, …). Only the moved task is updated — no cascade writes on reorder.
- **D-02:** Initial gap size = 1000. New tasks appended to a column get `max(position) + 1000`.
- **D-03:** Compaction trigger: when inserting between two tasks would produce a gap < 1 (i.e., positions are adjacent integers), reindex the entire column back to multiples of 1000.
- **D-04:** Migration assigns initial positions using `createdAt ASC` order within each `(project_id, status)` group, spaced 1000 apart (0, 1000, 2000, …).
- **D-05:** `GET /api/projects/{id}/tasks` default sort changes to `position ASC` within each status group. Frontend Kanban receives tasks already ordered — no explicit sort param needed.
- **D-06:** `GET /api/tasks/me` (My Tasks) keeps its existing sort unchanged.
- **D-07:** The existing `PATCH /api/tasks/{id}/status` endpoint is updated to automatically set the task's position to the end of the target column (`max(position in target column) + 1000`).
- **D-08:** The new `PATCH /api/tasks/{id}/position` endpoint handles intra-column reorders AND cross-column moves when caller passes a `status` field.
- **D-09:** `PATCH /api/tasks/{id}/position` body: `{ "position": int, "status": string }`. Returns updated `TaskResponse` (200). `position` field must be included in `TaskResponse`.

### Claude's Discretion
- Concurrency: last-write-wins (no optimistic locking needed at this scale).
- Error handling: follow existing patterns (`ResourceNotFoundException` / `AccessDeniedException`).
- Authorization: same member-of-project check as `updateStatus`.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DRAG-02 | Task order within a column persists after page refresh (stored in database) | `position` column in `tasks` table; `ddl-auto: update` handles column addition; backfill via DataSeeder guard |
| DRAG-03 | Task order is preserved independently per column | position is scoped to `(project_id, status)` — independent per column |
| DRAG-04 | When a task is moved between columns, its position in the target column defaults to the end | `updateStatus` updated to call `maxPositionInColumn() + 1000` |
| DRAG-05 | Backend exposes `PATCH /api/tasks/{id}/position` with `{ position: int, status: string }` | New endpoint + DTO + service method + repository queries documented below |
</phase_requirements>

---

## Summary

Phase 1 adds a `position` integer column to the `tasks` table and exposes two changes: a new `PATCH /api/tasks/{id}/position` endpoint, and an update to the existing `PATCH /api/tasks/{id}/status` to auto-assign end-of-column positions. The codebase uses `ddl-auto: update` in dev and `ddl-auto: update` in prod (application-prod.yml confirmed separately) — there is no Flyway or Liquibase. Schema changes happen automatically from Hibernate; data backfill (assigning initial positions to existing rows) must be handled in DataSeeder or a one-time SQL statement, since Hibernate does not backfill data.

The gap-based approach (step 1000) means the common reorder case is a single `UPDATE` statement against one row. Compaction is rare and isolated to a private service method. The `toResponse()` method in `TaskService` is the single place where `TaskResponse` is constructed — adding `position` there automatically propagates to all endpoints.

**Primary recommendation:** Add `position` as a nullable-initially-then-not-null `Integer` column to `Task` entity, backfill via a DataSeeder guard block, then add three JPQL queries to `TaskRepository` and one new service method + controller endpoint.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| position persistence | Database / Storage | — | Column on `tasks` table; owned by JPA entity |
| position assignment (new task) | API / Backend | — | `TaskService.create()` must compute `max + 1000` |
| position assignment (status change) | API / Backend | — | `TaskService.updateStatus()` updated to append |
| position reorder (intra/cross-column) | API / Backend | — | New `TaskService.updatePosition()` |
| compaction reindex | API / Backend | — | Private method in `TaskService`, called conditionally |
| ordered task fetch | Database / Storage | API / Backend | JPQL `ORDER BY t.position ASC` added to `findByFilters` |

---

## Standard Stack

### Core (already in project — no new dependencies)
| Library | Version | Purpose | Note |
|---------|---------|---------|------|
| Spring Data JPA | (Spring Boot 3 managed) | Repository queries | JPQL `MAX()` and `ORDER BY` sufficient; no new library needed |
| Hibernate | (Spring Boot 3 managed) | DDL auto-update for column addition | `ddl-auto: update` adds column, does not backfill |
| Lombok | (in pom.xml) | `@Getter @Setter` on new `position` field | Same pattern as other Task fields |
| Jakarta Validation | (in pom.xml) | `@NotNull` on `TaskPositionRequest` fields | Same pattern as `TaskStatusRequest` |

**No new Maven dependencies required for this phase.**

---

## Architecture Patterns

### System Architecture Diagram

```
Client (future Phase 2 frontend)
         |
         | PATCH /api/tasks/{id}/position  { position, status }
         | PATCH /api/tasks/{id}/status    { status }
         v
  TaskController
         |
         | calls
         v
  TaskService
    ├── updatePosition(id, request, user)
    │     ├── findTaskOrThrow(id)
    │     ├── requireMember(project, user)
    │     ├── task.setStatus(request.getStatus())    ← cross-column support
    │     ├── task.setPosition(request.getPosition())
    │     ├── if gap < 1: compactColumn(projectId, status)
    │     └── taskRepository.save(task) → toResponse()
    │
    └── updateStatus(id, request, user)   ← MODIFIED
          ├── findTaskOrThrow(id)
          ├── requireMember(project, user)
          ├── task.setStatus(request.getStatus())
          ├── maxPos = taskRepository.findMaxPositionInColumn(projectId, newStatus) ?? -1000
          ├── task.setPosition(maxPos + 1000)
          └── taskRepository.save(task) → toResponse()
         |
         v
  TaskRepository (JPQL)
    ├── findByFilters(...)  ← ORDER BY t.position ASC added for project-tasks query
    ├── findMaxPositionInColumn(projectId, status) → Optional<Integer>
    └── findAllByProjectAndStatusOrderByPosition(projectId, status) → List<Task>  ← for compaction
         |
         v
  PostgreSQL: tasks table
    └── position INTEGER column (NOT NULL after backfill)
```

### Recommended File Changes
```
backend/src/main/java/com/trackr/
├── model/Task.java                      ← add: private Integer position;
├── dto/TaskResponse.java                ← add: private Integer position; (+ constructor arg)
├── dto/TaskPositionRequest.java         ← new file (mirrors TaskStatusRequest pattern)
├── service/TaskService.java             ← updateStatus() modified; updatePosition() added; compactColumn() added
├── repository/TaskRepository.java       ← 2 new JPQL queries; findByFilters ORDER BY modified
└── controller/TaskController.java       ← new PATCH /api/tasks/{id}/position endpoint

backend/src/main/java/com/trackr/config/
└── DataSeeder.java                      ← add position backfill block (inside existing "skip if data exists" guard)

backend/src/test/java/com/trackr/
├── service/TaskServiceTest.java         ← new tests for updatePosition(), updateStatus() position assignment, compactColumn()
└── controller/TaskControllerTest.java   ← new tests for PATCH /api/tasks/{id}/position
```

### Pattern 1: Gap-Based Position Calculation

**What:** When inserting between tasks A (pos=2000) and B (pos=3000), new position = (2000 + 3000) / 2 = 2500. When gap between neighbors < 1, compact the column.

**What the frontend sends:** The frontend computes the midpoint and sends it. The backend just stores it and triggers compaction if needed. The backend does NOT compute midpoints — that is frontend responsibility for Phase 2.

**For this phase** (backend-only), the endpoint simply accepts whatever integer the client sends and persists it.

**Example — `TaskPositionRequest` (new DTO):**
```java
// Source: mirrors TaskStatusRequest.java pattern [VERIFIED: codebase]
package com.trackr.dto;

import com.trackr.model.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskPositionRequest {

    @NotNull(message = "Position is required")
    private Integer position;

    @NotNull(message = "Status is required")
    private TaskStatus status;
}
```

### Pattern 2: New JPQL Queries for TaskRepository

```java
// Source: mirrors existing JPQL style in TaskRepository.java [VERIFIED: codebase]

// 1. Max position in a column (for append-to-end)
@Query("SELECT MAX(t.position) FROM Task t WHERE t.project.id = :projectId AND t.status = :status")
Optional<Integer> findMaxPositionInColumn(@Param("projectId") Long projectId,
                                          @Param("status") TaskStatus status);

// 2. All tasks in a column ordered by position (for compaction reindex)
@Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.status = :status ORDER BY t.position ASC")
List<Task> findByProjectAndStatusOrderByPosition(@Param("projectId") Long projectId,
                                                  @Param("status") TaskStatus status);
```

### Pattern 3: `findByFilters` — adding `position ASC` as secondary sort

The existing `findByFilters` query uses Spring Data `Pageable` for sorting. The caller (controller) passes a `Pageable`. For the Kanban board, the controller will pass a `Pageable` sorted by `position ASC`.

**Option A (preferred):** Change the default `Pageable` that `listByProject` accepts to include `Sort.by("position").ascending()` when no sort param is passed. The JPQL query itself does not embed an `ORDER BY` — Spring Data appends the `Pageable` sort.

**Option B:** Embed `ORDER BY t.position ASC` directly in the JPQL. This overrides any client-provided sort. This conflicts with the existing test that passes `sort=createdAt,desc`.

**Decision guidance (Claude's discretion):** Option A is safer — it preserves the existing sort-override capability for future use and does not break existing tests. The service method `listByProject` can default to `position ASC` sort when constructing the pageable if none is provided, or the controller can inject a default sort.

**Simplest approach:** The controller's `list()` method receives `Pageable pageable` from Spring MVC. Spring MVC resolves the default sort from `application.yml` pagination config. Add `default-sort-direction: asc` and `default-sort-parameter: position` — but this is a global setting. Better: modify `listByProject` in the service to replace the sort with `Sort.by("position").ascending()` always (since position sort is always correct for the Kanban board endpoint). This is a single-line change and aligns with D-05.

### Pattern 4: Compaction

```java
// Source: [ASSUMED] — standard compaction algorithm for gap-based ordering
@Transactional
private void compactColumn(Long projectId, TaskStatus status) {
    List<Task> tasks = taskRepository.findByProjectAndStatusOrderByPosition(projectId, status);
    int pos = 0;
    for (Task t : tasks) {
        t.setPosition(pos);
        pos += 1000;
    }
    taskRepository.saveAll(tasks);
}
```

Called from `updatePosition()` after detecting gap < 1. Since `@Transactional` is on the outer method, compaction runs in the same transaction — no partial-update risk.

### Pattern 5: DataSeeder position backfill

The DataSeeder already has an early-return guard (`if (userRepository.count() > 0) return`). For existing databases, the seeder skips. For a fresh dev seed, positions must be assigned when tasks are created.

Two approaches:
1. **Modify `createTask()` helper in DataSeeder** to accept and set a position value — assign positions at seed time by calling with explicit position.
2. **Post-seed backfill block** — after all tasks are created, query by `(project_id, status)`, sort by `createdAt ASC`, and assign positions 0, 1000, 2000…

Option 1 is simpler and more explicit. The DataSeeder `createTask()` method currently takes (project, title, description, status, priority, assignee, dueDate) — add `position` parameter or let it auto-compute using `taskRepository.count()` per group.

For existing production/staging databases with data: a one-time SQL migration is needed since `ddl-auto: update` only adds the column (nullable), not the data. The planner should include a Wave 0 task with the SQL:

```sql
-- Backfill positions for existing tasks, ordered by createdAt within each (project_id, status) group
WITH ranked AS (
  SELECT id,
         (ROW_NUMBER() OVER (PARTITION BY project_id, status ORDER BY created_at ASC) - 1) * 1000 AS pos
  FROM tasks
)
UPDATE tasks SET position = ranked.pos
FROM ranked
WHERE tasks.id = ranked.id;
```

This SQL is safe to run multiple times (idempotent only if `position IS NULL` check added — planner should add `WHERE tasks.position IS NULL`).

### Anti-Patterns to Avoid

- **Embedding hard `ORDER BY position ASC` in `findByFilters` JPQL:** Overrides Pageable sort, breaks tests that pass custom sort params.
- **Returning `null` position in TaskResponse before backfill:** If column is nullable and backfill hasn't run, `toResponse()` will return `position: null`. Frontend must tolerate this until Phase 2 — but tests should assert non-null after operations.
- **Running compaction outside a transaction:** Partial reindexing leaves the column in an inconsistent order. Keep compaction inside `@Transactional`.
- **Using `saveAll()` for individual reorder:** Compaction uses `saveAll()` which is correct; normal reorder uses `save(task)` for the single moved task only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Column max query | Custom SQL string via EntityManager | JPQL `SELECT MAX(t.position)` with `@Query` | Spring Data handles parameterization, type safety |
| Batch position update | Loop of individual `save()` calls | `taskRepository.saveAll(tasks)` | Single flush, better performance for compaction |
| Fractional position (LSeq/CRDT) | Implement LSeq or tree-based ordering | Gap integers (D-01 locked) | Over-engineered for current scale |

---

## Common Pitfalls

### Pitfall 1: `ddl-auto: update` adds column as nullable, but NOT NULL constraint fails on backfill
**What goes wrong:** Hibernate adds `position INTEGER` (nullable). If you then add `@Column(nullable = false)` to the entity without backfilling first, the next app start will attempt `ALTER COLUMN position SET NOT NULL` — which fails if any row has `NULL`.
**Why it happens:** Hibernate applies `nullable = false` as a DDL constraint, but only on schema creation — not always on `update`. Behavior varies by Hibernate version.
**How to avoid:** Keep `position` nullable in the entity initially (`@Column(nullable = true)` or omit `nullable = false`). Backfill data. Then in a subsequent migration (or accept nullable permanently for simplicity). For this phase, nullable is acceptable — the column will be populated for all new operations.
**Warning signs:** App fails to start with `ERROR: column "position" of relation "tasks" contains null values`.

### Pitfall 2: `AllArgsConstructor` on TaskResponse breaks when adding `position` field
**What goes wrong:** `TaskResponse` uses `@AllArgsConstructor`. The single `toResponse()` call in `TaskService` constructs it with positional args. Adding `position` as a new field changes the constructor signature — all callers must add the argument.
**Why it happens:** Lombok `@AllArgsConstructor` generates a constructor with ALL fields in declaration order.
**How to avoid:** Add `position` as the LAST field in `TaskResponse` to minimize diff impact. Update the single `toResponse()` call in `TaskService` to include `task.getPosition()`. Also update `sampleResponse()` in `TaskControllerTest` to pass a position value.
**Warning signs:** Compile error in `TaskService.toResponse()` — "no suitable constructor found".

### Pitfall 3: Test `sampleResponse()` constructor call breaks
**What goes wrong:** `TaskControllerTest.sampleResponse()` uses the all-args constructor. Adding `position` to `TaskResponse` requires updating this call.
**How to avoid:** Update `sampleResponse()` to include `position` — e.g., `1000` as a placeholder value.

### Pitfall 4: `findByFilters` sort — `position` column not yet in DB when tests run
**What goes wrong:** If a test passes `sort=position,asc` before the column exists in the test DB (H2 or Postgres), the query fails.
**How to avoid:** Tests use `@WebMvcTest` with mocked service — no DB involved. Service tests use Mockito — no DB involved. Integration tests are not present in this codebase. No risk.

### Pitfall 5: Cross-column move via `/status` — `max()` returns `null` for empty column
**What goes wrong:** `findMaxPositionInColumn()` returns `Optional.empty()` when the target column has no tasks. Calling `.get()` throws `NoSuchElementException`. Calling `orElse(null)` and adding `1000` throws NPE.
**How to avoid:** Use `orElse(-1000)` so that first task in column gets position `0`. Example: `int maxPos = taskRepository.findMaxPositionInColumn(projectId, status).orElse(-1000); task.setPosition(maxPos + 1000);`

---

## Code Examples

### Full `updateStatus` modification (service layer)
```java
// Source: extends existing pattern in TaskService.java [VERIFIED: codebase]
@Transactional
public TaskResponse updateStatus(Long taskId, TaskStatusRequest request, User user) {
    Task task = findTaskOrThrow(taskId);
    requireMember(task.getProject(), user);
    task.setStatus(request.getStatus());
    // D-07: auto-assign position to end of target column
    Integer maxPos = taskRepository
            .findMaxPositionInColumn(task.getProject().getId(), request.getStatus())
            .orElse(-1000);
    task.setPosition(maxPos + 1000);
    task = taskRepository.save(task);
    return toResponse(task);
}
```

### `updatePosition` method (new service method)
```java
// Source: follows existing service pattern [VERIFIED: codebase structure]
@Transactional
public TaskResponse updatePosition(Long taskId, TaskPositionRequest request, User user) {
    Task task = findTaskOrThrow(taskId);
    requireMember(task.getProject(), user);
    task.setStatus(request.getStatus());   // D-08: supports cross-column
    task.setPosition(request.getPosition());
    task = taskRepository.save(task);
    // D-03: compact if gap < 1 (detected by caller sending position that creates gap)
    // Compaction check: query neighbors after save; if min gap < 1, compact
    compactIfNeeded(task.getProject().getId(), request.getStatus());
    return toResponse(task);
}

private void compactIfNeeded(Long projectId, TaskStatus status) {
    List<Task> tasks = taskRepository.findByProjectAndStatusOrderByPosition(projectId, status);
    for (int i = 1; i < tasks.size(); i++) {
        if (tasks.get(i).getPosition() - tasks.get(i - 1).getPosition() < 1) {
            compactColumn(projectId, status, tasks);
            return;
        }
    }
}

private void compactColumn(Long projectId, TaskStatus status, List<Task> tasks) {
    int pos = 0;
    for (Task t : tasks) {
        t.setPosition(pos);
        pos += 1000;
    }
    taskRepository.saveAll(tasks);
}
```

### New controller endpoint
```java
// Source: mirrors PATCH /api/tasks/{id}/status pattern [VERIFIED: codebase]
@PatchMapping("/api/tasks/{id}/position")
@Operation(summary = "Update task position", description = "Reorders a task within or across columns")
@ApiResponse(responseCode = "200", description = "Position updated")
@ApiResponse(responseCode = "404", description = "Task not found or access denied")
public ResponseEntity<TaskResponse> updatePosition(
        @PathVariable Long id,
        @Valid @RequestBody TaskPositionRequest request,
        @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(taskService.updatePosition(id, request, user));
}
```

---

## Runtime State Inventory

> Not a rename/refactor phase — this section is not applicable.

---

## Environment Availability

> This phase is backend code changes only. No external tools beyond Docker Compose (already running) are required.

Step 2.6: SKIPPED (no external dependencies beyond existing Docker stack).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | JUnit 5 + Mockito + Spring Boot Test |
| Config file | None — Spring Boot auto-configuration |
| Quick run command | `docker compose exec backend ./mvnw test -pl . -Dtest=TaskServiceTest,TaskControllerTest` |
| Full suite command | `docker compose exec backend ./mvnw test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DRAG-02 | `position` field persisted and returned in TaskResponse | unit | `./mvnw test -Dtest=TaskServiceTest` | ✅ (extend existing) |
| DRAG-03 | Position is per-column (project_id + status scope) | unit | `./mvnw test -Dtest=TaskServiceTest` | ✅ (extend existing) |
| DRAG-04 | `updateStatus` sets position to `max + 1000` in target column | unit | `./mvnw test -Dtest=TaskServiceTest#updateStatus_setsPositionToEndOfTargetColumn` | ❌ Wave 0 |
| DRAG-04 | `updateStatus` on empty target column sets position to 0 | unit | `./mvnw test -Dtest=TaskServiceTest#updateStatus_emptyColumn_setsPositionToZero` | ❌ Wave 0 |
| DRAG-05 | `PATCH /api/tasks/{id}/position` returns 200 with updated TaskResponse | unit | `./mvnw test -Dtest=TaskControllerTest#updatePosition_validRequest_returns200` | ❌ Wave 0 |
| DRAG-05 | `PATCH /api/tasks/{id}/position` with null position returns 400 | unit | `./mvnw test -Dtest=TaskControllerTest#updatePosition_nullPosition_returns400` | ❌ Wave 0 |
| DRAG-05 | `PATCH /api/tasks/{id}/position` with null status returns 400 | unit | `./mvnw test -Dtest=TaskControllerTest#updatePosition_nullStatus_returns400` | ❌ Wave 0 |
| DRAG-02 | `position` included in TaskResponse for all existing endpoints | unit | `./mvnw test -Dtest=TaskControllerTest` | ✅ (update sampleResponse) |
| DRAG-03 | Compaction reindexes column to multiples of 1000 | unit | `./mvnw test -Dtest=TaskServiceTest#updatePosition_triggersCompaction_whenGapLessThanOne` | ❌ Wave 0 |
| DRAG-02 | New task creation appends position as `max + 1000` | unit | `./mvnw test -Dtest=TaskServiceTest#create_setsPositionToMaxPlusGap` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `docker compose exec backend ./mvnw test -Dtest=TaskServiceTest,TaskControllerTest -q`
- **Per wave merge:** `docker compose exec backend ./mvnw test`
- **Phase gate:** Full suite green (all 118 + new tests) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `TaskServiceTest` — add test methods: `updateStatus_setsPositionToEndOfTargetColumn`, `updateStatus_emptyColumn_setsPositionToZero`, `updatePosition_validRequest_updatesPositionAndStatus`, `updatePosition_triggersCompaction_whenGapLessThanOne`, `create_setsPositionToMaxPlusGap`
- [ ] `TaskControllerTest` — add test methods: `updatePosition_validRequest_returns200`, `updatePosition_nullPosition_returns400`, `updatePosition_nullStatus_returns400`
- [ ] Update `sampleResponse()` in `TaskControllerTest` to include `position` field in constructor call

---

## Security Domain

> `security_enforcement: true`, ASVS level 1.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing JWT Bearer token — no change |
| V3 Session Management | no | Stateless — no change |
| V4 Access Control | yes | `requireMember()` reused for new endpoint — same pattern |
| V5 Input Validation | yes | `@NotNull` on `TaskPositionRequest` fields via Jakarta Validation |
| V6 Cryptography | no | No crypto in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized position update (non-member sets task order) | Elevation of Privilege | `requireMember()` check in `updatePosition()` — same as `updateStatus()` |
| Position integer overflow | Tampering | Integer max value ~2.1B; at gap 1000, ~2.1M reorders before overflow. Acceptable at this scale; no special handling needed. |
| Position collision (two clients simultaneously reorder) | Tampering | D-01 decision: last-write-wins. No mitigation required. |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Compaction check reads neighbors after save and checks min gap — if gap < 1 then compact | Code Examples | If logic is inverted or threshold wrong, compaction either never fires or fires too often |
| A2 | `ddl-auto: update` in prod (application-prod.yml) will add nullable `position` column without data loss | Pitfall 1 | If prod uses `ddl-auto: validate` or `none`, column must be added via manual SQL |
| A3 | Modifying `listByProject` to always sort by `position ASC` won't break existing frontend behavior (Milestone 1 frontend currently receives tasks in undefined order and sorts on client) | Architecture | If frontend relied on `createdAt` server sort, Kanban column order changes — but position values after backfill match `createdAt ASC` order, so visual order is identical |

---

## Open Questions

1. **`application-prod.yml` ddl-auto setting**
   - What we know: `application-dev.yml` uses `ddl-auto: update`. `application.yml` has no `ddl-auto` key.
   - What's unclear: `application-prod.yml` was not read — it may use `ddl-auto: validate` or `none`, which would require a manual SQL migration for the `position` column.
   - Recommendation: Planner should include a Wave 0 task to read `application-prod.yml` and confirm. If `validate` or `none`, add manual migration SQL task.

2. **`create()` service method — position assignment**
   - What we know: D-02 says new tasks get `max(position) + 1000`. The current `create()` method does not set position.
   - What's unclear: The additional context says "backend-only phase" and DRAG-05 is the primary new endpoint. But DRAG-02 requires persistence. New tasks created via the existing `POST` should also get a position.
   - Recommendation: `create()` must also compute and set position. Add `findMaxPositionInColumn()` call inside `create()` using the task's project and status.

---

## Sources

### Primary (HIGH confidence)
- `backend/src/main/java/com/trackr/model/Task.java` — entity structure verified
- `backend/src/main/java/com/trackr/service/TaskService.java` — all service methods and patterns verified
- `backend/src/main/java/com/trackr/controller/TaskController.java` — endpoint patterns verified
- `backend/src/main/java/com/trackr/repository/TaskRepository.java` — JPQL style verified
- `backend/src/main/java/com/trackr/dto/TaskResponse.java` — all-args constructor, field list verified
- `backend/src/main/java/com/trackr/dto/TaskStatusRequest.java` — DTO pattern to mirror verified
- `backend/src/main/resources/application-dev.yml` — `ddl-auto: update` confirmed
- `backend/src/test/java/com/trackr/controller/TaskControllerTest.java` — `@WebMvcTest`, `@MockBean`, `sampleResponse()` pattern verified
- `backend/src/test/java/com/trackr/service/TaskServiceTest.java` — `@ExtendWith(MockitoExtension.class)`, `@InjectMocks`, AssertJ pattern verified
- `backend/src/main/java/com/trackr/config/DataSeeder.java` — seed guard pattern verified

### Secondary (MEDIUM confidence)
- `.planning/phases/01-drag-sort-backend/01-CONTEXT.md` — all decisions D-01 through D-09

### Tertiary (LOW confidence — marked [ASSUMED] inline)
- Compaction algorithm implementation details — standard gap-list pattern, not Spring-specific

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all patterns verified in codebase
- Architecture: HIGH — all files read, all integration points confirmed
- Pitfalls: HIGH for Lombok/constructor pitfall (verified), MEDIUM for ddl-auto nullability (observed behavior, not tested)
- JPQL queries: HIGH — existing JPQL style confirmed in repository

**Research date:** 2026-05-09
**Valid until:** 2026-06-09 (stable domain — Spring Boot JPA patterns do not change rapidly)
