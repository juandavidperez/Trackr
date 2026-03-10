package com.trackr.controller;

import com.trackr.dto.TaskRequest;
import com.trackr.dto.TaskResponse;
import com.trackr.dto.TaskStatusRequest;
import com.trackr.model.User;
import com.trackr.model.enums.TaskPriority;
import com.trackr.model.enums.TaskStatus;
import com.trackr.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Task CRUD, status updates, and filtering")
public class TaskController {

    private final TaskService taskService;

    @GetMapping("/api/tasks/me")
    @Operation(summary = "My tasks", description = "Returns paginated tasks assigned to the authenticated user, with optional filters")
    @ApiResponse(responseCode = "200", description = "Tasks returned")
    public ResponseEntity<Page<TaskResponse>> myTasks(
            @Parameter(description = "Filter by project ID") @RequestParam(required = false) Long projectId,
            @Parameter(description = "Filter by status") @RequestParam(required = false) TaskStatus status,
            @Parameter(description = "Filter by priority") @RequestParam(required = false) TaskPriority priority,
            @Parameter(description = "Search in title/description") @RequestParam(required = false) String search,
            @Parameter(description = "Pagination (page, size, sort)") Pageable pageable,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.listMyTasks(user.getId(), projectId, status, priority, search, pageable));
    }

    @PostMapping("/api/projects/{projectId}/tasks")
    @Operation(summary = "Create task", description = "Creates a new task in a project")
    @ApiResponse(responseCode = "201", description = "Task created")
    @ApiResponse(responseCode = "400", description = "Validation error")
    @ApiResponse(responseCode = "404", description = "Project not found or access denied")
    public ResponseEntity<TaskResponse> create(
            @PathVariable Long projectId,
            @Valid @RequestBody TaskRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.create(projectId, request, user));
    }

    @GetMapping("/api/projects/{projectId}/tasks")
    @Operation(summary = "List project tasks", description = "Returns paginated tasks for a project with optional filters")
    @ApiResponse(responseCode = "200", description = "Tasks returned")
    @ApiResponse(responseCode = "404", description = "Project not found or access denied")
    public ResponseEntity<Page<TaskResponse>> list(
            @PathVariable Long projectId,
            @Parameter(description = "Filter by status") @RequestParam(required = false) TaskStatus status,
            @Parameter(description = "Filter by priority") @RequestParam(required = false) TaskPriority priority,
            @Parameter(description = "Filter by assignee ID") @RequestParam(required = false) Long assigneeId,
            @Parameter(description = "Search in title/description") @RequestParam(required = false) String search,
            @Parameter(description = "Pagination (page, size, sort)") Pageable pageable,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.listByProject(projectId, status, priority, assigneeId, search, pageable, user));
    }

    @PutMapping("/api/tasks/{id}")
    @Operation(summary = "Update task", description = "Updates task details (title, description, status, priority, assignee, due date)")
    @ApiResponse(responseCode = "200", description = "Task updated")
    @ApiResponse(responseCode = "400", description = "Validation error")
    @ApiResponse(responseCode = "404", description = "Task not found or access denied")
    public ResponseEntity<TaskResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TaskRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.update(id, request, user));
    }

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

    @DeleteMapping("/api/tasks/{id}")
    @Operation(summary = "Delete task", description = "Deletes a task (project owner only)")
    @ApiResponse(responseCode = "204", description = "Task deleted")
    @ApiResponse(responseCode = "403", description = "Not the project owner")
    @ApiResponse(responseCode = "404", description = "Task not found")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        taskService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
