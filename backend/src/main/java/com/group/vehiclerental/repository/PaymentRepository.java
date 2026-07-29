package com.group.vehiclerental.repository;

import com.group.vehiclerental.model.Payment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    @Override
    @EntityGraph(attributePaths = "booking")
    List<Payment> findAll();

    @Override
    @EntityGraph(attributePaths = "booking")
    Optional<Payment> findById(Integer id);

    /** Proposal: "view payments for one booking". */
    @EntityGraph(attributePaths = "booking")
    List<Payment> findByBooking_BookingId(Integer bookingId);

    @EntityGraph(attributePaths = "booking")
    List<Payment> findByPaymentMethod(String paymentMethod);

    /**
     * Total already paid against one booking, used to work out the balance due.
     * COALESCE turns the SUM of zero rows (which is NULL) into 0.
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.booking.bookingId = :bookingId")
    BigDecimal sumAmountByBookingId(@Param("bookingId") Integer bookingId);

    boolean existsByBooking_BookingId(Integer bookingId);
}
