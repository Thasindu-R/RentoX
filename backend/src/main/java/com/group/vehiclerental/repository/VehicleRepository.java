package com.group.vehiclerental.repository;

import com.group.vehiclerental.model.Vehicle;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {

    /**
     * @EntityGraph tells Hibernate to fetch the category in the SAME query
     * (a LEFT JOIN FETCH) even though the field is marked LAZY.
     *
     * Two reasons this matters:
     *  1. It avoids the N+1 problem - one query for 50 vehicles, not 51.
     *  2. spring.jpa.open-in-view=false closes the persistence context when
     *     the service method returns, so a still-lazy category would blow up
     *     with LazyInitializationException while Jackson builds the JSON.
     */
    @Override
    @EntityGraph(attributePaths = "category")
    List<Vehicle> findAll();

    @Override
    @EntityGraph(attributePaths = "category")
    Optional<Vehicle> findById(Integer id);

    /** Proposal: "filter by category or availability status". */
    @EntityGraph(attributePaths = "category")
    List<Vehicle> findByCategory_CategoryId(Integer categoryId);

    @EntityGraph(attributePaths = "category")
    List<Vehicle> findByStatus(String status);

    @EntityGraph(attributePaths = "category")
    List<Vehicle> findByCategory_CategoryIdAndStatus(Integer categoryId, String status);

    @EntityGraph(attributePaths = "category")
    List<Vehicle> findByRegistrationNumberContainingIgnoreCaseOrBrandContainingIgnoreCaseOrModelContainingIgnoreCase(
            String registrationNumber, String brand, String model);

    boolean existsByRegistrationNumber(String registrationNumber);

    boolean existsByRegistrationNumberAndVehicleIdNot(String registrationNumber, Integer vehicleId);

    /** Used by CategoryService to block deleting a category still in use. */
    boolean existsByCategory_CategoryId(Integer categoryId);

    long countByCategory_CategoryId(Integer categoryId);

    long countByStatus(String status);
}
