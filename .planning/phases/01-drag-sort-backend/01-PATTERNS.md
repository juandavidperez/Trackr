# Phase 1: Drag-Sort Backend - Pattern Map

**Mapped:** 2026-05-09
**Files analyzed:** 10
**Analogs found:** 10 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `backend/.../model/Task.java` | model | CRUD | `backend/.../model/Task.java` (self — extend) | exact |
| `backend/.../dto/TaskResponse.java` | dto | request-response | `backend/.../dto/TaskResponse.java` (self — extend) | exact |
| `backend/.../dto/TaskPositionRequest.java` | dto | request-response | `backend/.../dto/TaskStatusRequest.java` | exact |
| `backend/.../repository/TaskRepository.java` | repository | CRUD | `backend/.../repository/TaskRepository.java` (self — extend) | exact |
| `backend/.../service/TaskService.java` | service | CRUD | `backend/.../service/TaskService.java` (self — extend) | exact |
| `backend/.../controller/TaskController.java` | controller | request-response | `backend/.../controller/TaskController.java` (self — extend) | exact |
| `backend/.../service/TaskServiceTest.java` | test | CRUD | `backend/.../service/TaskServiceTest.java` (self — extend) | exact |
| `backend/.../controller/TaskControllerTest.java` | test | request-response | `backend/.../controller/TaskControllerTest.java` (self — extend) | exact |
| `backend/.../config/DataSeeder.java` | config | batch | `backend/.../config/DataSeeder.java` (self — extend) | exact |

---

## Pattern Assignments

### `backend/.../dto/TaskPositionRequest.java` (NEW FILE — dto, request-response)

**Analog:** `backend/src/main/java/com/trackr/dto/TaskStatusRequest.java` (lines 1–14)

**Full file to copy from:**
```java
package com.trackr.dto;

import com.trackr.model.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskStatusRequest {

    @NotNull(message = "Status is required")
    private TaskStatus status;
}
```

**New file must follow identical structure** — two `@NotNull`-annotated fields, `@Getter @Setter` Lombok (no `@AllArgsConstructor`), `TaskStatus` enum type for `status`, `Integer` for `position`:
```java
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

---

### `backend/.../model/Task.java` (MODIFY — model, CRUD)

**Analog:** `backend/src/main/java/com/trackr/model/Task.java` (lines 1–60)

**Field declaration pattern to copy** (lines 27–59 show the style — add `position` after `dueDate`, before `project`):
```java
// Existing pattern (lines 43-44):
private LocalDate dueDate;

// ADD after dueDate, using same nullable column pattern:
@Column
private Integer position;  // nullable intentionally — backfilled post-deploy

// Do NOT add @Column(nullable = false) until backfill is confirmed complete
```

**Lombok annotations** (lines 19–22): `@Getter @Setter @NoArgsConstructor @AllArgsConstructor` — adding `position` field automatically extends `@AllArgsConstructor` constructor. No annotation changes needed.

---

### `backend/.../dto/TaskResponse.java` (MODIFY — dto, request-response)

**Analog:** `backend/src/main/java/com/trackr/dto/TaskResponse.java` (lines 1–26)

**Field declaration pattern** (lines 15–25 — all fields are `private final`, declared in constructor arg order):
```java
// Existing last two fields (lines 24-25):
private LocalDateTime createdAt;
private LocalDateTime updatedAt;
```

**Add `position` as last field** to minimize constructor diff impact:
```java
private LocalDateTime createdAt;
private LocalDateTime updatedAt;
private Integer position;   // ADD as last field — keeps constructor arg order predictable
```

**`@AllArgsConstructor` impact:** Adding `position` as the last field changes the constructor signature. The single call site is `toResponse()` in `TaskService` (line 130–143 of `TaskService.java`) — add `task.getPosition()` as last arg. Also update `sampleResponse()` in `TaskControllerTest` (line 54–58) to pass a position value (e.g., `1000`).

---

### `backend/.../repository/TaskRepository.java` (MODIFY — repository, CRUD)

**Analog:** `backend/src/main/java/com/trackr/repository/TaskRepository.java` — JPQL style from lines 24–75.

**Existing JPQL query pattern** (lines 51–56):
```java
@Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignee LEFT JOIN FETCH t.project " +
       "WHERE t.assignee.id = :assigneeId AND t.dueDate < :date AND t.status <> :status " +
       "ORDER BY t.dueDate ASC")
List<Task> findOverdueByAssignee(@Param("assigneeId") Long assigneeId,
                                 @Param("date") LocalDate date,
                                 @Param("status") TaskStatus status);
```

**New queries to add** (copy JPQL parameter style exactly):
```java
// 1. Max position in a column — returns Optional because MAX() on empty set returns NULL
@Query("SELECT MAX(t.position) FROM Task t WHERE t.project.id = :projectId AND t.status = :status")
Optional<Integer> findMaxPositionInColumn(@Param("projectId") Long projectId,
                                          @Param("status") TaskStatus status);

// 2. All tasks in a column ordered by position — for compaction reindex
@Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.status = :status ORDER BY t.position ASC")
List<Task> findByProjectAndStatusOrderByPosition(@Param("projectId") Long projectId,
                                                  @Param("status") TaskStatus status);
```

**`findByFilters` sort change (lines 24–35):** The existing query uses `Pageable` for sorting — no JPQL `ORDER BY` embedded. For D-05, modify `listByProject` in `TaskService` (not the JPQL) to replace the incoming `Pageable` sort with `Sort.by("position").ascending()`. This avoids touching the JPQL and breaking existing tests.

---

### `backend/.../service/TaskService.java` (MODIFY — service, CRUD)

**Analog:** `backend/src/main/java/com/trackr/service/TaskService.java` — full file (145 lines).

**`@Transactional` + `save()` pattern** (lines 89–96 — `updateStatus` is the direct template):
```java
@Transactional
public TaskResponse updateStatus(Long taskId, TaskStatusRequest request, User user) {
    Task task = findTaskOrThrow(taskId);
    requireMember(task.getProject(), user);
    task.setStatus(request.getStatus());
    task = taskRepository.save(task);
    return toResponse(task);
}
```

**Authorization helper** (lines 121–127 — reuse unchanged for `updatePosition`):
```java
private void requireMember(Project project, User user) {
    boolean isMember = project.getMembers().stream()
            .anyMatch(m -> m.getId().equals(user.getId()));
    if (!isMember) {
        throw new AccessDeniedException("You are not a member of this project");
    }
}
```

**`toResponse()` call site** (lines 129–143 — add `task.getPosition()` as last arg):
```java
private TaskResponse toResponse(Task task) {
    return new TaskResponse(
            task.getId(),
            task.getTitle(),
            task.getDescription(),
            task.getStatus(),
            task.getPriority(),
            task.getDueDate(),
            task.getAssignee() != null ? task.getAssignee().getName() : null,
            task.getProject().getId(),
            task.getProject().getName(),
            task.getCreatedAt(),
            task.getUpdatedAt(),
            task.getPosition()   // ADD — must be last to match TaskResponse field order
    );
}
```

**`create()` position assignment** (lines 31–51 — add after `task.setProject(project)`, before `save()`):
```java
// After setting all existing fields:
Integer maxPos = taskRepository
        .findMaxPositionInColumn(project.getId(), task.getStatus())
        .orElse(-1000);
task.setPosition(maxPos + 1000);
```

**Modified `updateStatus()`** (lines 89–96 — add position append logic):
```java
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

**New `updatePosition()` method** (mirrors `updateStatus` pattern above + compaction):
```java
@Transactional
public TaskResponse updatePosition(Long taskId, TaskPositionRequest request, User user) {
    Task task = findTaskOrThrow(taskId);
    requireMember(task.getProject(), user);
    task.setStatus(request.getStatus());    // D-08: cross-column support
    task.setPosition(request.getPosition());
    task = taskRepository.save(task);
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
    taskRepository.saveAll(tasks);   // single flush for compaction
}
```

**`listByProject` sort override** (lines 53–60 — replace pageable sort):
```java
public Page<TaskResponse> listByProject(Long projectId, TaskStatus status, TaskPriority priority,
                                         Long assigneeId, String search, Pageable pageable, User user) {
    Project project = findProjectOrThrow(projectId);
    requireMember(project, user);
    // D-05: override sort to position ASC for Kanban ordering
    Pageable sortedByPosition = PageRequest.of(
            pageable.getPageNumber(), pageable.getPageSize(), Sort.by("position").ascending());
    return taskRepository.findByFilters(projectId, status, priority, assigneeId, search, sortedByPosition)
            .map(this::toResponse);
}
```

**New imports needed in `TaskService`:**
```java
import com.trackr.dto.TaskPositionRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.util.List;
```

---

### `backend/.../controller/TaskController.java` (MODIFY — controller, request-response)

**Analog:** `backend/src/main/java/com/trackr/controller/TaskController.java` — `updateStatus` endpoint (lines 82–91) is the direct template.

**PATCH endpoint pattern** (lines 82–91):
```java
@PatchMapping("/api/tasks/{id}/status")
@Operation(summary = "Update task status", description = "Changes only the task status (for Kanban drag-and-drop)")
@ApiResponse(responseCode = "200", description = "Status updated")
@ApiResponse(responseCode = "404", description = "Task not found or access denied")
public ResponseEntity<TaskResponse> updateStatus(
        @PathVariable Long id,
        @Valid @RequestBody TaskStatusRequest request,
        @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(taskService.updateStatus(id, request, user));
}
```

**New endpoint to add** (copy structure exactly, swap DTO and service method):
```java
@PatchMapping("/api/tasks/{id}/position")
@Operation(summary = "Update task position", description = "Reorders a task within or across Kanban columns")
@ApiResponse(responseCode = "200", description = "Position updated")
@ApiResponse(responseCode = "400", description = "Validation error")
@ApiResponse(responseCode = "404", description = "Task not found or access denied")
public ResponseEntity<TaskResponse> updatePosition(
        @PathVariable Long id,
        @Valid @RequestBody TaskPositionRequest request,
        @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(taskService.updatePosition(id, request, user));
}
```

**New import needed:**
```java
import com.trackr.dto.TaskPositionRequest;
```

---

### `backend/.../service/TaskServiceTest.java` (MODIFY — test, CRUD)

**Analog:** `backend/src/test/java/com/trackr/service/TaskServiceTest.java` (lines 1–140+).

**Test class setup pattern** (lines 37–90 — copy `@ExtendWith`, `@Mock`, `@InjectMocks`, `@BeforeEach`, `buildTask()` helper):
```java
@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock private TaskRepository taskRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private TaskService taskService;

    // setUp() builds member, nonMember, project, defaultPageable
    // buildTask() helper sets all Task fields including createdAt/updatedAt
}
```

**Single test pattern** (lines 94–103 — `when/verify` style):
```java
@Test
void listByProject_noFilters_callsRepositoryWithNulls() {
    when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
    when(taskRepository.findByFilters(eq(10L), isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
            .thenReturn(Page.empty());

    taskService.listByProject(10L, null, null, null, null, defaultPageable, member);

    verify(taskRepository).findByFilters(eq(10L), isNull(), isNull(), isNull(), isNull(), any(Pageable.class));
}
```

**New test methods to add** (follow same `when/verify + assertThat` pattern):
- `updateStatus_setsPositionToEndOfTargetColumn` — mock `findMaxPositionInColumn` returning `Optional.of(2000)`, assert saved task has position 3000
- `updateStatus_emptyColumn_setsPositionToZero` — mock `findMaxPositionInColumn` returning `Optional.empty()`, assert position is 0
- `updatePosition_validRequest_updatesPositionAndStatus` — mock repository calls, assert response has correct position and status
- `updatePosition_triggersCompaction_whenGapLessThanOne` — set up tasks with gap < 1, verify `saveAll` called
- `create_setsPositionToMaxPlusGap` — mock `findMaxPositionInColumn`, assert created task position is `max + 1000`

**`buildTask()` helper update** — add `task.setPosition(...)` call after `task.setUpdatedAt(...)`:
```java
task.setPosition(1000);  // default position for tests
```

---

### `backend/.../controller/TaskControllerTest.java` (MODIFY — test, request-response)

**Analog:** `backend/src/test/java/com/trackr/controller/TaskControllerTest.java` (lines 1–177).

**Class-level setup** (lines 32–58 — `@WebMvcTest` + `@MockBean` pattern):
```java
@WebMvcTest(TaskController.class)
@AutoConfigureMockMvc(addFilters = false)
class TaskControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private TaskService taskService;
    @MockBean private JwtTokenProvider jwtTokenProvider;
    @MockBean private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    @MockBean private UserRepository userRepository;
```

**`sampleResponse()` update** (lines 54–58 — add `position` as last constructor arg):
```java
// BEFORE:
return new TaskResponse(1L, "Test Task", "Description", TaskStatus.TODO,
        TaskPriority.HIGH, LocalDate.now().plusDays(5), "Alice",
        10L, "Test Project", LocalDateTime.now(), LocalDateTime.now());

// AFTER (add position = 1000 as last arg):
return new TaskResponse(1L, "Test Task", "Description", TaskStatus.TODO,
        TaskPriority.HIGH, LocalDate.now().plusDays(5), "Alice",
        10L, "Test Project", LocalDateTime.now(), LocalDateTime.now(), 1000);
```

**PATCH endpoint test pattern** (lines 163–176 — `create_validRequest_returns201` shows `mockMvc.perform(post(...))` structure; PATCH follows the same form):
```java
@Test
void updatePosition_validRequest_returns200() throws Exception {
    TaskPositionRequest request = new TaskPositionRequest();
    // set fields via reflection or add @Setter (already present via Lombok)
    // ... set position and status

    when(taskService.updatePosition(eq(1L), any(TaskPositionRequest.class), any()))
            .thenReturn(sampleResponse());

    mockMvc.perform(patch("/api/tasks/1/position")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.position").value(1000));
}
```

**Import to add:**
```java
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import com.trackr.dto.TaskPositionRequest;
```

---

### `backend/.../config/DataSeeder.java` (MODIFY — config, batch)

**Analog:** `backend/src/main/java/com/trackr/config/DataSeeder.java` — `createTask()` helper (lines 201–212) and early-return guard (lines 36–39).

**Early-return guard** (lines 36–39 — unchanged, position backfill runs only on fresh seed):
```java
if (userRepository.count() > 0) {
    log.info("Database already has data, skipping seed");
    return;
}
```

**`createTask()` helper** (lines 201–212 — extend to accept and set position):
```java
// BEFORE:
private void createTask(Project project, String title, String description,
                        TaskStatus status, TaskPriority priority, User assignee, LocalDate dueDate) {
    Task task = new Task();
    // ... set fields
    taskRepository.save(task);
}

// AFTER: add position parameter as last arg
private void createTask(Project project, String title, String description,
                        TaskStatus status, TaskPriority priority, User assignee, LocalDate dueDate,
                        int position) {
    Task task = new Task();
    // ... existing field sets
    task.setPosition(position);
    taskRepository.save(task);
}
```

**Calling convention** — all existing `createTask(...)` calls must be updated to pass an explicit position. Within each `(project, status)` group, pass `0, 1000, 2000, ...` in the order they appear in the seeder (top to bottom = ascending position).

---

## Shared Patterns

### Authorization
**Source:** `backend/src/main/java/com/trackr/service/TaskService.java` lines 121–127
**Apply to:** `updatePosition()` in `TaskService` — call `requireMember(task.getProject(), user)` immediately after `findTaskOrThrow()`
```java
private void requireMember(Project project, User user) {
    boolean isMember = project.getMembers().stream()
            .anyMatch(m -> m.getId().equals(user.getId()));
    if (!isMember) {
        throw new AccessDeniedException("You are not a member of this project");
    }
}
```

### Error Handling (not-found)
**Source:** `backend/src/main/java/com/trackr/service/TaskService.java` lines 116–119
**Apply to:** `updatePosition()` — use `findTaskOrThrow()` unchanged
```java
private Task findTaskOrThrow(Long id) {
    return taskRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
}
```

### `orElse(-1000)` for empty-column position
**Source:** RESEARCH.md Pitfall 5 + Code Examples
**Apply to:** Every call to `findMaxPositionInColumn()` (in `create()`, `updateStatus()`, `updatePosition()`)
```java
Integer maxPos = taskRepository
        .findMaxPositionInColumn(projectId, status)
        .orElse(-1000);
task.setPosition(maxPos + 1000);
// Result: first task in empty column gets position 0
```

### Transaction scope
**Source:** `backend/src/main/java/com/trackr/service/TaskService.java` lines 30, 62, 89, 98
**Apply to:** `updatePosition()` and `compactColumn()` — both must be inside `@Transactional` on the outer method. `compactColumn` is private so it participates in the caller's transaction automatically.

---

## No Analog Found

None — all files have direct analogs in the existing codebase.

---

## Metadata

**Analog search scope:** `backend/src/main/java/com/trackr/`, `backend/src/test/java/com/trackr/`
**Files scanned:** 9 source files read directly
**Pattern extraction date:** 2026-05-09
