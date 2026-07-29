package com.group.vehiclerental.controller;

import com.group.vehiclerental.model.Customer;
import com.group.vehiclerental.service.CustomerService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Module 1 - Customer Management.
 *
 * GET    /api/customers          list all, or ?search=nimal
 * GET    /api/customers/{id}     one customer
 * POST   /api/customers          create
 * PUT    /api/customers/{id}     update
 * DELETE /api/customers/{id}     delete
 */
@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public List<Customer> list(@RequestParam(required = false) String search) {
        return customerService.search(search);
    }

    @GetMapping("/{id}")
    public Customer getOne(@PathVariable Integer id) {
        return customerService.findById(id);
    }

    /**
     * @Valid switches on the Bean Validation annotations in the Customer entity.
     * A failure never reaches this method - Spring throws, and
     * GlobalExceptionHandler turns it into a 400 with a field-by-field message.
     */
    @PostMapping
    public ResponseEntity<Customer> create(@Valid @RequestBody Customer customer) {
        Customer saved = customerService.create(customer);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public Customer update(@PathVariable Integer id, @Valid @RequestBody Customer customer) {
        return customerService.update(id, customer);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        customerService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/count")
    public long count() {
        return customerService.count();
    }
}
