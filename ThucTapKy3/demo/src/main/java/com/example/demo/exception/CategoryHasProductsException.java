package com.example.demo.exception;

public class CategoryHasProductsException extends RuntimeException {
    public CategoryHasProductsException(Long id) {
        super("Category " + id + " still has products assigned to it and cannot be deleted");
    }
}
