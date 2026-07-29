package com.group.vehiclerental.controller;

import com.group.vehiclerental.dto.BookingBalanceResponse;
import com.group.vehiclerental.dto.PaymentRequest;
import com.group.vehiclerental.model.Payment;
import com.group.vehiclerental.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Module 6 - Payment Management.
 *
 * GET    /api/payments                                list all
 * GET    /api/payments/{id}                           one payment
 * GET    /api/payments/booking/{bookingId}            payments for one booking
 * GET    /api/payments/booking/{bookingId}/balance    total, paid and balance due
 * POST   /api/payments                                record a payment
 * PUT    /api/payments/{id}                           correct a payment
 * DELETE /api/payments/{id}                           remove a wrong entry
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public List<Payment> list() {
        return paymentService.findAll();
    }

    @GetMapping("/{id}")
    public Payment getOne(@PathVariable Integer id) {
        return paymentService.findById(id);
    }

    @GetMapping("/booking/{bookingId}")
    public List<Payment> byBooking(@PathVariable Integer bookingId) {
        return paymentService.findByBooking(bookingId);
    }

    @GetMapping("/booking/{bookingId}/balance")
    public BookingBalanceResponse balance(@PathVariable Integer bookingId) {
        return paymentService.getBalance(bookingId);
    }

    @PostMapping
    public ResponseEntity<Payment> create(@Valid @RequestBody PaymentRequest request) {
        Payment saved = paymentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public Payment update(@PathVariable Integer id, @Valid @RequestBody PaymentRequest request) {
        return paymentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        paymentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/count")
    public long count() {
        return paymentService.count();
    }
}
