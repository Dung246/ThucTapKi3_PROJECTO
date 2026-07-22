package com.example.demo.dto.order;

import com.example.demo.entity.OrderDetail;

import java.math.BigDecimal;

public record OrderLineResponse(
        Long productId,
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
    public static OrderLineResponse from(OrderDetail detail) {
        BigDecimal lineTotal = detail.getUnitPrice().multiply(BigDecimal.valueOf(detail.getQuantity()));
        return new OrderLineResponse(
                detail.getProduct().getId(),
                detail.getProduct().getName(),
                detail.getQuantity(),
                detail.getUnitPrice(),
                lineTotal
        );
    }
}
