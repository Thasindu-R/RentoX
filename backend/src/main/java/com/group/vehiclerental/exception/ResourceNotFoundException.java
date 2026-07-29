package com.group.vehiclerental.exception;

/**
 * Thrown when a record with the requested id does not exist.
 * GlobalExceptionHandler turns this into HTTP 404 Not Found.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    /** Convenience: new ResourceNotFoundException("Customer", 5) -> "Customer not found with id 5" */
    public ResourceNotFoundException(String entityName, Object id) {
        super(entityName + " not found with id " + id);
    }
}
