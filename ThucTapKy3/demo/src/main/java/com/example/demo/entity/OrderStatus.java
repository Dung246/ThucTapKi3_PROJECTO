package com.example.demo.entity;

/** Forward-only transitions per Ban_hang_SRS.docx section 2.4's state diagram; see OrderService.ALLOWED_TRANSITIONS. */
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    SHIPPING,
    COMPLETED,
    CANCELLED
}
