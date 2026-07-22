package com.example.demo.exception;

public class MissingCancellationNoteException extends RuntimeException {
    public MissingCancellationNoteException() {
        super("A note explaining the reason is required when cancelling an order that is already SHIPPING or COMPLETED");
    }
}
