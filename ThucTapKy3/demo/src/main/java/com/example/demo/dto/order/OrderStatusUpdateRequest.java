package com.example.demo.dto.order;

import com.example.demo.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusUpdateRequest(
        @NotNull(message = "status is required") OrderStatus status,
        String note
) {
}
