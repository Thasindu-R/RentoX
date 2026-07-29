package com.group.vehiclerental.service;

import com.group.vehiclerental.config.FileStorageConfig;
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

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

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

    public VehicleService(VehicleRepository vehicleRepository,
                          CategoryRepository categoryRepository,
                          BookingRepository bookingRepository) {
        this.vehicleRepository = vehicleRepository;
        this.categoryRepository = categoryRepository;
        this.bookingRepository = bookingRepository;
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
        deletePhotoFile(vehicle.getImagePath());
        vehicleRepository.delete(vehicle);
    }

    /** Image types we accept. Anything else is rejected before we touch disk. */
    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS =
            Set.of("jpg", "jpeg", "png", "webp", "gif");

    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;   // 5 MB

    /**
     * Stores an uploaded photo for a vehicle.
     *
     * The file is written to backend/uploads/ under a generated name and only
     * that name is saved on the vehicle row - images do not go in the database.
     * Replacing a photo deletes the previous file so uploads do not pile up.
     */
    public Vehicle storePhoto(Integer id, MultipartFile file) {
        Vehicle vehicle = findById(id);

        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("No image file was uploaded");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new BusinessRuleException("Image must be 5 MB or smaller");
        }

        String extension = extensionOf(file.getOriginalFilename());
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            throw new BusinessRuleException(
                    "Image must be one of " + ALLOWED_IMAGE_EXTENSIONS + " but was ." + extension);
        }

        // A generated name, never the name the browser sent. A crafted filename
        // like "../../application.properties" could otherwise escape the folder.
        String filename = "vehicle-" + id + "-" + UUID.randomUUID().toString().substring(0, 8)
                + "." + extension;

        try {
            Path dir = FileStorageConfig.UPLOAD_DIR;
            Files.createDirectories(dir);
            Path target = dir.resolve(filename).normalize();
            if (!target.startsWith(dir)) {
                throw new BusinessRuleException("Invalid image file name");
            }
            try (var in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new BusinessRuleException("Could not save the image: " + e.getMessage());
        }

        deletePhotoFile(vehicle.getImagePath());
        vehicle.setImagePath(filename);
        return vehicleRepository.save(vehicle);
    }

    public Vehicle removePhoto(Integer id) {
        Vehicle vehicle = findById(id);
        deletePhotoFile(vehicle.getImagePath());
        vehicle.setImagePath(null);
        return vehicleRepository.save(vehicle);
    }

    private void deletePhotoFile(String filename) {
        if (filename == null || filename.isBlank()) {
            return;
        }
        try {
            Path existing = FileStorageConfig.UPLOAD_DIR.resolve(filename).normalize();
            if (existing.startsWith(FileStorageConfig.UPLOAD_DIR)) {
                Files.deleteIfExists(existing);
            }
        } catch (IOException ignored) {
            // A leftover file is not worth failing the request over.
        }
    }

    private String extensionOf(String originalName) {
        if (originalName == null || !originalName.contains(".")) {
            return "";
        }
        return originalName.substring(originalName.lastIndexOf('.') + 1)
                .toLowerCase(Locale.ROOT).trim();
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
