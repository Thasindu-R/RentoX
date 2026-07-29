package com.group.vehiclerental.controller;

import com.group.vehiclerental.dto.BookingRequest;
import com.group.vehiclerental.model.Booking;
import com.group.vehiclerental.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Module 5 - Booking Management.
 *
 * GET    /api/bookings                          list, or ?status=ACTIVE
 *                                               or ?from=2026-08-01&to=2026-08-31
 * GET    /api/bookings/{id}                     one booking with its payments
 * GET    /api/bookings/customer/{customerId}    a customer's rental history
 * GET    /api/bookings/vehicle/{vehicleId}      a vehicle's booking history
 * POST   /api/bookings                          create (total calculated here)
 * PUT    /api/bookings/{id}                     update dates / extend
 * PATCH  /api/bookings/{id}/status              change status only
 * DELETE /api/bookings/{id}                     cancel and remove
 */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public List<Booking> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return bookingService.filter(status, from, to);
    }

    @GetMapping("/{id}")
    public Booking getOne(@PathVariable Integer id) {
        return bookingService.findById(id);
    }

    @GetMapping("/customer/{customerId}")
    public List<Booking> byCustomer(@PathVariable Integer customerId) {
        return bookingService.findByCustomer(customerId);
    }

    @GetMapping("/vehicle/{vehicleId}")
    public List<Booking> byVehicle(@PathVariable Integer vehicleId) {
        return bookingService.findByVehicle(vehicleId);
    }

    @PostMapping
    public ResponseEntity<Booking> create(@Valid @RequestBody BookingRequest request) {
        Booking saved = bookingService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public Booking update(@PathVariable Integer id, @Valid @RequestBody BookingRequest request) {
        return bookingService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public Booking updateStatus(@PathVariable Integer id, @RequestParam String status) {
        return bookingService.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        bookingService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/count")
    public long count(@RequestParam(required = false) String status) {
        return (status == null || status.isBlank())
                ? bookingService.count()
                : bookingService.countByStatus(status);
    }
}
