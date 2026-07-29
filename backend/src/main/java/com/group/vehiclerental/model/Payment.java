package com.group.vehiclerental.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A payment recorded against a booking. A booking may be settled in several
 * instalments, e.g. an ADVANCE followed by the BALANCE.
 */
@Entity
@Table(name = "payment")
// Class level, so it also applies when a lazy Payment proxy is serialised on
// its own. Hibernate's proxy carries these two internal fields, which
// Jackson cannot serialise.
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Integer paymentId;

    /**
     * Owning side: the payment table holds the booking_id column.
     *
     * LAZY because the payment list page shows amount, method and date - it
     * does not need the whole booking with its customer and vehicle attached
     * to every row. EAGER here would load a booking (and everything the
     * booking eagerly needs) for every single payment row.
     *
     * The ignore list keeps a payment's JSON to the booking's own columns
     * (id, dates, total, status). Its customer/vehicle/driver are LAZY and
     * would throw LazyInitializationException once the session has closed,
     * and "payments" would be a cycle straight back here.
     */
    @NotNull(message = "Booking is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_payment_booking"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler",
                           "payments", "customer", "vehicle", "driver"})
    private Booking booking;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** Allowed values: CASH, CARD, BANK_TRANSFER */
    @NotBlank(message = "Payment method is required")
    @Size(max = 20)
    @Column(name = "payment_method", nullable = false, length = 20)
    private String paymentMethod;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    /** Allowed values: ADVANCE, FULL, BALANCE */
    @NotBlank(message = "Payment type is required")
    @Size(max = 20)
    @Column(name = "payment_type", nullable = false, length = 20)
    private String paymentType;

    public Payment() {
    }

    public Payment(Booking booking, BigDecimal amount, String paymentMethod,
                   LocalDate paymentDate, String paymentType) {
        this.booking = booking;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paymentDate = paymentDate;
        this.paymentType = paymentType;
    }

    /** Fills in today's date if the caller did not supply one. */
    @PrePersist
    protected void onCreate() {
        if (paymentDate == null) {
            paymentDate = LocalDate.now();
        }
    }

    public Integer getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Integer paymentId) {
        this.paymentId = paymentId;
    }

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(String paymentType) {
        this.paymentType = paymentType;
    }

    @Override
    public String toString() {
        return "Payment{" +
                "paymentId=" + paymentId +
                ", bookingId=" + (booking != null ? booking.getBookingId() : null) +
                ", amount=" + amount +
                ", paymentMethod='" + paymentMethod + '\'' +
                ", paymentDate=" + paymentDate +
                ", paymentType='" + paymentType + '\'' +
                '}';
    }
}
