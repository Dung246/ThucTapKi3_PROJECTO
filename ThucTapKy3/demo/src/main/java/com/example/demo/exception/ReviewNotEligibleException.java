package com.example.demo.exception;

public class ReviewNotEligibleException extends RuntimeException {
    public ReviewNotEligibleException() {
        super("You can only review products from your own completed orders");
    }
}
