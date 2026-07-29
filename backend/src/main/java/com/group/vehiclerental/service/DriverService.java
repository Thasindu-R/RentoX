package com.group.vehiclerental.service;

import com.group.vehiclerental.exception.BusinessRuleException;
import com.group.vehiclerental.exception.ResourceNotFoundException;
import com.group.vehiclerental.model.Driver;
import com.group.vehiclerental.repository.BookingRepository;
import com.group.vehiclerental.repository.DriverRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Module 4 - Driver Management.
 */
@Service
@Transactional
public class DriverService {

    private final DriverRepository driverRepository;
    private final BookingRepository bookingRepository;

    public DriverService(DriverRepository driverRepository,
                         BookingRepository bookingRepository) {
        this.driverRepository = driverRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public List<Driver> findAll() {
        return driverRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Driver findById(Integer id) {
        return driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", id));
    }

    /** Proposal: "filter by availability". Null means no filter. */
    @Transactional(readOnly = true)
    public List<Driver> filter(Boolean available) {
        if (available == null) {
            return findAll();
        }
        return driverRepository.findByAvailable(available);
    }

    @Transactional(readOnly = true)
    public List<Driver> search(String query) {
        if (query == null || query.isBlank()) {
            return findAll();
        }
        return driverRepository
                .findByFullNameContainingIgnoreCaseOrNicContainingIgnoreCase(query, query);
    }

    public Driver create(Driver driver) {
        if (driverRepository.existsByNic(driver.getNic())) {
            throw new BusinessRuleException(
                    "A driver with NIC " + driver.getNic() + " already exists");
        }
        if (driverRepository.existsByLicenceNo(driver.getLicenceNo())) {
            throw new BusinessRuleException("A driver with licence number "
                    + driver.getLicenceNo() + " already exists");
        }
        driver.setDriverId(null);
        return driverRepository.save(driver);
    }

    public Driver update(Integer id, Driver changes) {
        Driver existing = findById(id);

        if (driverRepository.existsByNicAndDriverIdNot(changes.getNic(), id)) {
            throw new BusinessRuleException("Another driver already uses NIC " + changes.getNic());
        }
        if (driverRepository.existsByLicenceNoAndDriverIdNot(changes.getLicenceNo(), id)) {
            throw new BusinessRuleException("Another driver already uses licence number "
                    + changes.getLicenceNo());
        }

        existing.setFullName(changes.getFullName());
        existing.setNic(changes.getNic());
        existing.setLicenceNo(changes.getLicenceNo());
        existing.setPhone(changes.getPhone());
        existing.setDailyCharge(changes.getDailyCharge());
        existing.setAvailable(changes.isAvailable());
        return driverRepository.save(existing);
    }

    /** Toggling availability from the list page. */
    public Driver updateAvailability(Integer id, boolean available) {
        Driver driver = findById(id);
        driver.setAvailable(available);
        return driverRepository.save(driver);
    }

    public void delete(Integer id) {
        Driver driver = findById(id);
        if (bookingRepository.existsByDriver_DriverId(id)) {
            throw new BusinessRuleException("Cannot delete " + driver.getFullName()
                    + " because they are assigned to existing bookings");
        }
        driverRepository.delete(driver);
    }

    @Transactional(readOnly = true)
    public long count() {
        return driverRepository.count();
    }
}
