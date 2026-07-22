package com.example.demo.exception;

public class InvalidImageTypeException extends RuntimeException {
    public InvalidImageTypeException(String message) {
        super(message);
    }
}
