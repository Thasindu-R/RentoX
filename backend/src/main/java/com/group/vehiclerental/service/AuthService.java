package com.group.vehiclerental.service;

import com.group.vehiclerental.dto.LoginRequest;
import com.group.vehiclerental.dto.SignupRequest;
import com.group.vehiclerental.exception.BusinessRuleException;
import com.group.vehiclerental.model.Customer;
import com.group.vehiclerental.repository.CustomerRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Public sign-up and sign-in for customers.
 *
 * This is the only way a customer record is created - staff cannot add
 * customers. A customer signs up with name, email, phone and password; their
 * NIC and driving licence are filled in later by the rent form.
 */
@Service
@Transactional
public class AuthService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(CustomerRepository customerRepository, PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Customer signup(SignupRequest request) {
        String email = normalise(request.getEmail());

        if (customerRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessRuleException(
                    "An account with the email " + email + " already exists. Try signing in instead.");
        }

        Customer customer = new Customer();
        customer.setFullName(request.getFullName().trim());
        customer.setEmail(email);
        // Store the BCrypt hash, never the password the customer typed.
        customer.setPassword(passwordEncoder.encode(request.getPassword()));
        customer.setPhone(request.getPhone().trim());
        customer.setAddress(request.getAddress());
        customer.setRegisteredDate(LocalDate.now());
        // nic and drivingLicenceNo stay null until the first booking.

        return customerRepository.save(customer);
    }

    @Transactional(readOnly = true)
    public Customer login(LoginRequest request) {
        Customer customer = customerRepository.findByEmailIgnoreCase(normalise(request.getEmail()))
                .orElseThrow(() -> new BusinessRuleException("Incorrect email or password."));

        // matches() hashes the attempt and compares it with the stored hash.
        // The stored value is never decrypted - BCrypt cannot be reversed.
        if (!passwordEncoder.matches(request.getPassword(), customer.getPassword())) {
            // Deliberately the same message as above: telling an attacker that
            // the email exists but the password was wrong is a free hint.
            throw new BusinessRuleException("Incorrect email or password.");
        }
        return customer;
    }

    private String normalise(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
