-- =====================================================================
--  Vehicle Rental Management System
--  Database schema for MySQL 8
--
--  Run with:  mysql -u root -p < database/schema.sql
--  Tables are created in dependency order (parents before children).
-- =====================================================================

DROP DATABASE IF EXISTS vehicle_rental_db;

CREATE DATABASE vehicle_rental_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE vehicle_rental_db;


-- ---------------------------------------------------------------------
--  1. customer  -- people who rent vehicles
-- ---------------------------------------------------------------------
-- Customers create their own account through the public sign-up form; staff
-- cannot add them. Sign-up captures name, email, phone and password.
--
-- nic and driving_licence_no are NULL until the customer makes their first
-- booking - the rent form collects them and fills them in. They stay UNIQUE:
-- MySQL allows any number of NULLs in a UNIQUE index, so several customers can
-- sit at NULL while no two real NICs can ever collide.
CREATE TABLE customer (
    customer_id         INT AUTO_INCREMENT PRIMARY KEY,
    full_name           VARCHAR(100)  NOT NULL,
    email               VARCHAR(120)  NOT NULL,
    password            VARCHAR(100)  NOT NULL,
    phone               VARCHAR(20)   NOT NULL,
    nic                 VARCHAR(20)   NULL,
    driving_licence_no  VARCHAR(30)   NULL,
    address             VARCHAR(255),
    registered_date     DATE          NOT NULL DEFAULT (CURRENT_DATE),
    -- File name of the customer's photo, e.g. "customer-1-b7c2.jpg". Same
    -- arrangement as vehicle.image_path: the row keeps the name, the file
    -- lives in backend/uploads/ and is served at /uploads/<name>.
    image_path          VARCHAR(255)  NULL,

    CONSTRAINT uq_customer_email   UNIQUE (email),
    CONSTRAINT uq_customer_nic     UNIQUE (nic),
    CONSTRAINT uq_customer_licence UNIQUE (driving_licence_no)
) ENGINE = InnoDB;

CREATE INDEX idx_customer_email ON customer (email);

CREATE INDEX idx_customer_full_name ON customer (full_name);


-- ---------------------------------------------------------------------
--  2. category  -- vehicle types and their daily rates
-- ---------------------------------------------------------------------
CREATE TABLE category (
    category_id       INT AUTO_INCREMENT PRIMARY KEY,
    category_name     VARCHAR(50)    NOT NULL,
    description       VARCHAR(200),
    daily_rate        DECIMAL(10,2)  NOT NULL,
    seating_capacity  INT,

    CONSTRAINT uq_category_name   UNIQUE (category_name),
    CONSTRAINT chk_category_rate  CHECK (daily_rate >= 0),
    CONSTRAINT chk_category_seats CHECK (seating_capacity IS NULL OR seating_capacity > 0)
) ENGINE = InnoDB;


-- ---------------------------------------------------------------------
--  3. vehicle  -- the fleet catalogue
--     `year` is backtick-quoted because YEAR is also a MySQL data type.
-- ---------------------------------------------------------------------
CREATE TABLE vehicle (
    vehicle_id           INT AUTO_INCREMENT PRIMARY KEY,
    registration_number  VARCHAR(20)  NOT NULL,
    brand                VARCHAR(50)  NOT NULL,
    model                VARCHAR(50)  NOT NULL,
    `year`               INT,
    fuel_type            VARCHAR(20),
    transmission         VARCHAR(20),
    category_id          INT          NOT NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE',
    -- File name of the uploaded photo, e.g. "vehicle-1-a3f9.jpg". Only the
    -- name is stored; the file itself lives in backend/uploads/ and is served
    -- at /uploads/<name>. Storing images in the database is avoided.
    image_path           VARCHAR(255) NULL,

    CONSTRAINT uq_vehicle_reg_no UNIQUE (registration_number),

    CONSTRAINT chk_vehicle_status
        CHECK (status IN ('AVAILABLE', 'RENTED', 'MAINTENANCE')),
    CONSTRAINT chk_vehicle_fuel
        CHECK (fuel_type IS NULL OR fuel_type IN ('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC')),
    CONSTRAINT chk_vehicle_transmission
        CHECK (transmission IS NULL OR transmission IN ('MANUAL', 'AUTOMATIC')),
    CONSTRAINT chk_vehicle_year
        CHECK (`year` IS NULL OR `year` BETWEEN 1950 AND 2100),

    CONSTRAINT fk_vehicle_category
        FOREIGN KEY (category_id) REFERENCES category (category_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE INDEX idx_vehicle_status ON vehicle (status);


-- ---------------------------------------------------------------------
--  4. driver  -- drivers for "with driver" rentals
-- ---------------------------------------------------------------------
CREATE TABLE driver (
    driver_id     INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100)   NOT NULL,
    nic           VARCHAR(20)    NOT NULL,
    licence_no    VARCHAR(30)    NOT NULL,
    phone         VARCHAR(20)    NOT NULL,
    daily_charge  DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    available     BOOLEAN        NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_driver_nic     UNIQUE (nic),
    CONSTRAINT uq_driver_licence UNIQUE (licence_no),
    CONSTRAINT chk_driver_charge CHECK (daily_charge >= 0)
) ENGINE = InnoDB;


-- ---------------------------------------------------------------------
--  5. booking  -- the central module
--     driver_id is nullable: a booking may be "self-drive".
-- ---------------------------------------------------------------------
CREATE TABLE booking (
    booking_id    INT AUTO_INCREMENT PRIMARY KEY,
    customer_id   INT            NOT NULL,
    vehicle_id    INT            NOT NULL,
    driver_id     INT            NULL,
    start_date    DATE           NOT NULL,
    end_date      DATE           NOT NULL,
    total_days    INT            NOT NULL,
    total_amount  DECIMAL(10,2)  NOT NULL,
    status        VARCHAR(20)    NOT NULL DEFAULT 'PENDING',

    CONSTRAINT chk_booking_status
        CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_booking_dates  CHECK (end_date >= start_date),
    CONSTRAINT chk_booking_days   CHECK (total_days > 0),
    CONSTRAINT chk_booking_amount CHECK (total_amount >= 0),

    CONSTRAINT fk_booking_customer
        FOREIGN KEY (customer_id) REFERENCES customer (customer_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_booking_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES vehicle (vehicle_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_booking_driver
        FOREIGN KEY (driver_id) REFERENCES driver (driver_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Speeds up the "is this vehicle already booked on these dates?" check.
CREATE INDEX idx_booking_vehicle_dates ON booking (vehicle_id, start_date, end_date);
CREATE INDEX idx_booking_status        ON booking (status);


-- ---------------------------------------------------------------------
--  6. payment  -- payments recorded against a booking
-- ---------------------------------------------------------------------
CREATE TABLE payment (
    payment_id      INT AUTO_INCREMENT PRIMARY KEY,
    booking_id      INT            NOT NULL,
    amount          DECIMAL(10,2)  NOT NULL,
    payment_method  VARCHAR(20)    NOT NULL,
    payment_date    DATE           NOT NULL DEFAULT (CURRENT_DATE),
    payment_type    VARCHAR(20)    NOT NULL,

    CONSTRAINT chk_payment_amount CHECK (amount > 0),
    CONSTRAINT chk_payment_method
        CHECK (payment_method IN ('CASH', 'CARD', 'BANK_TRANSFER')),
    CONSTRAINT chk_payment_type
        CHECK (payment_type IN ('ADVANCE', 'FULL', 'BALANCE')),

    CONSTRAINT fk_payment_booking
        FOREIGN KEY (booking_id) REFERENCES booking (booking_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE INDEX idx_payment_date ON payment (payment_date);
