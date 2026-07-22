package com.example.demo.dto.auth;

import com.example.demo.entity.Role;

public record AuthResponse(
        String token,
        Long id,
        String fullName,
        String email,
        Role role
) {
}
