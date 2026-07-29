package com.group.vehiclerental.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * What the React booking form sends.
 *
 * Note what is NOT here: totalDays, totalAmount. The proposal says the total is
 * "calculated automatically", so the server works both out from the dates and
 * the rates. Accepting them from the browser would let anyone post their own
 * price.
 */
public class BookingRequest {

    @NotNull(message = "Customer is required")
    private Integer customerId;

    @NotNull(message = "Vehicle is required")
    private Integer vehicleId;

    /** Optional - null means a self-drive rental. */
    private Integer driverId;

    @NotNull(message = "Start date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    /** PENDING, ACTIVE, COMPLETED, CANCELLED - defaults to PENDING. */
    private String status;

    /**
     * Collected by the public rent form. Sign-up does not ask for licence
     * details, so the first time a customer books we capture them here and
     * save them onto their customer record.
     */
    private String nic;

    private String drivingLicenceNo;

    public BookingRequest() {
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
    }

    public Integer getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Integer vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Integer getDriverId() {
        return driverId;
    }

    public void setDriverId(Integer driverId) {
        this.driverId = driverId;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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
}
