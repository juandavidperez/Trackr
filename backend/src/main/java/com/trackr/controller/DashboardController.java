package com.trackr.controller;

import com.trackr.dto.DashboardResponse;
import com.trackr.model.User;
import com.trackr.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dashboardService.getStats(user));
    }
}
