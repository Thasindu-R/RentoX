package com.group.vehiclerental.controller;

import com.group.vehiclerental.dto.VehicleRequest;
import com.group.vehiclerental.model.Vehicle;
import com.group.vehiclerental.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Module 3 - Vehicle Management.
 *
 * GET    /api/vehicles                      list, or ?categoryId=1&status=AVAILABLE
 * GET    /api/vehicles/search?q=toyota      search by reg no, brand or model
 * GET    /api/vehicles/{id}                 one vehicle
 * POST   /api/vehicles                      create
 * PUT    /api/vehicles/{id}                 update
 * PATCH  /api/vehicles/{id}/status          change status only
 * POST   /api/vehicles/{id}/photo           upload a photo (multipart)
 * DELETE /api/vehicles/{id}/photo           remove the photo
 * DELETE /api/vehicles/{id}                 delete
 */
@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public List<Vehicle> list(@RequestParam(required = false) Integer categoryId,
                              @RequestParam(required = false) String status) {
        return vehicleService.filter(categoryId, status);
    }

    @GetMapping("/search")
    public List<Vehicle> search(@RequestParam(required = false) String q) {
        return vehicleService.search(q);
    }

    @GetMapping("/{id}")
    public Vehicle getOne(@PathVariable Integer id) {
        return vehicleService.findById(id);
    }

    @PostMapping
    public ResponseEntity<Vehicle> create(@Valid @RequestBody VehicleRequest request) {
        Vehicle saved = vehicleService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public Vehicle update(@PathVariable Integer id, @Valid @RequestBody VehicleRequest request) {
        return vehicleService.update(id, request);
    }

    /** PATCH because it changes one field, not the whole record. */
    @PatchMapping("/{id}/status")
    public Vehicle updateStatus(@PathVariable Integer id, @RequestParam String status) {
        return vehicleService.updateStatus(id, status);
    }

    /**
     * Photo upload. Sent as multipart/form-data with a part named "file",
     * not JSON - a JPEG cannot travel inside a JSON body.
     */
    @PostMapping("/{id}/photo")
    public Vehicle uploadPhoto(@PathVariable Integer id,
                               @RequestPart("file") MultipartFile file) {
        return vehicleService.storePhoto(id, file);
    }

    @DeleteMapping("/{id}/photo")
    public Vehicle removePhoto(@PathVariable Integer id) {
        return vehicleService.removePhoto(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        vehicleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/count")
    public long count(@RequestParam(required = false) String status) {
        return (status == null || status.isBlank())
                ? vehicleService.count()
                : vehicleService.countByStatus(status);
    }
}
