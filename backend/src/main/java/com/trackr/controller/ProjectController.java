package com.trackr.controller;

import com.trackr.dto.AddMemberRequest;
import com.trackr.dto.ProjectRequest;
import com.trackr.dto.ProjectResponse;
import com.trackr.dto.ProjectStatsResponse;
import com.trackr.dto.UserResponse;
import com.trackr.model.User;
import com.trackr.service.ProjectService;
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

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Project CRUD and member management")
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    @Operation(summary = "Create project", description = "Creates a new project owned by the authenticated user")
    @ApiResponse(responseCode = "201", description = "Project created")
    @ApiResponse(responseCode = "400", description = "Validation error")
    public ResponseEntity<ProjectResponse> create(
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.create(request, user));
    }

    @GetMapping
    @Operation(summary = "List projects", description = "Returns paginated projects where the user is owner or member")
    @ApiResponse(responseCode = "200", description = "Projects returned")
    public ResponseEntity<Page<ProjectResponse>> list(
            @AuthenticationPrincipal User user,
            @Parameter(description = "Pagination (page, size, sort)") Pageable pageable) {
        return ResponseEntity.ok(projectService.listByUser(user, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project", description = "Returns a project by ID (must be owner or member)")
    @ApiResponse(responseCode = "200", description = "Project found")
    @ApiResponse(responseCode = "404", description = "Project not found or access denied")
    public ResponseEntity<ProjectResponse> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.getById(id, user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update project", description = "Updates project name/description (owner only)")
    @ApiResponse(responseCode = "200", description = "Project updated")
    @ApiResponse(responseCode = "403", description = "Not the project owner")
    @ApiResponse(responseCode = "404", description = "Project not found")
    public ResponseEntity<ProjectResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.update(id, request, user));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete project", description = "Deletes a project and all its tasks (owner only)")
    @ApiResponse(responseCode = "204", description = "Project deleted")
    @ApiResponse(responseCode = "403", description = "Not the project owner")
    @ApiResponse(responseCode = "404", description = "Project not found")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        projectService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/stats")
    @Operation(summary = "Get project stats", description = "Returns task counts by status/priority, completion percentage, and overdue count")
    @ApiResponse(responseCode = "200", description = "Stats returned")
    @ApiResponse(responseCode = "404", description = "Project not found or access denied")
    public ResponseEntity<ProjectStatsResponse> getStats(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.getStats(id, user));
    }

    @GetMapping("/{id}/members")
    @Operation(summary = "List project members", description = "Returns all members of a project (excluding owner)")
    @ApiResponse(responseCode = "200", description = "Members returned")
    public ResponseEntity<List<UserResponse>> getMembers(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.getMembers(id, user));
    }

    @PostMapping("/{id}/members")
    @Operation(summary = "Add member", description = "Adds a user to the project by email (owner only)")
    @ApiResponse(responseCode = "200", description = "Member added")
    @ApiResponse(responseCode = "400", description = "User not found or already a member")
    @ApiResponse(responseCode = "403", description = "Not the project owner")
    public ResponseEntity<ProjectResponse> addMember(
            @PathVariable Long id,
            @Valid @RequestBody AddMemberRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.addMember(id, request, user));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @Operation(summary = "Remove member", description = "Removes a user from the project (owner only)")
    @ApiResponse(responseCode = "200", description = "Member removed")
    @ApiResponse(responseCode = "403", description = "Not the project owner")
    @ApiResponse(responseCode = "404", description = "Project or member not found")
    public ResponseEntity<ProjectResponse> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.removeMember(id, userId, user));
    }
}
