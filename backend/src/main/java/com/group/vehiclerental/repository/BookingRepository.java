package com.group.vehiclerental.repository;

import com.group.vehiclerental.model.Booking;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {

    /**
     * Every finder below uses @EntityGraph to pull the customer, the vehicle
     * (with its category) and the driver in a single query, instead of one
     * extra query per booking row.
     */
    @Override
    @EntityGraph(attributePaths = {"customer", "vehicle", "vehicle.category", "driver"})
    List<Booking> findAll();

    @Override
    @EntityGraph(attributePaths = {"customer", "vehicle", "vehicle.category", "driver"})
    Optional<Booking> findById(Integer id);

    @EntityGraph(attributePaths = {"customer", "vehicle", "vehicle.category", "driver"})
    List<Booking> findByStatus(String status);

    @EntityGraph(attributePaths = {"customer", "vehicle", "vehicle.category", "driver"})
    List<Booking> findByCustomer_CustomerId(Integer customerId);

    @EntityGraph(attributePaths = {"customer", "vehicle", "vehicle.category", "driver"})
    List<Booking> findByVehicle_VehicleId(Integer vehicleId);

    /** Proposal: "filter by status or date range". Bookings that touch the range. */
    @EntityGraph(attributePaths = {"customer", "vehicle", "vehicle.category", "driver"})
    List<Booking> findByStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate to, LocalDate from);

    /**
     * The double-booking check. Two date ranges overlap when
     *   existing.start <= new.end  AND  existing.end >= new.start
     *
     * CANCELLED and COMPLETED bookings are ignored - only PENDING and ACTIVE
     * ones actually hold the vehicle.
     *
     * excludeBookingId lets an update ignore the booking being edited. Pass 0
     * when creating, because no real booking can have id 0.
     */
    @Query("""
            SELECT COUNT(b) > 0 FROM Booking b
            WHERE b.vehicle.vehicleId = :vehicleId
              AND b.bookingId <> :excludeBookingId
              AND b.status IN ('PENDING', 'ACTIVE')
              AND b.startDate <= :endDate
              AND b.endDate >= :startDate
            """)
    boolean existsOverlappingBooking(@Param("vehicleId") Integer vehicleId,
                                     @Param("startDate") LocalDate startDate,
                                     @Param("endDate") LocalDate endDate,
                                     @Param("excludeBookingId") Integer excludeBookingId);

    /** Same idea for a driver - one driver cannot be on two rentals at once. */
    @Query("""
            SELECT COUNT(b) > 0 FROM Booking b
            WHERE b.driver.driverId = :driverId
              AND b.bookingId <> :excludeBookingId
              AND b.status IN ('PENDING', 'ACTIVE')
              AND b.startDate <= :endDate
              AND b.endDate >= :startDate
            """)
    boolean existsOverlappingDriverBooking(@Param("driverId") Integer driverId,
                                           @Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate,
                                           @Param("excludeBookingId") Integer excludeBookingId);

    boolean existsByCustomer_CustomerId(Integer customerId);

    boolean existsByVehicle_VehicleId(Integer vehicleId);

    boolean existsByDriver_DriverId(Integer driverId);

    long countByStatus(String status);
}
