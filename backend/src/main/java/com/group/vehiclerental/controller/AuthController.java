package com.group.vehiclerental.controller;

import com.group.vehiclerental.dto.LoginRequest;
import com.group.vehiclerental.dto.SignupRequest;
import com.group.vehiclerental.model.Customer;
import com.group.vehiclerental.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public authentication for customers.
 *
 * POST /api/auth/signup   create an account
 * POST /api/auth/login    sign in
 *
 * Both return the Customer. The password field is annotated WRITE_ONLY on the
 * entity, so the hash is never included in the response.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<Customer> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(request));
    }

    @PostMapping("/login")
    public Customer login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
