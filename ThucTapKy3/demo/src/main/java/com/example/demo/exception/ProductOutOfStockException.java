package com.example.demo.exception;

public class ProductOutOfStockException extends RuntimeException {
    public ProductOutOfStockException(Long productId) {
        super("Product " + productId + " is out of stock");
    }
}
