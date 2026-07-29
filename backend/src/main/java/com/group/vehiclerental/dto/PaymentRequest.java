package com.group.vehiclerental.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

/** What the React payment form sends. */
public class PaymentRequest {

    @NotNull(message = "Booking is required")
    private Integer bookingId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    private BigDecimal amount;

    /** CASH, CARD, BANK_TRANSFER */
    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    /** ADVANCE, FULL, BALANCE */
    @NotBlank(message = "Payment type is required")
    private String paymentType;

    /** Optional - the server uses today's date when this is left out. */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate paymentDate;

    public PaymentRequest() {
    }

    public Integer getBookingId() {
        return bookingId;
    }

    public void setBookingId(Integer bookingId) {
        this.bookingId = bookingId;
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

    public String getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(String paymentType) {
        this.paymentType = paymentType;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }
}
