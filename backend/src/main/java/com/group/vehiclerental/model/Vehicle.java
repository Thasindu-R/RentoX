package com.group.vehiclerental.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

/**
 * A vehicle in the rental fleet.
 */
@Entity
@Table(name = "vehicle")
// Class level, so it also applies when a lazy Vehicle proxy is serialised on
// its own. Hibernate's proxy carries these two internal fields, which
// Jackson cannot serialise.
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Vehicle {

    /** Allowed status values: AVAILABLE, RENTED, MAINTENANCE */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vehicle_id")
    private Integer vehicleId;

    @NotBlank(message = "Registration number is required")
    @Size(max = 20)
    @Column(name = "registration_number", nullable = false, unique = true, length = 20)
    private String registrationNumber;

    @NotBlank(message = "Brand is required")
    @Size(max = 50)
    @Column(name = "brand", nullable = false, length = 50)
    private String brand;

    @NotBlank(message = "Model is required")
    @Size(max = 50)
    @Column(name = "model", nullable = false, length = 50)
    private String model;

    /**
     * The column name is written with backticks because YEAR is also a MySQL
     * data type name. The backticks tell Hibernate to quote the identifier so
     * it matches the `year` column created in schema.sql.
     */
    @Min(value = 1950, message = "Year must be 1950 or later")
    @Max(value = 2100, message = "Year must be 2100 or earlier")
    @Column(name = "`year`")
    private Integer year;

    /** Allowed values: PETROL, DIESEL, HYBRID, ELECTRIC */
    @Size(max = 20)
    @Column(name = "fuel_type", length = 20)
    private String fuelType;

    /** Allowed values: MANUAL, AUTOMATIC */
    @Size(max = 20)
    @Column(name = "transmission", length = 20)
    private String transmission;

    /**
     * Owning side of the Vehicle-Category relationship: this class holds the
     * category_id foreign key column, so this is where @JoinColumn goes.
     *
     * FetchType.LAZY means loading a Vehicle does NOT immediately run a second
     * SELECT for its Category. The category is fetched only if something calls
     * getCategory(). The default for @ManyToOne is EAGER, which would fire an
     * extra query for every vehicle row - listing 50 vehicles becomes 51
     * queries (the "N+1 select" problem). LAZY keeps the list page to one query.
     *
     * @JsonIgnoreProperties hides the two internal fields Hibernate adds to a
     * lazy proxy object. Without it, Jackson tries to serialise
     * "hibernateLazyInitializer" and fails with a serialisation error.
     */
    @NotNull(message = "Category is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false,
                foreignKey = @jakarta.persistence.ForeignKey(name = "fk_vehicle_category"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "vehicles"})
    private Category category;

    /** Allowed values: AVAILABLE, RENTED, MAINTENANCE */
    @NotBlank(message = "Status is required")
    @Size(max = 20)
    @Column(name = "status", nullable = false, length = 20)
    private String status = "AVAILABLE";

    /**
     * File name of the uploaded photo, e.g. "vehicle-1-a3f9.jpg". The browser
     * loads it from http://localhost:8080/uploads/<name>. Null means the UI
     * shows a placeholder instead.
     */
    @Size(max = 255)
    @Column(name = "image_path", length = 255)
    private String imagePath;

    /** Inverse side - Booking.vehicle owns the vehicle_id foreign key. */
    @OneToMany(mappedBy = "vehicle")
    @JsonIgnore
    private List<Booking> bookings = new ArrayList<>();

    public Vehicle() {
    }

    public Vehicle(String registrationNumber, String brand, String model, Integer year,
                   String fuelType, String transmission, Category category, String status) {
        this.registrationNumber = registrationNumber;
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.fuelType = fuelType;
        this.transmission = transmission;
        this.category = category;
        this.status = status;
    }

    public Integer getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Integer vehicleId) {
        this.vehicleId = vehicleId;
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

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public List<Booking> getBookings() {
        return bookings;
    }

    public void setBookings(List<Booking> bookings) {
        this.bookings = bookings;
    }

    /**
     * Prints categoryId rather than the Category object. Reading only the id of
     * a lazy proxy does not hit the database, and it avoids recursion.
     */
    @Override
    public String toString() {
        return "Vehicle{" +
                "vehicleId=" + vehicleId +
                ", registrationNumber='" + registrationNumber + '\'' +
                ", brand='" + brand + '\'' +
                ", model='" + model + '\'' +
                ", year=" + year +
                ", fuelType='" + fuelType + '\'' +
                ", transmission='" + transmission + '\'' +
                ", categoryId=" + (category != null ? category.getCategoryId() : null) +
                ", status='" + status + '\'' +
                '}';
    }
}
