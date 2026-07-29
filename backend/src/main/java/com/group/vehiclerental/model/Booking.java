package com.group.vehiclerental.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * A rental booking - the central entity of the system.
 *
 * total_days   = end_date - start_date
 * total_amount = (total_days * category.dailyRate)
 *              + (total_days * driver.dailyCharge, only if a driver is chosen)
 *
 * That calculation lives in BookingService, not here: entities describe the
 * data, services hold the business rules.
 */
@Entity
@Table(name = "booking")
// Class level, so it also applies when a lazy Booking proxy is serialised on
// its own. Hibernate's proxy carries these two internal fields, which
// Jackson cannot serialise.
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_id")
    private Integer bookingId;

    /**
     * LAZY so that listing bookings does not automatically pull every customer
     * row as well. Jackson still serialises the customer when the object is
     * actually loaded; "customer_id" alone is not enough for the booking list
     * page, so the service loads what it needs.
     *
     * @JsonIgnoreProperties strips the Hibernate proxy internals, and also
     * "bookings" so we never walk back Booking -> Customer -> bookings.
     */
    @NotNull(message = "Customer is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_booking_customer"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "bookings"})
    private Customer customer;

    @NotNull(message = "Vehicle is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_booking_vehicle"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "bookings"})
    private Vehicle vehicle;

    /**
     * Nullable: a self-drive rental has no driver. This is the only optional
     * relationship in the system, which is why nullable = true here and why
     * the SQL foreign key uses ON DELETE SET NULL.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = true,
                foreignKey = @ForeignKey(name = "fk_booking_driver"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "bookings"})
    private Driver driver;

    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @NotNull(message = "Total days is required")
    @Positive(message = "Total days must be at least 1")
    @Column(name = "total_days", nullable = false)
    private Integer totalDays;

    @NotNull(message = "Total amount is required")
    @PositiveOrZero(message = "Total amount cannot be negative")
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    /** Allowed values: PENDING, ACTIVE, COMPLETED, CANCELLED */
    @NotBlank(message = "Status is required")
    @Size(max = 20)
    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    /**
     * Inverse side. mappedBy = "booking" points at Payment.booking, which owns
     * the booking_id column.
     *
     * cascade = ALL with orphanRemoval mirrors the SQL ON DELETE CASCADE:
     * deleting a booking deletes its payments.
     *
     * @JsonIgnore because this collection is LAZY and spring.jpa.open-in-view
     * is false: by the time Jackson builds the JSON the database session has
     * closed, so serialising it would throw LazyInitializationException.
     * The booking detail screen loads them from GET /api/payments/booking/{id}
     * instead, which is the cleaner REST shape anyway.
     */
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Payment> payments = new ArrayList<>();

    public Booking() {
    }

    public Booking(Customer customer, Vehicle vehicle, Driver driver, LocalDate startDate,
                   LocalDate endDate, Integer totalDays, BigDecimal totalAmount, String status) {
        this.customer = customer;
        this.vehicle = vehicle;
        this.driver = driver;
        this.startDate = startDate;
        this.endDate = endDate;
        this.totalDays = totalDays;
        this.totalAmount = totalAmount;
        this.status = status;
    }

    public Integer getBookingId() {
        return bookingId;
    }

    public void setBookingId(Integer bookingId) {
        this.bookingId = bookingId;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public Driver getDriver() {
        return driver;
    }

    public void setDriver(Driver driver) {
        this.driver = driver;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Integer getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(Integer totalDays) {
        this.totalDays = totalDays;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<Payment> getPayments() {
        return payments;
    }

    public void setPayments(List<Payment> payments) {
        this.payments = payments;
    }

    /** Ids only - printing the related objects would trigger lazy loading. */
    @Override
    public String toString() {
        return "Booking{" +
                "bookingId=" + bookingId +
                ", customerId=" + (customer != null ? customer.getCustomerId() : null) +
                ", vehicleId=" + (vehicle != null ? vehicle.getVehicleId() : null) +
                ", driverId=" + (driver != null ? driver.getDriverId() : null) +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", totalDays=" + totalDays +
                ", totalAmount=" + totalAmount +
                ", status='" + status + '\'' +
                '}';
    }
}
