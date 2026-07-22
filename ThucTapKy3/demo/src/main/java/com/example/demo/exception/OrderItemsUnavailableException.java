package com.example.demo.exception;

import java.util.List;

public class OrderItemsUnavailableException extends RuntimeException {
    public OrderItemsUnavailableException(List<String> productNames) {
        super("The following products are unavailable or out of stock: " + String.join(", ", productNames));
    }
}
