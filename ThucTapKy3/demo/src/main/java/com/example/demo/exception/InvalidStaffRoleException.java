package com.example.demo.exception;

public class InvalidStaffRoleException extends RuntimeException {
    public InvalidStaffRoleException() {
        super("role must be STAFF or ADMIN");
    }
}
