package com.group.vehiclerental.controller;

import com.group.vehiclerental.model.Customer;
import com.group.vehiclerental.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Module 1 - Customer Management.
 *
 * GET    /api/customers          list all, or ?search=nimal
 * GET    /api/customers/{id}     one customer
 * PUT    /api/customers/{id}     update (the customer editing their own details)
 * POST   /api/customers/{id}/photo   upload a photo (multipart)
 * DELETE /api/customers/{id}/photo   remove the photo
 * DELETE /api/customers/{id}     delete
 *
 * Creating a customer is NOT here - see POST /api/auth/signup.
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

    // There is deliberately no POST here. Customers create their own account
    // through POST /api/auth/signup - staff cannot add them. Staff can still
    // view, correct and remove customer records below.

    @PutMapping("/{id}")
    public Customer update(@PathVariable Integer id, @Valid @RequestBody Customer customer) {
        return customerService.update(id, customer);
    }

    /**
     * Photo upload. Sent as multipart/form-data with a part named "file",
     * not JSON - a JPEG cannot travel inside a JSON body.
     */
    @PostMapping("/{id}/photo")
    public Customer uploadPhoto(@PathVariable Integer id,
                                @RequestPart("file") MultipartFile file) {
        return customerService.storePhoto(id, file);
    }

    @DeleteMapping("/{id}/photo")
    public Customer removePhoto(@PathVariable Integer id) {
        return customerService.removePhoto(id);
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
