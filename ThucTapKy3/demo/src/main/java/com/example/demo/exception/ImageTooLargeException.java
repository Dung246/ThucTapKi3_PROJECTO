package com.example.demo.exception;

public class ImageTooLargeException extends RuntimeException {
    public ImageTooLargeException(long maxBytes) {
        super("Image file must not exceed " + (maxBytes / (1024 * 1024)) + "MB");
    }
}
