package com.example.demo.dto.order;

import com.example.demo.entity.Order;
import com.example.demo.entity.OrderStatus;
import com.example.demo.entity.OrderStatusHistory;
import com.example.demo.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        Long userId,
        String customerName,
        BigDecimal totalAmount,
        OrderStatus status,
        String shippingAddress,
        PaymentMethod paymentMethod,
        LocalDateTime createdAt,
        List<OrderLineResponse> items,
        List<OrderStatusHistoryResponse> statusHistory
) {
    /** For list views: includes line items but omits status history (avoids an extra query per row). */
    public static OrderResponse summary(Order order) {
        return build(order, List.of());
    }

    /** For GET /api/orders/{id}: includes the full audit trail. */
    public static OrderResponse detail(Order order, List<OrderStatusHistory> history) {
        return build(order, history);
    }

    private static OrderResponse build(Order order, List<OrderStatusHistory> history) {
        var items = order.getOrderDetails().stream().map(OrderLineResponse::from).toList();
        var historyDtos = history.stream().map(OrderStatusHistoryResponse::from).toList();
        return new OrderResponse(
                order.getId(),
                order.getUser().getId(),
                order.getUser().getFullName(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getShippingAddress(),
                order.getPaymentMethod(),
                order.getCreatedAt(),
                items,
                historyDtos
        );
    }
}
