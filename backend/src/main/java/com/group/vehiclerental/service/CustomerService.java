package com.group.vehiclerental.service;

import com.group.vehiclerental.exception.BusinessRuleException;
import com.group.vehiclerental.exception.ResourceNotFoundException;
import com.group.vehiclerental.model.Customer;
import com.group.vehiclerental.repository.BookingRepository;
import com.group.vehiclerental.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Module 1 - Customer Management.
 *
 * The service holds the rules; the controller only deals with HTTP and the
 * repository only deals with the database.
 */
@Service
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final BookingRepository bookingRepository;

    /**
     * Constructor injection. Spring sees one constructor and passes the beans
     * in automatically - no @Autowired annotation needed since Spring 4.3.
     */
    public CustomerService(CustomerRepository customerRepository,
                           BookingRepository bookingRepository) {
        this.customerRepository = customerRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public List<Customer> findAll() {
        return customerRepository.findAllByOrderByCustomerIdDesc();
    }

    @Transactional(readOnly = true)
    public Customer findById(Integer id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
    }

    /** Proposal: "search by name or NIC". Blank search returns everything. */
    @Transactional(readOnly = true)
    public List<Customer> search(String query) {
        if (query == null || query.isBlank()) {
            return findAll();
        }
        return customerRepository
                .findByFullNameContainingIgnoreCaseOrNicContainingIgnoreCase(query, query);
    }

    public Customer create(Customer customer) {
        if (customerRepository.existsByNic(customer.getNic())) {
            throw new BusinessRuleException(
                    "A customer with NIC " + customer.getNic() + " already exists");
        }
        if (customerRepository.existsByDrivingLicenceNo(customer.getDrivingLicenceNo())) {
            throw new BusinessRuleException("A customer with licence number "
                    + customer.getDrivingLicenceNo() + " already exists");
        }
        customer.setCustomerId(null);
        return customerRepository.save(customer);
    }

    public Customer update(Integer id, Customer changes) {
        Customer existing = findById(id);

        if (customerRepository.existsByNicAndCustomerIdNot(changes.getNic(), id)) {
            throw new BusinessRuleException(
                    "Another customer already uses NIC " + changes.getNic());
        }
        if (customerRepository.existsByDrivingLicenceNoAndCustomerIdNot(
                changes.getDrivingLicenceNo(), id)) {
            throw new BusinessRuleException("Another customer already uses licence number "
                    + changes.getDrivingLicenceNo());
        }

        existing.setFullName(changes.getFullName());
        existing.setNic(changes.getNic());
        existing.setDrivingLicenceNo(changes.getDrivingLicenceNo());
        existing.setEmail(changes.getEmail());
        existing.setPhone(changes.getPhone());
        existing.setAddress(changes.getAddress());
        if (changes.getRegisteredDate() != null) {
            existing.setRegisteredDate(changes.getRegisteredDate());
        }
        return customerRepository.save(existing);
    }

    /**
     * A customer with rental history cannot be deleted. The database would
     * refuse anyway (fk_booking_customer is ON DELETE RESTRICT), but checking
     * here produces a readable message instead of a raw SQL error.
     */
    public void delete(Integer id) {
        Customer customer = findById(id);
        if (bookingRepository.existsByCustomer_CustomerId(id)) {
            throw new BusinessRuleException("Cannot delete " + customer.getFullName()
                    + " because they have existing bookings");
        }
        customerRepository.delete(customer);
    }

    @Transactional(readOnly = true)
    public long count() {
        return customerRepository.count();
    }
}
