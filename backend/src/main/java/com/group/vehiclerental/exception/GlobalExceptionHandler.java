package com.group.vehiclerental.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * One place that turns exceptions into tidy JSON error responses.
 *
 * @RestControllerAdvice means these methods apply to every controller in the
 * application, so no controller needs its own try/catch. The React frontend
 * always receives the same error shape:
 *
 *   { "timestamp": ..., "status": 404, "error": "Not Found", "message": "..." }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private Map<String, Object> body(HttpStatus status, String message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("timestamp", LocalDateTime.now().toString());
        map.put("status", status.value());
        map.put("error", status.getReasonPhrase());
        map.put("message", message);
        return map;
    }

    /** A record id that does not exist -> 404 */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(body(HttpStatus.NOT_FOUND, ex.getMessage()));
    }

    /** A broken business rule (overlapping booking, category in use) -> 409 */
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessRule(BusinessRuleException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(body(HttpStatus.CONFLICT, ex.getMessage()));
    }

    /**
     * Bean Validation failures on an @Valid request body -> 400, with a
     * field-by-field map so the React form can show the message next to the
     * offending input.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        Map<String, Object> response = body(HttpStatus.BAD_REQUEST, "Validation failed");
        response.put("fieldErrors", fieldErrors);
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * A database constraint we did not catch first - a duplicate UNIQUE value
     * or a foreign key that still has children. Returned as 409 rather than a
     * 500 so the frontend can show something meaningful.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        String message = "Operation violates a database constraint "
                + "(duplicate value, or the record is still referenced elsewhere).";
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(body(HttpStatus.CONFLICT, message));
    }
}
