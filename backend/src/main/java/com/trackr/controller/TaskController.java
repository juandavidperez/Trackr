package com.trackr.controller;

import com.trackr.dto.TaskRequest;
import com.trackr.dto.TaskResponse;
import com.trackr.dto.TaskStatusRequest;
import com.trackr.model.User;
import com.trackr.model.enums.TaskPriority;
import com.trackr.model.enums.TaskStatus;
import com.trackr.service.TaskService;
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
public class TaskController {

    private final TaskService taskService;

    @PostMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<TaskResponse> create(
            @PathVariable Long projectId,
            @Valid @RequestBody TaskRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.create(projectId, request, user));
    }

    @GetMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<Page<TaskResponse>> list(
            @PathVariable Long projectId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) String search,
            Pageable pageable,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.listByProject(projectId, status, priority, assigneeId, search, pageable, user));
    }

    @PutMapping("/api/tasks/{id}")
    public ResponseEntity<TaskResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TaskRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.update(id, request, user));
    }

    @PatchMapping("/api/tasks/{id}/status")
    public ResponseEntity<TaskResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody TaskStatusRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.updateStatus(id, request, user));
    }

    @DeleteMapping("/api/tasks/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        taskService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
