package com.group.vehiclerental.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * A driver who can be assigned to a "with driver" rental.
 */
@Entity
@Table(name = "driver")
// Class level, so it also applies when a lazy Driver proxy is serialised on
// its own. Hibernate's proxy carries these two internal fields, which
// Jackson cannot serialise.
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "driver_id")
    private Integer driverId;

    @NotBlank(message = "Full name is required")
    @Size(max = 100)
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @NotBlank(message = "NIC is required")
    @Size(max = 20)
    @Column(name = "nic", nullable = false, unique = true, length = 20)
    private String nic;

    @NotBlank(message = "Licence number is required")
    @Size(max = 30)
    @Column(name = "licence_no", nullable = false, unique = true, length = 30)
    private String licenceNo;

    @NotBlank(message = "Phone number is required")
    @Size(max = 20)
    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    /**
     * @PositiveOrZero rather than @Positive: a driver on a flat salary may have
     * a zero per-day charge, and the SQL CHECK allows daily_charge >= 0.
     */
    @NotNull(message = "Daily charge is required")
    @PositiveOrZero(message = "Daily charge cannot be negative")
    @Column(name = "daily_charge", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyCharge = BigDecimal.ZERO;

    /**
     * Primitive boolean, not Boolean - the column is NOT NULL, so there is no
     * meaningful "unknown" state and a primitive cannot accidentally be null.
     */
    @Column(name = "available", nullable = false)
    private boolean available = true;

    /** Inverse side - Booking.driver owns the nullable driver_id column. */
    @OneToMany(mappedBy = "driver")
    @JsonIgnore
    private List<Booking> bookings = new ArrayList<>();

    public Driver() {
    }

    public Driver(String fullName, String nic, String licenceNo, String phone,
                  BigDecimal dailyCharge, boolean available) {
        this.fullName = fullName;
        this.nic = nic;
        this.licenceNo = licenceNo;
        this.phone = phone;
        this.dailyCharge = dailyCharge;
        this.available = available;
    }

    public Integer getDriverId() {
        return driverId;
    }

    public void setDriverId(Integer driverId) {
        this.driverId = driverId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getNic() {
        return nic;
    }

    public void setNic(String nic) {
        this.nic = nic;
    }

    public String getLicenceNo() {
        return licenceNo;
    }

    public void setLicenceNo(String licenceNo) {
        this.licenceNo = licenceNo;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public BigDecimal getDailyCharge() {
        return dailyCharge;
    }

    public void setDailyCharge(BigDecimal dailyCharge) {
        this.dailyCharge = dailyCharge;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public List<Booking> getBookings() {
        return bookings;
    }

    public void setBookings(List<Booking> bookings) {
        this.bookings = bookings;
    }

    @Override
    public String toString() {
        return "Driver{" +
                "driverId=" + driverId +
                ", fullName='" + fullName + '\'' +
                ", nic='" + nic + '\'' +
                ", licenceNo='" + licenceNo + '\'' +
                ", phone='" + phone + '\'' +
                ", dailyCharge=" + dailyCharge +
                ", available=" + available +
                '}';
    }
}
