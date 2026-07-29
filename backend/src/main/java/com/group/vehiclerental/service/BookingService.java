package com.group.vehiclerental.service;

import com.group.vehiclerental.dto.BookingRequest;
import com.group.vehiclerental.exception.BusinessRuleException;
import com.group.vehiclerental.exception.ResourceNotFoundException;
import com.group.vehiclerental.model.Booking;
import com.group.vehiclerental.model.Customer;
import com.group.vehiclerental.model.Driver;
import com.group.vehiclerental.model.Vehicle;
import com.group.vehiclerental.repository.BookingRepository;
import com.group.vehiclerental.repository.CustomerRepository;
import com.group.vehiclerental.repository.DriverRepository;
import com.group.vehiclerental.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

/**
 * Module 5 - Booking Management. The central module.
 *
 * Two rules from the proposal live here:
 *   1. total_days and total_amount are calculated, never sent by the browser.
 *   2. a vehicle cannot have two overlapping bookings.
 */
@Service
@Transactional
public class BookingService {

    /** Matches the SQL CHECK on booking.status. */
    public static final Set<String> ALLOWED_STATUSES =
            Set.of("PENDING", "ACTIVE", "COMPLETED", "CANCELLED");

    /** Statuses that actually hold a vehicle. */
    private static final Set<String> BLOCKING_STATUSES = Set.of("PENDING", "ACTIVE");

    /** Passed as "exclude nothing" when creating - no real booking has id 0. */
    private static final Integer EXCLUDE_NONE = 0;

    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final CustomerService customerService;

    public BookingService(BookingRepository bookingRepository,
                          CustomerRepository customerRepository,
                          VehicleRepository vehicleRepository,
                          DriverRepository driverRepository,
                          CustomerService customerService) {
        this.bookingRepository = bookingRepository;
        this.customerRepository = customerRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.customerService = customerService;
    }

    @Transactional(readOnly = true)
    public List<Booking> findAll() {
        return bookingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Booking findById(Integer id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", id));
    }

    /** Proposal: "filter by status or date range". */
    @Transactional(readOnly = true)
    public List<Booking> filter(String status, LocalDate from, LocalDate to) {
        if (status != null && !status.isBlank()) {
            validateStatus(status);
            return bookingRepository.findByStatus(status);
        }
        if (from != null && to != null) {
            if (to.isBefore(from)) {
                throw new BusinessRuleException("The 'to' date cannot be before the 'from' date");
            }
            // A booking is in range if it overlaps the window at all.
            return bookingRepository.findByStartDateLessThanEqualAndEndDateGreaterThanEqual(to, from);
        }
        return findAll();
    }

    @Transactional(readOnly = true)
    public List<Booking> findByCustomer(Integer customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer", customerId);
        }
        return bookingRepository.findByCustomer_CustomerId(customerId);
    }

    @Transactional(readOnly = true)
    public List<Booking> findByVehicle(Integer vehicleId) {
        if (!vehicleRepository.existsById(vehicleId)) {
            throw new ResourceNotFoundException("Vehicle", vehicleId);
        }
        return bookingRepository.findByVehicle_VehicleId(vehicleId);
    }

    public Booking create(BookingRequest request) {
        Booking booking = new Booking();
        applyRequest(booking, request, EXCLUDE_NONE);

        String status = (request.getStatus() == null || request.getStatus().isBlank())
                ? "PENDING"
                : request.getStatus();
        validateStatus(status);
        booking.setStatus(status);

        Booking saved = bookingRepository.save(booking);
        syncVehicleStatus(saved);
        return saved;
    }

    /** Proposal: "Change dates, extend a rental, or update status". */
    public Booking update(Integer id, BookingRequest request) {
        Booking existing = findById(id);
        applyRequest(existing, request, id);

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            validateStatus(request.getStatus());
            existing.setStatus(request.getStatus());
        }

        Booking saved = bookingRepository.save(existing);
        syncVehicleStatus(saved);
        return saved;
    }

    /** Status-only change, e.g. PENDING -> ACTIVE when the customer collects the vehicle. */
    public Booking updateStatus(Integer id, String status) {
        validateStatus(status);
        Booking booking = findById(id);
        booking.setStatus(status);
        Booking saved = bookingRepository.save(booking);
        syncVehicleStatus(saved);
        return saved;
    }

    /**
     * Proposal: "Cancel and remove a booking".
     * Payments are removed with it - the entity uses cascade = ALL and the SQL
     * foreign key is ON DELETE CASCADE, so the two agree.
     */
    public void delete(Integer id) {
        Booking booking = findById(id);
        Vehicle vehicle = booking.getVehicle();
        bookingRepository.delete(booking);
        bookingRepository.flush();
        releaseVehicleIfFree(vehicle);
    }

    @Transactional(readOnly = true)
    public long count() {
        return bookingRepository.count();
    }

    @Transactional(readOnly = true)
    public long countByStatus(String status) {
        return bookingRepository.countByStatus(status);
    }

    // ------------------------------------------------------------------
    //  Internal helpers
    // ------------------------------------------------------------------

    /**
     * Resolves the ids, checks the dates and the availability rules, then works
     * out total_days and total_amount.
     */
    private void applyRequest(Booking booking, BookingRequest request, Integer excludeBookingId) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", request.getCustomerId()));

        // The rent form supplies NIC and licence. This stores them on the
        // customer the first time, and refuses the booking if we still do not
        // have them - you cannot rent a vehicle without a driving licence.
        customer = customerService.applyRentalDetails(
                customer, request.getNic(), request.getDrivingLicenceNo());
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.getVehicleId()));

        Driver driver = null;
        if (request.getDriverId() != null) {
            driver = driverRepository.findById(request.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver", request.getDriverId()));
        }

        LocalDate start = request.getStartDate();
        LocalDate end = request.getEndDate();
        if (end.isBefore(start)) {
            throw new BusinessRuleException("End date cannot be before start date");
        }

        if ("MAINTENANCE".equals(vehicle.getStatus())) {
            throw new BusinessRuleException("Vehicle " + vehicle.getRegistrationNumber()
                    + " is under maintenance and cannot be booked");
        }

        // The conflict check the proposal asks for.
        if (bookingRepository.existsOverlappingBooking(
                vehicle.getVehicleId(), start, end, excludeBookingId)) {
            throw new BusinessRuleException("Vehicle " + vehicle.getRegistrationNumber()
                    + " is already booked between " + start + " and " + end);
        }

        if (driver != null && bookingRepository.existsOverlappingDriverBooking(
                driver.getDriverId(), start, end, excludeBookingId)) {
            throw new BusinessRuleException("Driver " + driver.getFullName()
                    + " is already assigned to another booking between " + start + " and " + end);
        }

        int totalDays = calculateTotalDays(start, end);
        BigDecimal totalAmount = calculateTotalAmount(vehicle, driver, totalDays);

        booking.setCustomer(customer);
        booking.setVehicle(vehicle);
        booking.setDriver(driver);
        booking.setStartDate(start);
        booking.setEndDate(end);
        booking.setTotalDays(totalDays);
        booking.setTotalAmount(totalAmount);
    }

    /**
     * Proposal: total_days = end_date - start_date.
     *
     * One adjustment: a same-day rental would give 0, which breaks both common
     * sense and the SQL CHECK (total_days > 0). A booking that starts and ends
     * on the same day is charged as one day.
     */
    public int calculateTotalDays(LocalDate start, LocalDate end) {
        long days = ChronoUnit.DAYS.between(start, end);
        return (int) Math.max(1, days);
    }

    /**
     * Proposal:
     *   total_amount = (total_days * category.daily_rate)
     *                + (total_days * driver.daily_charge, if a driver is chosen)
     */
    public BigDecimal calculateTotalAmount(Vehicle vehicle, Driver driver, int totalDays) {
        BigDecimal days = BigDecimal.valueOf(totalDays);
        BigDecimal total = vehicle.getCategory().getDailyRate().multiply(days);
        if (driver != null) {
            total = total.add(driver.getDailyCharge().multiply(days));
        }
        return total;
    }

    /**
     * Keeps vehicle.status in step with its bookings: ACTIVE marks the vehicle
     * RENTED, and finishing or cancelling frees it again - but only if no other
     * live booking still holds it.
     */
    private void syncVehicleStatus(Booking booking) {
        Vehicle vehicle = booking.getVehicle();
        if ("ACTIVE".equals(booking.getStatus())) {
            if (!"RENTED".equals(vehicle.getStatus())) {
                vehicle.setStatus("RENTED");
                vehicleRepository.save(vehicle);
            }
        } else if ("COMPLETED".equals(booking.getStatus()) || "CANCELLED".equals(booking.getStatus())) {
            releaseVehicleIfFree(vehicle);
        }
    }

    private void releaseVehicleIfFree(Vehicle vehicle) {
        if (vehicle == null || "MAINTENANCE".equals(vehicle.getStatus())) {
            return;
        }
        boolean stillHeld = bookingRepository.findByVehicle_VehicleId(vehicle.getVehicleId())
                .stream()
                .anyMatch(b -> BLOCKING_STATUSES.contains(b.getStatus()));
        if (!stillHeld && !"AVAILABLE".equals(vehicle.getStatus())) {
            vehicle.setStatus("AVAILABLE");
            vehicleRepository.save(vehicle);
        }
    }

    private void validateStatus(String status) {
        if (!ALLOWED_STATUSES.contains(status)) {
            throw new BusinessRuleException("Status must be one of " + ALLOWED_STATUSES
                    + " but was " + status);
        }
    }
}
