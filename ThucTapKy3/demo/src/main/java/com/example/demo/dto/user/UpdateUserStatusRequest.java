package com.example.demo.dto.user;

import com.example.demo.entity.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull(message = "status is required") UserStatus status
) {
}
