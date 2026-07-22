package com.example.demo.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank(message = "name is required") String name,
        @NotNull(message = "categoryId is required") Long categoryId,
        @NotNull(message = "price is required") @DecimalMin(value = "0.0", inclusive = true, message = "price must not be negative") BigDecimal price,
        @NotNull(message = "quantity is required") @PositiveOrZero(message = "quantity must not be negative") Integer quantity,
        String imageUrl,
        String description
) {
}
