package com.trackr.controller;

import com.trackr.dto.DashboardResponse;
import com.trackr.model.User;
import com.trackr.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Aggregated user statistics")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @Operation(summary = "Get dashboard stats", description = "Returns task counts by status, overdue tasks, active projects, and recent activity for the authenticated user")
    @ApiResponse(responseCode = "200", description = "Dashboard statistics returned")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<DashboardResponse> getStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dashboardService.getStats(user));
    }
}
