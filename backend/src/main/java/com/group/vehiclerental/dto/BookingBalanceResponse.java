package com.group.vehiclerental.dto;

import java.math.BigDecimal;

/**
 * Proposal, Payment module: "show balance due".
 * Returned by GET /api/payments/booking/{bookingId}/balance
 */
public class BookingBalanceResponse {

    private Integer bookingId;
    private BigDecimal totalAmount;
    private BigDecimal totalPaid;
    private BigDecimal balanceDue;
    private boolean fullySettled;

    public BookingBalanceResponse() {
    }

    public BookingBalanceResponse(Integer bookingId, BigDecimal totalAmount, BigDecimal totalPaid) {
        this.bookingId = bookingId;
        this.totalAmount = totalAmount;
        this.totalPaid = totalPaid;
        this.balanceDue = totalAmount.subtract(totalPaid);
        this.fullySettled = this.balanceDue.compareTo(BigDecimal.ZERO) <= 0;
    }

    public Integer getBookingId() {
        return bookingId;
    }

    public void setBookingId(Integer bookingId) {
        this.bookingId = bookingId;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public void setTotalPaid(BigDecimal totalPaid) {
        this.totalPaid = totalPaid;
    }

    public BigDecimal getBalanceDue() {
        return balanceDue;
    }

    public void setBalanceDue(BigDecimal balanceDue) {
        this.balanceDue = balanceDue;
    }

    public boolean isFullySettled() {
        return fullySettled;
    }

    public void setFullySettled(boolean fullySettled) {
        this.fullySettled = fullySettled;
    }
}
