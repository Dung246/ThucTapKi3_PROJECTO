package com.example.demo.service;

import com.example.demo.dto.order.OrderRequest;
import com.example.demo.dto.order.OrderResponse;
import com.example.demo.dto.order.OrderStatusUpdateRequest;
import com.example.demo.entity.CartItem;
import com.example.demo.entity.Order;
import com.example.demo.entity.OrderDetail;
import com.example.demo.entity.OrderStatus;
import com.example.demo.entity.OrderStatusHistory;
import com.example.demo.entity.Product;
import com.example.demo.entity.ProductStatus;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.exception.EmptyCartException;
import com.example.demo.exception.InvalidOrderStatusTransitionException;
import com.example.demo.exception.MissingCancellationNoteException;
import com.example.demo.exception.OrderCancellationRejectedException;
import com.example.demo.exception.OrderItemsUnavailableException;
import com.example.demo.exception.OrderNotFoundException;
import com.example.demo.repository.CartItemRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.OrderStatusHistoryRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class OrderService {

    /** Forward-only edges per Ban_hang_SRS.docx section 2.4's state diagram (Hinh 2.4). Terminal states map to an empty set. */
    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED_TRANSITIONS = Map.of(
            OrderStatus.PENDING, Set.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
            OrderStatus.CONFIRMED, Set.of(OrderStatus.SHIPPING, OrderStatus.CANCELLED),
            OrderStatus.SHIPPING, Set.of(OrderStatus.COMPLETED, OrderStatus.CANCELLED),
            OrderStatus.COMPLETED, Set.of(),
            OrderStatus.CANCELLED, Set.of()
    );

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository, OrderStatusHistoryRepository historyRepository,
                         CartItemRepository cartItemRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.historyRepository = historyRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public OrderResponse create(Long userId, OrderRequest request) {
        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
        if (cartItems.isEmpty()) {
            throw new EmptyCartException();
        }

        List<String> unavailable = new ArrayList<>();
        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            if (product.getStatus() != ProductStatus.ACTIVE || product.getQuantity() < item.getQuantity()) {
                unavailable.add(product.getName());
            }
        }
        if (!unavailable.isEmpty()) {
            throw new OrderItemsUnavailableException(unavailable);
        }

        User user = userRepository.getReferenceById(userId);

        BigDecimal total = cartItems.stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Order order = Order.builder()
                .user(user)
                .totalAmount(total)
                .status(OrderStatus.PENDING)
                .shippingAddress(request.shippingAddress())
                .paymentMethod(request.paymentMethod())
                .build();

        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            order.getOrderDetails().add(OrderDetail.builder()
                    .order(order)
                    .product(product)
                    .quantity(item.getQuantity())
                    .unitPrice(product.getPrice())
                    .build());
            product.setQuantity(product.getQuantity() - item.getQuantity());
        }

        orderRepository.save(order);

        historyRepository.save(OrderStatusHistory.builder()
                .order(order)
                .changedBy(user)
                .oldStatus(null)
                .newStatus(OrderStatus.PENDING)
                .build());

        cartItemRepository.deleteAll(cartItems);

        return OrderResponse.summary(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> list(Long userId, Role role, OrderStatus statusFilter) {
        List<Order> orders;
        if (role == Role.CUSTOMER) {
            orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        } else if (statusFilter != null) {
            orders = orderRepository.findByStatusOrderByCreatedAtDesc(statusFilter);
        } else {
            orders = orderRepository.findAllByOrderByCreatedAtDesc();
        }
        return orders.stream().map(OrderResponse::summary).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getById(Long userId, Role role, Long orderId) {
        Order order = getOwnedOrThrow(userId, role, orderId);
        return OrderResponse.detail(order, historyRepository.findByOrderIdOrderByChangedAtAsc(orderId));
    }

    /**
     * noRollbackFor is required for the COMPLETED->CANCELLED branch below: that branch logs an audit
     * row for manual review and then throws OrderCancellationRejectedException (409) to signal the
     * cancellation itself did NOT happen - without this, the default rollback-on-RuntimeException
     * behavior would undo the very audit log the exception is reporting on.
     */
    @Transactional(noRollbackFor = OrderCancellationRejectedException.class)
    public OrderResponse updateStatus(Long staffUserId, Long orderId, OrderStatusUpdateRequest request) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new OrderNotFoundException(orderId));

        OrderStatus from = order.getStatus();
        OrderStatus to = request.status();

        // UC-10 exception flow: a cancel request on an already-COMPLETED order is rejected outright
        // (never transitions to CANCELLED - COMPLETED stays a true terminal state), but the reason is
        // still required and logged to order_status_history for "xu ly ngoai le thu cong" (manual
        // follow-up), rather than a bare 409 with nothing recorded.
        if (from == OrderStatus.COMPLETED && to == OrderStatus.CANCELLED) {
            if (request.note() == null || request.note().isBlank()) {
                throw new MissingCancellationNoteException();
            }
            User staff = userRepository.getReferenceById(staffUserId);
            historyRepository.save(OrderStatusHistory.builder()
                    .order(order)
                    .changedBy(staff)
                    .oldStatus(from)
                    .newStatus(from) // status is unchanged - this row documents the rejected attempt, not a real transition
                    .note(request.note())
                    .build());
            throw new OrderCancellationRejectedException();
        }

        if (!ALLOWED_TRANSITIONS.getOrDefault(from, Set.of()).contains(to)) {
            throw new InvalidOrderStatusTransitionException(from, to);
        }
        if (from == OrderStatus.SHIPPING && to == OrderStatus.CANCELLED
                && (request.note() == null || request.note().isBlank())) {
            throw new MissingCancellationNoteException();
        }

        order.setStatus(to);

        User staff = userRepository.getReferenceById(staffUserId);
        historyRepository.save(OrderStatusHistory.builder()
                .order(order)
                .changedBy(staff)
                .oldStatus(from)
                .newStatus(to)
                .note(request.note())
                .build());

        return OrderResponse.detail(order, historyRepository.findByOrderIdOrderByChangedAtAsc(orderId));
    }

    /** CUSTOMER may only fetch their own order (404, not 403, to match the rest of the API - see KEY DECISIONS); STAFF/ADMIN may fetch any. */
    private Order getOwnedOrThrow(Long userId, Role role, Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new OrderNotFoundException(orderId));
        if (role == Role.CUSTOMER && !order.getUser().getId().equals(userId)) {
            throw new OrderNotFoundException(orderId);
        }
        return order;
    }
}
