package com.example.demo.exception;

public class DuplicateProductNameException extends RuntimeException {
    public DuplicateProductNameException(String name) {
        super("A product named '" + name + "' already exists");
    }
}
