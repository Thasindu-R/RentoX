# RentoX

A full-stack Vehicle Rental Management System for tracking fleets, handling customer
reservations, managing drivers, and recording rental payments.

Built as a university mini project: Java 17 · Spring Boot 3.5 · MySQL 8 · React (Vite).
No Docker, no external APIs, no payment gateways.

---

## Group Members

| # | Student Name | Student ID | Module |
|---|--------------|------------|--------|
| 1 | | | Customer Management |
| 2 | | | Vehicle Category Management |
| 3 | | | Vehicle Management |
| 4 | | | Driver Management |
| 5 | | | Booking Management |
| 6 | | | Payment Management |

*Fill in names and IDs before submission.*

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 17 |
| Backend | Spring Boot 3.5.16 |
| Data access | Spring Data JPA (Hibernate 6) |
| Validation | Jakarta Bean Validation |
| Database | MySQL 8 |
| Frontend | React 18 + Vite 5 |
| Routing | React Router 6 |
| HTTP client | Axios |
| Styling | Plain CSS (one design system, no UI framework) |
| Build tools | Maven, npm |

---

## Prerequisites

| Tool | Version | Check with |
|------|---------|-----------|
| JDK | 17 or later | `java -version` |
| Maven | 3.8+ | `mvn -version` |
| MySQL | 8+, running | `mysql --version` |
| Node.js | 18+ | `node --version` |

Start MySQL if it is not already running:

```bash
brew services start mysql      # macOS (Homebrew)
sudo systemctl start mysql     # Linux
# Windows: start MySQL from XAMPP or MySQL Workbench
```

---

## Getting Started

### 1. Create the database

From the project root:

```bash
mysql -u root -p < database/schema.sql
```

This drops and recreates `vehicle_rental_db` with all six tables, foreign keys and
constraints. Re-run it any time to reset to empty tables.

### 2. Run the backend

```bash
cd backend
mvn spring-boot:run
```

The API starts on **http://localhost:8080**. Confirm with:

```bash
curl http://localhost:8080/api/health     # -> OK
```

**Database credentials.** The app connects as `root` with an **empty** password by
default, which is how a fresh MySQL install ships. If your MySQL root account has a
password, do **not** edit `application.properties` — every member has different
credentials and editing that line causes merge conflicts. Set an environment variable
instead:

```bash
export MYSQL_PASSWORD=yourpassword     # macOS / Linux
set MYSQL_PASSWORD=yourpassword        # Windows cmd
```

### 3. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** and sign in:

| Username | Password |
|----------|----------|
| `admin`  | `admin123` |

> The login is a single hardcoded staff account checked in the browser, as the project
> scope specifies. It is **not** real security — the API itself is unauthenticated.
> Adding Spring Security was deliberately out of scope.

---

## Project Structure

```
RentoX/
├── database/
│   └── schema.sql                  # six tables, FKs, CHECK constraints, indexes
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── resources/
│       │   └── application.properties
│       └── java/com/group/vehiclerental/
│           ├── VehicleRentalApplication.java
│           ├── model/              # 6 JPA entities
│           ├── repository/         # 6 JpaRepository interfaces
│           ├── service/            # 6 services - all business rules live here
│           ├── controller/         # 6 REST controllers + health check
│           ├── dto/                # request DTOs for the modules with foreign keys
│           ├── exception/          # GlobalExceptionHandler + 2 exception types
│           └── config/
│               └── CorsConfig.java # allows the Vite dev server on :5173
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                 # routes
        ├── api.js                  # every endpoint + error parsing
        ├── styles.css              # the whole design system
        ├── components/             # Navbar, DataTable, FormField, ConfirmDialog
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── customers/  categories/  vehicles/
            └── drivers/    bookings/    payments/
```

Each module follows the same three layers: **controller** handles HTTP, **service**
holds the rules, **repository** talks to the database.

---

## Database Design

| Table | Primary key | Foreign keys |
|-------|-------------|--------------|
| `customer` | `customer_id` | — |
| `category` | `category_id` | — |
| `vehicle` | `vehicle_id` | `category_id` → `category` |
| `driver` | `driver_id` | — |
| `booking` | `booking_id` | `customer_id`, `vehicle_id`, `driver_id` (nullable) |
| `payment` | `payment_id` | `booking_id` |

| Constraint | Relationship | On delete |
|-----------|--------------|-----------|
| `fk_vehicle_category` | one category → many vehicles | `RESTRICT` |
| `fk_booking_customer` | one customer → many bookings | `RESTRICT` |
| `fk_booking_vehicle` | one vehicle → many bookings | `RESTRICT` |
| `fk_booking_driver` | one driver → many bookings (optional) | `SET NULL` |
| `fk_payment_booking` | one booking → many payments | `CASCADE` |

The foreign key always sits on the "many" side.

---

## API Reference

Base URL: `http://localhost:8080/api`

### Customers
| Method | Path | Notes |
|--------|------|-------|
| GET | `/customers` | `?search=` matches name or NIC |
| GET | `/customers/{id}` | |
| POST | `/customers` | |
| PUT | `/customers/{id}` | |
| DELETE | `/customers/{id}` | 409 if the customer has bookings |
| GET | `/customers/count` | |

### Categories
| Method | Path | Notes |
|--------|------|-------|
| GET | `/categories` | `?search=` |
| GET | `/categories/{id}` | |
| POST | `/categories` | |
| PUT | `/categories/{id}` | |
| DELETE | `/categories/{id}` | 409 if vehicles still use it |
| GET | `/categories/count` | |

### Vehicles
| Method | Path | Notes |
|--------|------|-------|
| GET | `/vehicles` | `?categoryId=` and/or `?status=` |
| GET | `/vehicles/search` | `?q=` matches registration, brand or model |
| GET | `/vehicles/{id}` | |
| POST | `/vehicles` | body carries `categoryId`, not a nested object |
| PUT | `/vehicles/{id}` | |
| PATCH | `/vehicles/{id}/status` | `?status=AVAILABLE\|RENTED\|MAINTENANCE` |
| DELETE | `/vehicles/{id}` | |
| GET | `/vehicles/count` | `?status=` optional |

### Drivers
| Method | Path | Notes |
|--------|------|-------|
| GET | `/drivers` | `?available=true\|false` |
| GET | `/drivers/search` | `?q=` matches name or NIC |
| GET | `/drivers/{id}` | |
| POST | `/drivers` | |
| PUT | `/drivers/{id}` | |
| PATCH | `/drivers/{id}/availability` | `?available=true\|false` |
| DELETE | `/drivers/{id}` | |
| GET | `/drivers/count` | |

### Bookings
| Method | Path | Notes |
|--------|------|-------|
| GET | `/bookings` | `?status=` or `?from=&to=` |
| GET | `/bookings/{id}` | |
| GET | `/bookings/customer/{customerId}` | rental history |
| GET | `/bookings/vehicle/{vehicleId}` | |
| POST | `/bookings` | total calculated server-side |
| PUT | `/bookings/{id}` | change dates / extend |
| PATCH | `/bookings/{id}/status` | `?status=PENDING\|ACTIVE\|COMPLETED\|CANCELLED` |
| DELETE | `/bookings/{id}` | payments cascade |
| GET | `/bookings/count` | `?status=` optional |

### Payments
| Method | Path | Notes |
|--------|------|-------|
| GET | `/payments` | |
| GET | `/payments/{id}` | |
| GET | `/payments/booking/{bookingId}` | payments for one booking |
| GET | `/payments/booking/{bookingId}/balance` | total, paid, balance due |
| POST | `/payments` | |
| PUT | `/payments/{id}` | |
| DELETE | `/payments/{id}` | |
| GET | `/payments/count` | |

### Example

```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"customerId":1,"vehicleId":1,"driverId":1,
       "startDate":"2026-08-01","endDate":"2026-08-04"}'
```

---

## Business Rules

All of these live in the service layer, not the controllers:

- **Booking cost is calculated by the server.** `BookingRequest` has no amount field, so
  a price can never be posted from the browser.
  `total_amount = total_days × category.daily_rate` plus
  `total_days × driver.daily_charge` when a driver is assigned.
- **`total_days = end_date − start_date`**, with a minimum of 1 — a same-day rental is
  charged as one day, which also satisfies the `CHECK (total_days > 0)` in the schema.
- **No double-booking.** A vehicle cannot have two overlapping bookings, and neither can
  a driver. Only `PENDING` and `ACTIVE` bookings hold a vehicle.
- **A vehicle under maintenance cannot be booked.**
- **Vehicle status follows its bookings.** Marking a booking `ACTIVE` sets the vehicle
  `RENTED`; `COMPLETED` or `CANCELLED` frees it, unless another live booking still holds it.
- **Referenced records cannot be deleted.** A category in use, or a customer, vehicle or
  driver with bookings, returns 409 with an explanation.
- **Payments cannot exceed the booking total.**

### HTTP status codes

| Code | Meaning |
|------|---------|
| 200 / 201 / 204 | success / created / deleted |
| 400 | validation failed — response includes a `fieldErrors` map |
| 404 | no record with that id |
| 409 | a business rule or database constraint was broken |

Errors always come back in the same shape, which is what the React forms read:

```json
{
  "timestamp": "2026-07-29T16:41:39",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "fieldErrors": { "fullName": "Full name is required" }
}
```

---

## Testing

- **Backend:** each endpoint with Postman or `curl` before wiring up the frontend.
- **Frontend:** add, edit and delete a record on each of the six pages.
- **Integration:** register customer → add category → add vehicle → create booking →
  record payment → check the balance on the booking detail page.
- **Validation to try:** empty required fields, an invalid email, `end_date` before
  `start_date`, a duplicate registration number or NIC, deleting a category in use,
  booking a vehicle over dates it is already booked for.

---

## Troubleshooting

**`Access denied for user 'root'@'localhost' (using password: YES)`**
Your MySQL password does not match. The app expects an empty root password by default —
if yours has one, `export MYSQL_PASSWORD=yourpassword` and run again. Check the password
independently with `mysql -u root -p`.

**`Unknown database 'vehicle_rental_db'`**
Run `mysql -u root -p < database/schema.sql`.

**`Web server failed to start. Port 8080 was already in use.`**
An earlier run is still going. `lsof -ti:8080 | xargs kill -9`, or set `server.port=8081`.

**`Communications link failure` / `Connection refused`**
MySQL is not running. Start it (see Prerequisites).

**Frontend loads but every table is empty, console shows a CORS error**
The backend is not running, or it is not on port 8080. `CorsConfig.java` only allows
`http://localhost:5173` — if Vite picked a different port because 5173 was taken, add
that origin there.

**`Schema-validation: missing table` after switching `ddl-auto` to `validate`**
The database does not match the entities. Re-run `database/schema.sql`.

---

## Notes for the Viva

A few decisions worth being able to explain:

- **`FetchType.LAZY` on every `@ManyToOne`.** The default is `EAGER`, which fires an extra
  query per row — listing 50 vehicles becomes 51 queries (the N+1 problem). Repository
  finders use `@EntityGraph` to fetch what each screen needs in a single query.
- **`mappedBy` marks the non-owning side.** The owning side is the one with
  `@ManyToOne` + `@JoinColumn`, and it is the only side Hibernate writes to the database.
- **`BigDecimal` for money, never `double`.** Binary floating point cannot represent 0.1
  exactly, so totals would drift.
- **Status fields are `String` with a `CHECK` constraint**, not enums — simpler to explain,
  and adding a status later is a plain `ALTER`.
- **Request DTOs for Vehicle, Booking and Payment.** Any module whose table has a foreign
  key takes plain ids from the browser instead of nested objects.
- **`spring.jpa.hibernate.ddl-auto=update`** lets Hibernate adjust tables to match the
  entities during development. Once the schema is stable, switch to `validate` so
  Hibernate checks against `schema.sql` rather than quietly reshaping it.

---

## Git Workflow

- `main` holds working code only.
- Each member works on their own branch, e.g. `booking-module`.
- Open a pull request and merge once the group has checked it runs.
- Commit under your own GitHub account so individual contribution is visible.
