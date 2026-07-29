package com.group.vehiclerental;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the Vehicle Rental Management System.
 *
 * @SpringBootApplication is three annotations in one:
 *   @Configuration      - this class can define beans
 *   @EnableAutoConfiguration - Spring configures Tomcat, JPA and the
 *                              DataSource based on what is on the classpath
 *   @ComponentScan      - scans com.group.vehiclerental and every
 *                         sub-package for @RestController, @Service,
 *                         @Repository and @Component classes
 */
@SpringBootApplication
public class VehicleRentalApplication {

    public static void main(String[] args) {
        SpringApplication.run(VehicleRentalApplication.class, args);
    }
}
