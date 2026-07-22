package com.example.demo.exception;

public class DuplicateCategoryNameException extends RuntimeException {
    public DuplicateCategoryNameException(String name) {
        super("A category named '" + name + "' already exists");
    }
}
