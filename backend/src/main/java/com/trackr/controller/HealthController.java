package com.trackr.controller;

import java.util.Map;

import com.trackr.dto.UserResponse;
import com.trackr.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Health & User", description = "Health check and current user info")
public class HealthController {

    @GetMapping("/health")
    @SecurityRequirements
    @Operation(summary = "Health check", description = "Returns API status")
    @ApiResponse(responseCode = "200", description = "API is up")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Returns the authenticated user's profile")
    @ApiResponse(responseCode = "200", description = "User profile returned")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole()));
    }
}
