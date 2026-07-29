package com.group.vehiclerental.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * A person who rents vehicles.
 */
@Entity
@Table(name = "customer")
// Class level, so it also applies when a lazy Customer proxy is serialised on
// its own. Hibernate's proxy carries these two internal fields, which
// Jackson cannot serialise.
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_id")
    private Integer customerId;

    @NotBlank(message = "Full name is required")
    @Size(max = 100)
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @NotBlank(message = "NIC is required")
    @Size(max = 20)
    @Column(name = "nic", nullable = false, unique = true, length = 20)
    private String nic;

    @NotBlank(message = "Driving licence number is required")
    @Size(max = 30)
    @Column(name = "driving_licence_no", nullable = false, unique = true, length = 30)
    private String drivingLicenceNo;

    /**
     * @Email allows null (an optional field) but rejects a non-empty value
     * that is not a valid address. Pair it with @NotBlank if you later decide
     * email should be mandatory.
     */
    @Email(message = "Email must be a valid address")
    @Size(max = 120)
    @Column(name = "email", length = 120)
    private String email;

    @NotBlank(message = "Phone number is required")
    @Size(max = 20)
    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Size(max = 255)
    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "registered_date", nullable = false)
    private LocalDate registeredDate;

    /**
     * Inverse side. mappedBy = "customer" refers to the Booking.customer field,
     * which owns the customer_id foreign key. @JsonIgnore breaks the
     * Customer -> Booking -> Customer serialisation cycle.
     */
    @OneToMany(mappedBy = "customer")
    @JsonIgnore
    private List<Booking> bookings = new ArrayList<>();

    public Customer() {
    }

    public Customer(String fullName, String nic, String drivingLicenceNo, String email,
                    String phone, String address, LocalDate registeredDate) {
        this.fullName = fullName;
        this.nic = nic;
        this.drivingLicenceNo = drivingLicenceNo;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.registeredDate = registeredDate;
    }

    /**
     * The SQL column has DEFAULT (CURRENT_DATE), but Hibernate always sends the
     * column in its INSERT, so a null here would hit the NOT NULL constraint.
     * @PrePersist runs just before the INSERT and fills it in.
     */
    @PrePersist
    protected void onCreate() {
        if (registeredDate == null) {
            registeredDate = LocalDate.now();
        }
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
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

    public String getDrivingLicenceNo() {
        return drivingLicenceNo;
    }

    public void setDrivingLicenceNo(String drivingLicenceNo) {
        this.drivingLicenceNo = drivingLicenceNo;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public LocalDate getRegisteredDate() {
        return registeredDate;
    }

    public void setRegisteredDate(LocalDate registeredDate) {
        this.registeredDate = registeredDate;
    }

    public List<Booking> getBookings() {
        return bookings;
    }

    public void setBookings(List<Booking> bookings) {
        this.bookings = bookings;
    }

    @Override
    public String toString() {
        return "Customer{" +
                "customerId=" + customerId +
                ", fullName='" + fullName + '\'' +
                ", nic='" + nic + '\'' +
                ", drivingLicenceNo='" + drivingLicenceNo + '\'' +
                ", email='" + email + '\'' +
                ", phone='" + phone + '\'' +
                ", address='" + address + '\'' +
                ", registeredDate=" + registeredDate +
                '}';
    }
}
