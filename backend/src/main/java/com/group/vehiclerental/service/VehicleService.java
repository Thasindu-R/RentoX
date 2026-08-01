package com.group.vehiclerental.service;

import com.group.vehiclerental.dto.VehicleRequest;
import com.group.vehiclerental.exception.BusinessRuleException;
import com.group.vehiclerental.exception.ResourceNotFoundException;
import com.group.vehiclerental.model.Category;
import com.group.vehiclerental.model.Vehicle;
import com.group.vehiclerental.repository.BookingRepository;
import com.group.vehiclerental.repository.CategoryRepository;
import com.group.vehiclerental.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;

/**
 * Module 3 - Vehicle Management.
 */
@Service
@Transactional
public class VehicleService {

    /** The only values vehicle.status is allowed to take (matches the SQL CHECK). */
    public static final Set<String> ALLOWED_STATUSES = Set.of("AVAILABLE", "RENTED", "MAINTENANCE");

    private final VehicleRepository vehicleRepository;
    private final CategoryRepository categoryRepository;
    private final BookingRepository bookingRepository;
    private final ImageStorageService imageStorage;

    public VehicleService(VehicleRepository vehicleRepository,
                          CategoryRepository categoryRepository,
                          BookingRepository bookingRepository,
                          ImageStorageService imageStorage) {
        this.vehicleRepository = vehicleRepository;
        this.categoryRepository = categoryRepository;
        this.bookingRepository = bookingRepository;
        this.imageStorage = imageStorage;
    }

    @Transactional(readOnly = true)
    public List<Vehicle> findAll() {
        return vehicleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Vehicle findById(Integer id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
    }

    /** Proposal: "filter by category or availability status" - either, both or neither. */
    @Transactional(readOnly = true)
    public List<Vehicle> filter(Integer categoryId, String status) {
        if (status != null && !status.isBlank()) {
            validateStatus(status);
        }
        boolean hasCategory = categoryId != null;
        boolean hasStatus = status != null && !status.isBlank();

        if (hasCategory && hasStatus) {
            return vehicleRepository.findByCategory_CategoryIdAndStatus(categoryId, status);
        }
        if (hasCategory) {
            return vehicleRepository.findByCategory_CategoryId(categoryId);
        }
        if (hasStatus) {
            return vehicleRepository.findByStatus(status);
        }
        return findAll();
    }

    @Transactional(readOnly = true)
    public List<Vehicle> search(String query) {
        if (query == null || query.isBlank()) {
            return findAll();
        }
        return vehicleRepository
                .findByRegistrationNumberContainingIgnoreCaseOrBrandContainingIgnoreCaseOrModelContainingIgnoreCase(
                        query, query, query);
    }

    public Vehicle create(VehicleRequest request) {
        if (vehicleRepository.existsByRegistrationNumber(request.getRegistrationNumber())) {
            throw new BusinessRuleException("A vehicle with registration number "
                    + request.getRegistrationNumber() + " already exists");
        }
        Vehicle vehicle = new Vehicle();
        applyRequest(vehicle, request);
        return vehicleRepository.save(vehicle);
    }

    public Vehicle update(Integer id, VehicleRequest request) {
        Vehicle existing = findById(id);
        if (vehicleRepository.existsByRegistrationNumberAndVehicleIdNot(
                request.getRegistrationNumber(), id)) {
            throw new BusinessRuleException("Another vehicle already uses registration number "
                    + request.getRegistrationNumber());
        }
        applyRequest(existing, request);
        return vehicleRepository.save(existing);
    }

    /** Proposal: "change status" straight from the list page. */
    public Vehicle updateStatus(Integer id, String status) {
        validateStatus(status);
        Vehicle vehicle = findById(id);
        vehicle.setStatus(status);
        return vehicleRepository.save(vehicle);
    }

    public void delete(Integer id) {
        Vehicle vehicle = findById(id);
        if (bookingRepository.existsByVehicle_VehicleId(id)) {
            throw new BusinessRuleException("Cannot delete vehicle "
                    + vehicle.getRegistrationNumber() + " because it has bookings against it");
        }
        imageStorage.delete(vehicle.getImagePath());
        vehicleRepository.delete(vehicle);
    }

    /**
     * Stores an uploaded photo for a vehicle.
     *
     * The file is written to backend/uploads/ under a generated name and only
     * that name is saved on the vehicle row - images do not go in the database.
     * Replacing a photo deletes the previous file so uploads do not pile up.
     */
    public Vehicle storePhoto(Integer id, MultipartFile file) {
        Vehicle vehicle = findById(id);
        String filename = imageStorage.store("vehicle", id, file);
        imageStorage.delete(vehicle.getImagePath());
        vehicle.setImagePath(filename);
        return vehicleRepository.save(vehicle);
    }

    public Vehicle removePhoto(Integer id) {
        Vehicle vehicle = findById(id);
        imageStorage.delete(vehicle.getImagePath());
        vehicle.setImagePath(null);
        return vehicleRepository.save(vehicle);
    }

    @Transactional(readOnly = true)
    public long count() {
        return vehicleRepository.count();
    }

    @Transactional(readOnly = true)
    public long countByStatus(String status) {
        return vehicleRepository.countByStatus(status);
    }

    /** Copies the DTO onto the entity, turning categoryId into a real Category. */
    private void applyRequest(Vehicle vehicle, VehicleRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));

        String status = (request.getStatus() == null || request.getStatus().isBlank())
                ? "AVAILABLE"
                : request.getStatus();
        validateStatus(status);

        vehicle.setRegistrationNumber(request.getRegistrationNumber());
        vehicle.setBrand(request.getBrand());
        vehicle.setModel(request.getModel());
        vehicle.setYear(request.getYear());
        vehicle.setFuelType(request.getFuelType());
        vehicle.setTransmission(request.getTransmission());
        vehicle.setCategory(category);
        vehicle.setStatus(status);
    }

    private void validateStatus(String status) {
        if (!ALLOWED_STATUSES.contains(status)) {
            throw new BusinessRuleException("Status must be one of " + ALLOWED_STATUSES
                    + " but was " + status);
        }
    }
}
