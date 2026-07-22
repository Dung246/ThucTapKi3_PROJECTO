package com.example.demo.controller;

import com.example.demo.dto.order.OrderRequest;
import com.example.demo.dto.order.OrderResponse;
import com.example.demo.dto.order.OrderStatusUpdateRequest;
import com.example.demo.entity.OrderStatus;
import com.example.demo.security.SecurityUtils;
import com.example.demo.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(Authentication authentication, @Valid @RequestBody OrderRequest request) {
        Long userId = SecurityUtils.currentUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.create(userId, request));
    }

    /** CUSTOMER sees only their own orders; STAFF/ADMIN see all orders, optionally filtered by status. */
    @GetMapping
    public List<OrderResponse> list(Authentication authentication, @RequestParam(required = false) OrderStatus status) {
        Long userId = SecurityUtils.currentUserId(authentication);
        var role = SecurityUtils.currentRole(authentication);
        return orderService.list(userId, role, status);
    }

    @GetMapping("/{id}")
    public OrderResponse getById(Authentication authentication, @PathVariable Long id) {
        Long userId = SecurityUtils.currentUserId(authentication);
        var role = SecurityUtils.currentRole(authentication);
        return orderService.getById(userId, role, id);
    }

    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(Authentication authentication, @PathVariable Long id, @Valid @RequestBody OrderStatusUpdateRequest request) {
        Long staffUserId = SecurityUtils.currentUserId(authentication);
        return orderService.updateStatus(staffUserId, id, request);
    }
}
