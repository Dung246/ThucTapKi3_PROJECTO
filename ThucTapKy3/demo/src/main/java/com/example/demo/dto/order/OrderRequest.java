package com.example.demo.dto.order;

import com.example.demo.entity.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OrderRequest(
        @NotBlank(message = "shippingAddress is required") String shippingAddress,
        @NotNull(message = "paymentMethod is required") PaymentMethod paymentMethod
) {
}
