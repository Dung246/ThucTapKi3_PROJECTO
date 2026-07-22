package com.example.demo.dto.category;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(
        @NotBlank(message = "name is required") String name,
        String description
) {
}
