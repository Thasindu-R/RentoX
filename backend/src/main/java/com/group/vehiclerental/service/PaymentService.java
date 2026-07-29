package com.group.vehiclerental.service;

import com.group.vehiclerental.dto.BookingBalanceResponse;
import com.group.vehiclerental.dto.PaymentRequest;
import com.group.vehiclerental.exception.BusinessRuleException;
import com.group.vehiclerental.exception.ResourceNotFoundException;
import com.group.vehiclerental.model.Booking;
import com.group.vehiclerental.model.Payment;
import com.group.vehiclerental.repository.BookingRepository;
import com.group.vehiclerental.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/**
 * Module 6 - Payment Management.
 */
@Service
@Transactional
public class PaymentService {

    /** Matches the SQL CHECKs on payment.payment_method and payment.payment_type. */
    public static final Set<String> ALLOWED_METHODS = Set.of("CASH", "CARD", "BANK_TRANSFER");
    public static final Set<String> ALLOWED_TYPES = Set.of("ADVANCE", "FULL", "BALANCE");

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          BookingRepository bookingRepository) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public List<Payment> findAll() {
        return paymentRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Payment findById(Integer id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", id));
    }

    /** Proposal: "view payments for one booking". */
    @Transactional(readOnly = true)
    public List<Payment> findByBooking(Integer bookingId) {
        requireBooking(bookingId);
        return paymentRepository.findByBooking_BookingId(bookingId);
    }

    /** Proposal: "show balance due". */
    @Transactional(readOnly = true)
    public BookingBalanceResponse getBalance(Integer bookingId) {
        Booking booking = requireBooking(bookingId);
        BigDecimal paid = paymentRepository.sumAmountByBookingId(bookingId);
        return new BookingBalanceResponse(bookingId, booking.getTotalAmount(), paid);
    }

    public Payment create(PaymentRequest request) {
        Booking booking = requireBooking(request.getBookingId());
        validateMethodAndType(request.getPaymentMethod(), request.getPaymentType());

        if ("CANCELLED".equals(booking.getStatus())) {
            throw new BusinessRuleException("Cannot record a payment against a cancelled booking");
        }

        BigDecimal alreadyPaid = paymentRepository.sumAmountByBookingId(booking.getBookingId());
        BigDecimal afterThisPayment = alreadyPaid.add(request.getAmount());
        if (afterThisPayment.compareTo(booking.getTotalAmount()) > 0) {
            throw new BusinessRuleException("Payment of " + request.getAmount()
                    + " would exceed the booking total. Already paid " + alreadyPaid
                    + " of " + booking.getTotalAmount()
                    + ", so the balance due is " + booking.getTotalAmount().subtract(alreadyPaid));
        }

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setPaymentType(request.getPaymentType());
        payment.setPaymentDate(request.getPaymentDate() != null
                ? request.getPaymentDate()
                : LocalDate.now());
        return paymentRepository.save(payment);
    }

    /** Proposal: "Correct a payment amount or method". */
    public Payment update(Integer id, PaymentRequest request) {
        Payment existing = findById(id);
        Booking booking = requireBooking(request.getBookingId());
        validateMethodAndType(request.getPaymentMethod(), request.getPaymentType());

        // Everything paid against the booking except this payment.
        BigDecimal otherPayments = paymentRepository
                .sumAmountByBookingId(booking.getBookingId())
                .subtract(existing.getBooking().getBookingId().equals(booking.getBookingId())
                        ? existing.getAmount()
                        : BigDecimal.ZERO);

        if (otherPayments.add(request.getAmount()).compareTo(booking.getTotalAmount()) > 0) {
            throw new BusinessRuleException("Updated amount would exceed the booking total of "
                    + booking.getTotalAmount() + ". Other payments already total " + otherPayments);
        }

        existing.setBooking(booking);
        existing.setAmount(request.getAmount());
        existing.setPaymentMethod(request.getPaymentMethod());
        existing.setPaymentType(request.getPaymentType());
        if (request.getPaymentDate() != null) {
            existing.setPaymentDate(request.getPaymentDate());
        }
        return paymentRepository.save(existing);
    }

    /** Proposal: "Remove an incorrectly entered payment". */
    public void delete(Integer id) {
        Payment payment = findById(id);
        paymentRepository.delete(payment);
    }

    @Transactional(readOnly = true)
    public long count() {
        return paymentRepository.count();
    }

    private Booking requireBooking(Integer bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", bookingId));
    }

    private void validateMethodAndType(String method, String type) {
        if (!ALLOWED_METHODS.contains(method)) {
            throw new BusinessRuleException("Payment method must be one of "
                    + ALLOWED_METHODS + " but was " + method);
        }
        if (!ALLOWED_TYPES.contains(type)) {
            throw new BusinessRuleException("Payment type must be one of "
                    + ALLOWED_TYPES + " but was " + type);
        }
    }
}
