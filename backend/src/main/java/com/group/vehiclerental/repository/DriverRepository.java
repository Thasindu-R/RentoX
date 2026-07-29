package com.group.vehiclerental.repository;

import com.group.vehiclerental.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Integer> {

    /** Proposal: "filter by availability". */
    List<Driver> findByAvailable(boolean available);

    List<Driver> findByFullNameContainingIgnoreCaseOrNicContainingIgnoreCase(String name, String nic);

    boolean existsByNic(String nic);

    boolean existsByLicenceNo(String licenceNo);

    boolean existsByNicAndDriverIdNot(String nic, Integer driverId);

    boolean existsByLicenceNoAndDriverIdNot(String licenceNo, Integer driverId);

    long countByAvailable(boolean available);
}
