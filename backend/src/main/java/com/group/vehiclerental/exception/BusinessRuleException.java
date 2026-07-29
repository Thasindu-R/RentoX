package com.group.vehiclerental.exception;

/**
 * Thrown when the data is well formed but breaks a rule of the business,
 * for example booking a vehicle that is already booked for those dates, or
 * deleting a category that vehicles still use.
 *
 * GlobalExceptionHandler turns this into HTTP 409 Conflict.
 */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }
}
