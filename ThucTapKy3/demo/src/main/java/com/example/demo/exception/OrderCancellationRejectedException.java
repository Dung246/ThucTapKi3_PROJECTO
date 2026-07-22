package com.example.demo.exception;

public class OrderCancellationRejectedException extends RuntimeException {
    public OrderCancellationRejectedException() {
        super("This order has already been completed and cannot be cancelled; your reason has been logged for manual review");
    }
}
