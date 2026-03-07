package com.trackr.dto;

import com.trackr.model.enums.UserRole;

public record UserResponse(Long id, String name, String email, UserRole role) {
}
