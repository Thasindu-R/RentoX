-- =====================================================================
--  Vehicle Rental Management System
--  Seed data for MySQL 8
--
--  Run with:  mysql -u root -p < database/data.sql
--
--  Run this AFTER the tables exist. Two ways to get them:
--    a) mysql -u root -p < database/schema.sql   (builds them explicitly), or
--    b) start the backend once - spring.jpa.hibernate.ddl-auto=update makes
--       Hibernate create them from the entity classes.
--
--  Re-running this file is safe. It empties the six tables first, so you
--  always end up with exactly the rows below and never a duplicate-key error.
--  That also resets AUTO_INCREMENT, which is why the explicit IDs used by the
--  foreign keys further down stay correct every time.
--
--  NOTE: the admin account is NOT in here. There is no admin table - the
--  admin/admin123 pair is matched in the browser in
--  frontend/src/pages/public/CustomerLogin.jsx and never reaches the backend.
-- =====================================================================

USE vehicle_rental_db;


-- ---------------------------------------------------------------------
--  Reset
--  TRUNCATE refuses to run on a table another table points at, so the FK
--  checks come off for the duration. Children are still emptied before
--  parents so the order stays correct on its own merits.
-- ---------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE payment;
TRUNCATE TABLE booking;
TRUNCATE TABLE vehicle;
TRUNCATE TABLE driver;
TRUNCATE TABLE category;
TRUNCATE TABLE customer;

SET FOREIGN_KEY_CHECKS = 1;


-- ---------------------------------------------------------------------
--  1. customer
--
--  PASSWORDS: every seeded customer signs in with  customer123
--
--  The password column holds a BCrypt hash, never the text. AuthService.login
--  calls passwordEncoder.matches(attempt, stored), which hashes the attempt
--  and compares - it cannot decrypt the stored value. So a row inserted with
--  a plain-text password would create an account that can never log in. Each
--  hash below was generated with the same BCryptPasswordEncoder the app uses
--  and verified to match "customer123".
--
--  Amara and Sanduni are left with NULL nic and driving_licence_no on purpose:
--  that is the state a customer is in between signing up and making a first
--  booking, and it is worth having in the demo data. MySQL allows any number
--  of NULLs in a UNIQUE index, so both can sit at NULL at once.
-- ---------------------------------------------------------------------
INSERT INTO customer
    (customer_id, full_name, email, password, phone, nic, driving_licence_no, address, registered_date)
VALUES
    (1, 'Amara Wickramasinghe', 'amara@example.com',
     '$2y$10$e3tJshAgVyi8iJdfZgkWhO0hUKPHw4A/C4VN5pZ09o6bhEvrn2MdW',
     '0771234567', '199012345678', 'B1234567', '42 Galle Road, Colombo 03', '2026-05-14'),

    (2, 'Dilani Rajapaksa', 'dilani@example.com',
     '$2y$10$EUQaD0y6zlOfIcV4P13KSenOoZFe0yhczE7z5aMBsqCDceNEVXvYu',
     '0762345678', '199523456789', 'B2345678', '17 Peradeniya Road, Kandy', '2026-05-28'),

    (3, 'Kasun Bandara', 'kasun@example.com',
     '$2y$10$/mF4wmqpxVUv1KMCvsbDaO4vuhxnf8R0c54Fj/DSxvfH/8xxQc88S',
     '0713456789', '199834567890', 'B3456789', '9 Lighthouse Street, Galle', '2026-06-09'),

    (4, 'Nadeesha Gunawardena', 'nadeesha@example.com',
     '$2y$10$qhCyff85YZLozklh3xUw7u7/cOq.FIq9Fged2F7ePCpucNuyDmEFS',
     '0774567890', '200045678901', 'B4567890', '128 Poruthota Road, Negombo', '2026-06-21'),

    (5, 'Tharindu Jayawardena', 'tharindu@example.com',
     '$2y$10$R06H/197guAbI1H.J9Pjg.XBMPFtmWwhvFCDGm/D1IoPc47DZ5K8S',
     '0785678901', '199756789012', 'B5678901', '5 Beach Road, Matara', '2026-07-02'),

    -- Signed up, has not booked yet - NIC and licence still NULL.
    (6, 'Sanduni Ekanayake', 'sanduni@example.com',
     '$2y$10$sKn4jVpUbM1Bch7dGKlzuOmiXSSGFl3G7qMNLiSb3EwJF1hTthHo.',
     '0726789012', NULL, NULL, '61 Kandy Road, Kurunegala', '2026-07-19');


-- ---------------------------------------------------------------------
--  2. category
--  daily_rate is in LKR and is what booking totals are calculated from.
-- ---------------------------------------------------------------------
INSERT INTO category (category_id, category_name, description, daily_rate, seating_capacity)
VALUES
    (1, 'Economy Car', 'Small, fuel-efficient cars for city driving and short trips.',  6500.00, 5),
    (2, 'Sedan',       'Comfortable four-door cars suited to long-distance travel.',    9500.00, 5),
    (3, 'SUV',         'High-clearance vehicles for hill country and rough roads.',    14500.00, 7),
    (4, 'Van',         'Group transport for families and small tour parties.',         12000.00, 9),
    (5, 'Luxury',      'Premium vehicles for weddings and corporate hire.',            22000.00, 5);


-- ---------------------------------------------------------------------
--  3. vehicle
--
--  IMAGES: image_path holds only a file name. The file itself lives in
--  backend/uploads/ and is served at /uploads/<name>. The four names below
--  are the photos already sitting in that folder.
--
--  backend/uploads/ is git-ignored, so a teammate who clones this repo will
--  NOT have those four files and will see the placeholder instead of a photo.
--  Nothing breaks - the page just falls back. To give them real photos,
--  either upload new ones through the vehicle form or commit the image files
--  somewhere tracked and copy them into backend/uploads/.
--
--  Vehicles 5-10 are seeded with NULL image_path for the same reason.
--
--  status is kept consistent with the bookings below: the two vehicles on an
--  ACTIVE booking are RENTED, and one van is off the road for MAINTENANCE.
-- ---------------------------------------------------------------------
INSERT INTO vehicle
    (vehicle_id, registration_number, brand, model, `year`, fuel_type, transmission,
     category_id, status, image_path)
VALUES
    (1,  'CAR-1234', 'Toyota',     'Aqua',      2018, 'HYBRID',   'AUTOMATIC', 1, 'RENTED',      'vehicle-1-148b14ce.jpg'),
    (2,  'CAB-5678', 'Honda',      'Civic',     2020, 'PETROL',   'AUTOMATIC', 2, 'AVAILABLE',   'vehicle-2-969ae4cf.png'),
    (3,  'CAX-9012', 'Mitsubishi', 'Montero',   2019, 'DIESEL',   'AUTOMATIC', 3, 'AVAILABLE',   'vehicle-3-f8b18907.png'),
    (4,  'NC-3456',  'Toyota',     'Hiace',     2017, 'DIESEL',   'MANUAL',    4, 'RENTED',      'vehicle-4-94b2b26d.png'),
    (5,  'CBB-7788', 'Suzuki',     'Alto',      2021, 'PETROL',   'MANUAL',    1, 'AVAILABLE',   NULL),
    (6,  'CAD-2244', 'Toyota',     'Premio',    2016, 'PETROL',   'AUTOMATIC', 2, 'AVAILABLE',   NULL),
    (7,  'CBC-6611', 'Nissan',     'X-Trail',   2020, 'HYBRID',   'AUTOMATIC', 3, 'AVAILABLE',   NULL),
    (8,  'PB-4499',  'Nissan',     'Caravan',   2015, 'DIESEL',   'MANUAL',    4, 'MAINTENANCE', NULL),
    (9,  'CBA-1100', 'BMW',        '520d',      2021, 'DIESEL',   'AUTOMATIC', 5, 'AVAILABLE',   NULL),
    (10, 'CAF-8855', 'Toyota',     'Prius',     2019, 'HYBRID',   'AUTOMATIC', 1, 'AVAILABLE',   NULL);


-- ---------------------------------------------------------------------
--  4. driver
--  daily_charge is added on top of the category rate when a booking is made
--  "with driver". Nimal is unavailable because he is on an ACTIVE booking.
-- ---------------------------------------------------------------------
INSERT INTO driver (driver_id, full_name, nic, licence_no, phone, daily_charge, available)
VALUES
    (1, 'Sunil Perera',      '198012345678', 'D1234567', '0701112233', 3500.00, TRUE),
    (2, 'Nimal Fernando',    '198523456789', 'D2345678', '0702223344', 3000.00, FALSE),
    (3, 'Kamal Silva',       '199034567890', 'D3456789', '0703334455', 4000.00, TRUE),
    (4, 'Ruwan Jayasuriya',  '199245678901', 'D4567890', '0704445566', 3500.00, TRUE);


-- ---------------------------------------------------------------------
--  5. booking
--
--  total_days and total_amount follow exactly what BookingService computes,
--  so the seeded rows agree with anything the app creates later:
--
--      total_days   = max(1, end_date - start_date)
--      total_amount = total_days * (category.daily_rate + driver.daily_charge)
--
--  The arithmetic for each row is spelled out in the comment beside it. A
--  driver_id of NULL means self-drive.
-- ---------------------------------------------------------------------
INSERT INTO booking
    (booking_id, customer_id, vehicle_id, driver_id, start_date, end_date,
     total_days, total_amount, status)
VALUES
    -- Dilani, Civic (Sedan 9500), self-drive.  5 x 9500 = 47500
    (1, 2, 2, NULL, '2026-07-05', '2026-07-10', 5, 47500.00, 'COMPLETED'),

    -- Kasun, Montero (SUV 14500) with Sunil (3500).  3 x 18000 = 54000
    (2, 3, 3, 1,    '2026-07-12', '2026-07-15', 3, 54000.00, 'COMPLETED'),

    -- Amara, Aqua (Economy 6500), self-drive.  7 x 6500 = 45500
    (3, 1, 1, NULL, '2026-07-28', '2026-08-04', 7, 45500.00, 'ACTIVE'),

    -- Nadeesha, Hiace (Van 12000) with Nimal (3000).  5 x 15000 = 75000
    (4, 4, 4, 2,    '2026-08-01', '2026-08-06', 5, 75000.00, 'ACTIVE'),

    -- Tharindu, 520d (Luxury 22000) with Kamal (4000).  3 x 26000 = 78000
    (5, 5, 9, 3,    '2026-08-10', '2026-08-13', 3, 78000.00, 'PENDING'),

    -- Amara, Premio (Sedan 9500), self-drive, later cancelled.  2 x 9500 = 19000
    (6, 1, 6, NULL, '2026-07-20', '2026-07-22', 2, 19000.00, 'CANCELLED');


-- ---------------------------------------------------------------------
--  6. payment
--  Booking 2 is split into an ADVANCE and a BALANCE (20000 + 34000 = 54000)
--  so the payment history has more than one shape to look at. The two ACTIVE
--  bookings are part-paid, and the cancelled booking 6 has no payment at all.
-- ---------------------------------------------------------------------
INSERT INTO payment (payment_id, booking_id, amount, payment_method, payment_date, payment_type)
VALUES
    (1, 1, 47500.00, 'CARD',          '2026-07-05', 'FULL'),
    (2, 2, 20000.00, 'CASH',          '2026-07-12', 'ADVANCE'),
    (3, 2, 34000.00, 'CASH',          '2026-07-15', 'BALANCE'),
    (4, 3, 45500.00, 'BANK_TRANSFER', '2026-07-28', 'FULL'),
    (5, 4, 30000.00, 'CARD',          '2026-08-01', 'ADVANCE'),
    (6, 5, 25000.00, 'CARD',          '2026-08-02', 'ADVANCE');
