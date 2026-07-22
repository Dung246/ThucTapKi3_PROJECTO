package com.example.demo.exception;

public class DuplicateReviewException extends RuntimeException {
    public DuplicateReviewException() {
        super("You have already reviewed this product");
    }
}
