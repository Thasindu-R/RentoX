package com.group.vehiclerental.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Vehicle category (Car, Van, SUV, Motorbike, Bus).
 * The daily_rate stored here is what the booking cost calculation uses.
 */
@Entity
@Table(name = "category")
// Class level, so it also applies when a lazy Category proxy is serialised on
// its own (e.g. returned straight from a controller). Hibernate replaces a
// lazy object with a proxy that carries these two internal fields; Jackson
// cannot serialise them and throws unless they are ignored here.
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Category {

    /**
     * GenerationType.IDENTITY matches MySQL's AUTO_INCREMENT - the database
     * generates the value on INSERT and Hibernate reads it back.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Integer categoryId;

    @NotBlank(message = "Category name is required")
    @Size(max = 50)
    @Column(name = "category_name", nullable = false, unique = true, length = 50)
    private String categoryName;

    @Size(max = 200)
    @Column(name = "description", length = 200)
    private String description;

    /**
     * BigDecimal, not double. Money must never be stored in a floating point
     * type - 0.1 + 0.2 is not exactly 0.3 in binary floating point, and rental
     * totals would drift by cents. This maps to DECIMAL(10,2).
     */
    @NotNull(message = "Daily rate is required")
    @Positive(message = "Daily rate must be greater than zero")
    @Column(name = "daily_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyRate;

    @Positive(message = "Seating capacity must be greater than zero")
    @Column(name = "seating_capacity")
    private Integer seatingCapacity;

    /**
     * Inverse (non-owning) side of the Category-Vehicle relationship.
     * mappedBy = "category" points at the Vehicle.category field, which is
     * the side that actually owns the category_id foreign key column.
     *
     * @JsonIgnore stops infinite recursion: without it, serialising a Category
     * would write its vehicles, each vehicle would write its category, and so
     * on until the stack overflows.
     */
    @OneToMany(mappedBy = "category", cascade = CascadeType.PERSIST)
    @JsonIgnore
    private List<Vehicle> vehicles = new ArrayList<>();

    /** No-arg constructor. JPA requires this to build entities via reflection. */
    public Category() {
    }

    /** All-args constructor (excludes the generated id and the inverse list). */
    public Category(String categoryName, String description,
                    BigDecimal dailyRate, Integer seatingCapacity) {
        this.categoryName = categoryName;
        this.description = description;
        this.dailyRate = dailyRate;
        this.seatingCapacity = seatingCapacity;
    }

    public Integer getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Integer categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getDailyRate() {
        return dailyRate;
    }

    public void setDailyRate(BigDecimal dailyRate) {
        this.dailyRate = dailyRate;
    }

    public Integer getSeatingCapacity() {
        return seatingCapacity;
    }

    public void setSeatingCapacity(Integer seatingCapacity) {
        this.seatingCapacity = seatingCapacity;
    }

    public List<Vehicle> getVehicles() {
        return vehicles;
    }

    public void setVehicles(List<Vehicle> vehicles) {
        this.vehicles = vehicles;
    }

    /** Never include the vehicles list here - printing it would trigger a query. */
    @Override
    public String toString() {
        return "Category{" +
                "categoryId=" + categoryId +
                ", categoryName='" + categoryName + '\'' +
                ", description='" + description + '\'' +
                ", dailyRate=" + dailyRate +
                ", seatingCapacity=" + seatingCapacity +
                '}';
    }
}
