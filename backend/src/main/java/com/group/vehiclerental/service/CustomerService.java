package com.group.vehiclerental.service;

import com.group.vehiclerental.exception.BusinessRuleException;
import com.group.vehiclerental.exception.ResourceNotFoundException;
import com.group.vehiclerental.model.Customer;
import com.group.vehiclerental.repository.BookingRepository;
import com.group.vehiclerental.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
    private final ImageStorageService imageStorage;

    /**
     * Constructor injection. Spring sees one constructor and passes the beans
     * in automatically - no @Autowired annotation needed since Spring 4.3.
     */
    public CustomerService(CustomerRepository customerRepository,
                           BookingRepository bookingRepository,
                           ImageStorageService imageStorage) {
        this.customerRepository = customerRepository;
        this.bookingRepository = bookingRepository;
        this.imageStorage = imageStorage;
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

    // There is no create() here on purpose. A customer record only comes into
    // existence through the public sign-up form - see AuthService.signup().

    /**
     * Staff correcting a customer's details.
     *
     * Email and password are deliberately NOT updated here: the email is the
     * customer's login identifier and the password is theirs alone. Staff can
     * fix a name, phone, address, NIC or licence number.
     */
    public Customer update(Integer id, Customer changes) {
        Customer existing = findById(id);

        requireUniqueEmail(changes.getEmail(), id);
        requireUniqueNic(changes.getNic(), id);
        requireUniqueLicence(changes.getDrivingLicenceNo(), id);

        // The email is the customer's login, so it moves with the account when
        // they change it here. The password is untouched either way.
        if (changes.getEmail() != null && !changes.getEmail().isBlank()) {
            existing.setEmail(changes.getEmail().trim());
        }
        existing.setFullName(changes.getFullName());
        existing.setNic(blankToNull(changes.getNic()));
        existing.setDrivingLicenceNo(blankToNull(changes.getDrivingLicenceNo()));
        existing.setPhone(changes.getPhone());
        existing.setAddress(changes.getAddress());
        if (changes.getRegisteredDate() != null) {
            existing.setRegisteredDate(changes.getRegisteredDate());
        }
        return customerRepository.save(existing);
    }

    /**
     * Called by BookingService when a customer books a vehicle.
     *
     * Sign-up does not ask for licence details, so the rent form collects them
     * and they land here. Once stored they are reused for later bookings, and
     * the customer is only asked again if they change.
     */
    public Customer applyRentalDetails(Customer customer, String nic, String licenceNo) {
        boolean changed = false;

        if (nic != null && !nic.isBlank() && !nic.equals(customer.getNic())) {
            requireUniqueNic(nic, customer.getCustomerId());
            customer.setNic(nic.trim());
            changed = true;
        }
        if (licenceNo != null && !licenceNo.isBlank()
                && !licenceNo.equals(customer.getDrivingLicenceNo())) {
            requireUniqueLicence(licenceNo, customer.getCustomerId());
            customer.setDrivingLicenceNo(licenceNo.trim());
            changed = true;
        }

        if (customer.getNic() == null || customer.getDrivingLicenceNo() == null) {
            throw new BusinessRuleException(
                    "NIC and driving licence number are required to rent a vehicle.");
        }
        return changed ? customerRepository.save(customer) : customer;
    }

    /**
     * The customer's own photo. Stored the same way as a vehicle's: the file
     * goes to backend/uploads/ and only its name is kept on the row.
     */
    public Customer storePhoto(Integer id, MultipartFile file) {
        Customer customer = findById(id);
        String filename = imageStorage.store("customer", id, file);
        imageStorage.delete(customer.getImagePath());
        customer.setImagePath(filename);
        return customerRepository.save(customer);
    }

    public Customer removePhoto(Integer id) {
        Customer customer = findById(id);
        imageStorage.delete(customer.getImagePath());
        customer.setImagePath(null);
        return customerRepository.save(customer);
    }

    private void requireUniqueEmail(String email, Integer customerId) {
        if (email != null && !email.isBlank()
                && customerRepository.existsByEmailIgnoreCaseAndCustomerIdNot(email.trim(), customerId)) {
            throw new BusinessRuleException("Another account already uses the email " + email);
        }
    }

    private void requireUniqueNic(String nic, Integer customerId) {
        if (nic != null && !nic.isBlank()
                && customerRepository.existsByNicAndCustomerIdNot(nic.trim(), customerId)) {
            throw new BusinessRuleException("Another customer already uses NIC " + nic);
        }
    }

    private void requireUniqueLicence(String licence, Integer customerId) {
        if (licence != null && !licence.isBlank()
                && customerRepository.existsByDrivingLicenceNoAndCustomerIdNot(
                        licence.trim(), customerId)) {
            throw new BusinessRuleException(
                    "Another customer already uses licence number " + licence);
        }
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
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
