package com.example.demo.exception;

public class AccountLockedException extends RuntimeException {
    public AccountLockedException() {
        super("This account has been locked. Contact an administrator.");
    }
}
