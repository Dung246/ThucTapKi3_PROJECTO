package com.example.demo.dto.order;

import com.example.demo.entity.OrderStatus;
import com.example.demo.entity.OrderStatusHistory;

import java.time.LocalDateTime;

public record OrderStatusHistoryResponse(
        OrderStatus oldStatus,
        OrderStatus newStatus,
        String changedByName,
        String note,
        LocalDateTime changedAt
) {
    public static OrderStatusHistoryResponse from(OrderStatusHistory history) {
        return new OrderStatusHistoryResponse(
                history.getOldStatus(),
                history.getNewStatus(),
                history.getChangedBy().getFullName(),
                history.getNote(),
                history.getChangedAt()
        );
    }
}
