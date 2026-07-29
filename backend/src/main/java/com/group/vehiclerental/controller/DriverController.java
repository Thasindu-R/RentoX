package com.group.vehiclerental.controller;

import com.group.vehiclerental.model.Driver;
import com.group.vehiclerental.service.DriverService;
import jakarta.validation.Valid;
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

import java.util.List;

/**
 * Module 4 - Driver Management.
 *
 * GET    /api/drivers                      list, or ?available=true
 * GET    /api/drivers/search?q=sunil       search by name or NIC
 * GET    /api/drivers/{id}                 one driver
 * POST   /api/drivers                      create
 * PUT    /api/drivers/{id}                 update
 * PATCH  /api/drivers/{id}/availability    toggle availability
 * DELETE /api/drivers/{id}                 delete
 */
@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    private final DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    @GetMapping
    public List<Driver> list(@RequestParam(required = false) Boolean available) {
        return driverService.filter(available);
    }

    @GetMapping("/search")
    public List<Driver> search(@RequestParam(required = false) String q) {
        return driverService.search(q);
    }

    @GetMapping("/{id}")
    public Driver getOne(@PathVariable Integer id) {
        return driverService.findById(id);
    }

    @PostMapping
    public ResponseEntity<Driver> create(@Valid @RequestBody Driver driver) {
        Driver saved = driverService.create(driver);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public Driver update(@PathVariable Integer id, @Valid @RequestBody Driver driver) {
        return driverService.update(id, driver);
    }

    @PatchMapping("/{id}/availability")
    public Driver updateAvailability(@PathVariable Integer id, @RequestParam boolean available) {
        return driverService.updateAvailability(id, available);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        driverService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/count")
    public long count() {
        return driverService.count();
    }
}
