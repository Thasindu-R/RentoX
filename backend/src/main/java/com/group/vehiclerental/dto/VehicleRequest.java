package com.group.vehiclerental.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * What the React vehicle form sends.
 *
 * The rule across this project: a module whose table has a foreign key takes a
 * request DTO carrying plain ids, so the frontend posts
 *   { "categoryId": 1, ... }
 * instead of the awkward nested { "category": { "categoryId": 1 }, ... }.
 * The service turns the id into a real Category before saving.
 */
public class VehicleRequest {

    @NotBlank(message = "Registration number is required")
    @Size(max = 20)
    private String registrationNumber;

    @NotBlank(message = "Brand is required")
    private String brand;

    @NotBlank(message = "Model is required")
    private String model;

    @Min(value = 1950, message = "Year must be 1950 or later")
    @Max(value = 2100, message = "Year must be 2100 or earlier")
    private Integer year;

    /** PETROL, DIESEL, HYBRID, ELECTRIC */
    private String fuelType;

    /** MANUAL, AUTOMATIC */
    private String transmission;

    @NotNull(message = "Category is required")
    private Integer categoryId;

    /** AVAILABLE, RENTED, MAINTENANCE - defaults to AVAILABLE when left out. */
    private String status;

    public VehicleRequest() {
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public String getFuelType() {
        return fuelType;
    }

    public void setFuelType(String fuelType) {
        this.fuelType = fuelType;
    }

    public String getTransmission() {
        return transmission;
    }

    public void setTransmission(String transmission) {
        this.transmission = transmission;
    }

    public Integer getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Integer categoryId) {
        this.categoryId = categoryId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
