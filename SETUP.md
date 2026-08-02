# RentoX — Environment Setup Guide

How to get RentoX running from scratch on a new machine (macOS, Windows or Linux).

The system is three pieces that must all be running:

| Piece | Runs on | Started with |
|-------|---------|--------------|
| MySQL database | `localhost:3306` | your OS service manager |
| Spring Boot backend (REST API) | `localhost:8080` | `mvn spring-boot:run` |
| React frontend (Vite dev server) | `localhost:5173` | `npm run dev` |

The frontend calls the backend, the backend calls MySQL. Start them in that order:
**database → backend → frontend.**

---

## Table of contents

1. [Install the prerequisites](#1-install-the-prerequisites)
2. [Get the code](#2-get-the-code)
3. [Set up MySQL](#3-set-up-mysql)
4. [Create the database schema](#4-create-the-database-schema)
5. [Connect the backend to MySQL](#5-connect-the-backend-to-mysql)
6. [Run the backend](#6-run-the-backend)
7. [Run the frontend](#7-run-the-frontend)
8. [Log in and verify](#8-log-in-and-verify)
9. [Moving your existing data to the new machine](#9-moving-your-existing-data-to-the-new-machine)
10. [Troubleshooting](#10-troubleshooting)
11. [Appendix: what each config value does](#appendix-what-each-config-value-does)

---

## 1. Install the prerequisites

Four tools. Minimum versions on the left; newer is fine — this project has been run
successfully on JDK 26, Node 26 and MySQL 9.7.

| Tool | Minimum | Verify with | Expected output |
|------|---------|-------------|-----------------|
| JDK | 17 | `java -version` | `openjdk version "17..."` or higher |
| Maven | 3.8 | `mvn -version` | `Apache Maven 3.9.x` |
| MySQL Server | 8.0 | `mysql --version` | `mysql Ver 8.x` or higher |
| Node.js | 18 | `node --version` | `v18.x` or higher |

Run all four commands first. Anything that says *command not found* needs installing below.

### macOS (Homebrew)

```bash
# Install Homebrew itself if you do not have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install openjdk@17 maven mysql node

# Homebrew does not link the JDK automatically — this makes `java` visible
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk \
             /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

On Intel Macs replace `/opt/homebrew` with `/usr/local`.

### Windows

Install each with the official installer, or use winget from an **Administrator**
PowerShell:

```powershell
winget install EclipseAdoptium.Temurin.17.JDK
winget install Apache.Maven
winget install Oracle.MySQL
winget install OpenJS.NodeJS.LTS
```

Then **close and reopen** your terminal so the new `PATH` takes effect.

- The MySQL installer asks you to set a **root password** — write it down, you need it in
  step 5.
- Maven from winget may need `PATH` set manually: add `C:\Program Files\Apache\Maven\bin`
  to *System Properties → Environment Variables → Path*.

> **XAMPP alternative.** If you already use XAMPP, its MySQL/MariaDB works fine. Start it
> from the XAMPP Control Panel and skip the MySQL install. XAMPP's root password is empty
> by default, which matches this project's default.

### Linux (Ubuntu / Debian)

```bash
sudo apt update
sudo apt install openjdk-17-jdk maven mysql-server

# Node 18+ — Ubuntu's default `nodejs` package is often too old
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs
```

Fedora/RHEL: `sudo dnf install java-17-openjdk-devel maven mysql-server nodejs`

---

## 2. Get the code

```bash
git clone https://github.com/Thasindu-R/RentoX.git
cd RentoX
```

Or copy the project folder across on a USB drive. If you copy it manually, **do not copy
these folders** — they are machine-specific build output and will be regenerated:

- `backend/target/`
- `frontend/node_modules/`

You should end up with exactly this:

```
RentoX/
├── README.md
├── SETUP.md
├── .gitignore
├── database/
│   ├── schema.sql
│   └── data.sql
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── resources/application.properties
│       └── java/com/group/vehiclerental/...
└── frontend/
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    ├── index.html
    └── src/...
```

---

## 3. Set up MySQL

### 3a. Start the MySQL server

Nothing else works until this is running.

```bash
brew services start mysql            # macOS
sudo systemctl start mysql           # Linux  (use `mariadb` if that is what you installed)
sudo systemctl enable mysql          # Linux — also start it on every boot
```

**Windows:** MySQL installs as a Windows service that usually auto-starts. To check, press
`Win+R`, type `services.msc`, find **MySQL80**, and make sure the status is *Running*. If
not, right-click → Start. With XAMPP, press **Start** next to MySQL in the Control Panel.

Confirm it is alive:

```bash
mysqladmin -u root -p ping
# -> mysqld is alive
```

### 3b. Secure the installation (optional but recommended on Linux/macOS)

```bash
sudo mysql_secure_installation
```

This walks you through setting a root password and removing anonymous accounts. If you set
a password here, remember it for step 5.

### 3c. Confirm you can log in

```bash
mysql -u root -p
```

Enter the root password when prompted (**press Enter on a blank line** if the root account
has no password — this is normal on a fresh Homebrew or XAMPP install). You should land at
a `mysql>` prompt. Type `exit` to leave.

If this command fails, fix it before going any further — the backend uses exactly these
credentials, and every "cannot connect" error later traces back to here.

### 3d. Optional: create a dedicated database user

Connecting as `root` is fine for a class project. If you would rather not, create a user
scoped to just this database:

```sql
CREATE USER 'rentox'@'localhost' IDENTIFIED BY 'rentox_password';
CREATE DATABASE IF NOT EXISTS vehicle_rental_db
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON vehicle_rental_db.* TO 'rentox'@'localhost';
FLUSH PRIVILEGES;
```

Then use `MYSQL_USER=rentox` and `MYSQL_PASSWORD=rentox_password` in step 5.

---

## 4. Create the database schema

From the **project root** (the folder containing `database/`):

```bash
mysql -u root -p < database/schema.sql
```

Windows `cmd` uses the same syntax. In PowerShell, `<` redirection is unreliable — use:

```powershell
Get-Content database\schema.sql | mysql -u root -p
```

This creates `vehicle_rental_db` with all six tables (`customer`, `category`, `vehicle`,
`driver`, `booking`, `payment`), their foreign keys, CHECK constraints and indexes.

> ⚠️ **`schema.sql` begins with `DROP DATABASE IF EXISTS vehicle_rental_db`.** Running it
> deletes everything already in that database. That is exactly what you want on a fresh
> machine, and it is also how you reset to empty tables later — but never run it on a
> database whose data you want to keep.

### Verify

```bash
mysql -u root -p -e "USE vehicle_rental_db; SHOW TABLES;"
```

Expected:

```
+-----------------------------+
| Tables_in_vehicle_rental_db |
+-----------------------------+
| booking                     |
| category                    |
| customer                    |
| driver                      |
| payment                     |
| vehicle                     |
+-----------------------------+
```

Six tables, no data. You will add categories, vehicles and drivers through the staff UI in
step 8.

### Optional: load the sample data

If you would rather start with a database you can click around in straight away, load the
seed file instead of typing everything in by hand:

```bash
mysql -u root -p < database/data.sql
```

```powershell
Get-Content database\data.sql | mysql -u root -p
```

That gives you 6 customers, 5 categories, 10 vehicles, 4 drivers, 6 bookings and 6
payments. A few things worth knowing:

- **Every seeded customer signs in with the password `customer123`.** The `password`
  column stores a BCrypt hash, so a row inserted with a plain-text password would create
  an account that can never log in — the hashes in `data.sql` were generated with the same
  encoder the app uses.
- **The admin is not in the seed file.** There is no admin table; `admin` / `admin123` is
  matched in the browser in `frontend/src/pages/public/CustomerLogin.jsx`.
- **Vehicle photos may show as placeholders.** `image_path` holds only a file name; the
  files live in `backend/uploads/`, which is git-ignored, so a fresh clone will not have
  them. Nothing breaks — upload photos through the vehicle form if you want real images.
- Re-running `data.sql` is safe. It empties the six tables first, so you always end up
  with exactly those rows and never a duplicate-key error.

---

## 5. Connect the backend to MySQL

The connection settings live in `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/vehicle_rental_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=${MYSQL_USER:root}
spring.datasource.password=${MYSQL_PASSWORD:}
```

`${MYSQL_USER:root}` means *"use the `MYSQL_USER` environment variable; if it is not set,
use `root`"*. The password defaults to **empty**.

**If your MySQL root account has no password, you are already done — skip to step 6.**

### If your root account has a password

Do **not** edit `application.properties`. Every group member has different credentials, and
editing that line causes merge conflicts on every pull. Set an environment variable
instead.

**macOS / Linux** — for the current terminal only:

```bash
export MYSQL_PASSWORD='yourpassword'
```

To make it permanent, append it to your shell profile:

```bash
echo "export MYSQL_PASSWORD='yourpassword'" >> ~/.zshrc   # zsh (macOS default)
echo "export MYSQL_PASSWORD='yourpassword'" >> ~/.bashrc  # bash (most Linux)
source ~/.zshrc
```

**Windows — Command Prompt** (current window only):

```cmd
set MYSQL_PASSWORD=yourpassword
```

**Windows — PowerShell** (current window only):

```powershell
$env:MYSQL_PASSWORD = "yourpassword"
```

**Windows — permanent**, then reopen the terminal:

```cmd
setx MYSQL_PASSWORD "yourpassword"
```

### If you also changed the username

```bash
export MYSQL_USER='rentox'          # macOS / Linux
set MYSQL_USER=rentox               # Windows cmd
```

### One-off alternative

Pass the password on the command line for a single run without setting anything:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments=--spring.datasource.password=yourpassword
```

### Confirm the variable is actually set

```bash
echo $MYSQL_PASSWORD      # macOS / Linux
echo %MYSQL_PASSWORD%     # Windows cmd
```

If this prints a blank line, the variable did not take — the most common cause of *Access
denied* in step 6. Remember that a variable set with `export` or `set` applies **only to
that terminal window**; a new tab starts fresh.

---

## 6. Run the backend

```bash
cd backend
mvn spring-boot:run
```

The first run downloads all Spring dependencies — expect 2–5 minutes and a lot of output.
Later runs take a few seconds.

> **Run it from inside `backend/`.** Uploaded vehicle photos are written to `uploads/`
> resolved relative to the current directory, so starting the app from elsewhere puts the
> photos in the wrong place. The folder is created automatically on the first upload.

Success looks like:

```
Tomcat started on port 8080 (http) with context path '/'
Started VehicleRentalApplication in 3.214 seconds
```

Because `spring.jpa.show-sql=true`, you will also see every SQL statement Hibernate runs.
That is intentional — it is useful when demonstrating the project.

### Verify the API

Leave the backend running and open a **second terminal**:

```bash
curl http://localhost:8080/api/health
# -> OK

curl http://localhost:8080/api/vehicles
# -> []   (empty list — correct on a fresh database)
```

`[]` means the full path works: HTTP → controller → service → repository → MySQL. If you
get this, your database connection is good.

To stop the backend, press `Ctrl+C` in its terminal.

---

## 7. Run the frontend

In a **third terminal**, from the project root:

```bash
cd frontend
npm install     # first time only — downloads ~50 MB into node_modules/
npm run dev
```

Success looks like:

```
VITE v5.4.11  ready in 412 ms
➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

> Keep the backend running in its own terminal. The two servers run side by side — the
> frontend does not start the backend.

---

## 8. Log in and verify

### Staff portal

| Field | Value |
|-------|-------|
| URL | http://localhost:5173 |
| Username | `admin` |
| Password | `admin123` |

This is a single hardcoded account checked in the browser (`frontend/src/pages/Login.jsx`),
which is what the project scope specifies. It is not real security — the API itself is
unauthenticated.

### Customer site

Customers create their own accounts through the public sign-up form; staff cannot add them.
Passwords are stored as BCrypt hashes.

### End-to-end check on a fresh database

Work through this in order — each step depends on the one before it:

1. **Categories → Add** — e.g. *Sedan*, daily rate `5000`, seats `4`.
2. **Vehicles → Add** — registration `CAB-1234`, pick the category, upload a photo.
3. **Drivers → Add** — name, NIC, licence, daily charge.
4. **Sign up as a customer** on the public site, then browse and rent the vehicle.
5. **Bookings** — the staff list shows the booking, with the total calculated server-side.
6. **Payments → Add** — record a payment, then check the balance on the booking detail page.

If all six work, the system is fully installed.

---

## 9. Moving your existing data to the new machine

Step 4 gives you an **empty** database. If you want the vehicles, customers and bookings
from your current machine, copy both the data *and* the photo files — the `vehicle` table
stores only a file name (e.g. `vehicle-1-688dc307.png`), while the image itself lives in
`backend/uploads/`. Move one without the other and vehicles show broken images.

### On the old machine — export

```bash
# 1. Dump the data
mysqldump -u root -p vehicle_rental_db > rentox-backup.sql

# 2. Archive the uploaded photos
cd backend
tar -czf rentox-uploads.tar.gz uploads/
```

Windows: zip the `backend\uploads` folder by right-clicking → *Send to → Compressed folder*.

Copy `rentox-backup.sql` and the uploads archive to the new machine.

### On the new machine — import

Do this **after** step 4, and note that the import overwrites what `schema.sql` created:

```bash
# 1. Restore the data
mysql -u root -p vehicle_rental_db < rentox-backup.sql

# 2. Restore the photos into backend/uploads/
cd backend
tar -xzf rentox-uploads.tar.gz
```

### Verify

```bash
mysql -u root -p -e "USE vehicle_rental_db; \
  SELECT COUNT(*) AS vehicles FROM vehicle; \
  SELECT COUNT(*) AS customers FROM customer; \
  SELECT COUNT(*) AS bookings FROM booking;"

ls backend/uploads/     # should list the vehicle-*.png files
```

The counts should match the old machine, and each `image_path` in the `vehicle` table
should correspond to a file in `backend/uploads/`.

---

## 10. Troubleshooting

### `Access denied for user 'root'@'localhost' (using password: YES)`

The password the backend sent does not match MySQL's. Test the password by itself first:

```bash
mysql -u root -p
```

- If that works but the backend still fails, your `MYSQL_PASSWORD` variable is wrong or was
  set in a *different terminal window*. Re-check with `echo $MYSQL_PASSWORD` in the same
  window you run Maven from (step 5).
- `using password: NO` in the message means no password was sent at all — the variable is
  not set, and your root account needs one.

### `Access denied for user 'root'@'localhost' (using password: NO)` — but you have no password

MySQL 8 on Linux often configures root for `auth_socket`, meaning root can only connect
from the Unix socket as the OS root user, not over TCP. Switch it to password auth:

```sql
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'yourpassword';
FLUSH PRIVILEGES;
```

Then set `MYSQL_PASSWORD` as in step 5.

### `Unknown database 'vehicle_rental_db'`

You skipped step 4. Run `mysql -u root -p < database/schema.sql`.

### `Communications link failure` / `Connection refused`

MySQL is not running. Start it (step 3a) and confirm with `mysqladmin -u root -p ping`.

### `Public Key Retrieval is not allowed`

The JDBC URL is missing `allowPublicKeyRetrieval=true`. It is already there in
`application.properties` — restore that line if it was edited out. MySQL 8+ defaults to the
`caching_sha2_password` plugin, which needs it.

### `Web server failed to start. Port 8080 was already in use.`

An earlier backend run is still going:

```bash
lsof -ti:8080 | xargs kill -9                       # macOS / Linux
netstat -ano | findstr :8080                        # Windows — note the PID
taskkill /PID <pid> /F                              # Windows — kill it
```

Or run on a different port: `mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081`.
If you do, update `baseURL` in `frontend/src/api.js` to match.

### Frontend loads but every table is empty; the browser console shows a CORS error

Either the backend is not running, or it is not on port 8080.
`backend/.../config/CorsConfig.java` only allows `http://localhost:5173` and
`http://localhost:3000`. If Vite picked a different port because 5173 was taken, add that
exact origin to `CorsConfig.java` and restart the backend.

### `Cannot reach the server. Is the Spring Boot backend running on port 8080?`

That message comes from the frontend's error handler. Confirm with
`curl http://localhost:8080/api/health`.

### `npm install` fails, or the app will not start after it

Delete and reinstall:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

On Windows: `rmdir /s /q node_modules` and `del package-lock.json`.

### Vehicle photos show as broken images

The `vehicle` table has an `image_path`, but the file is missing from `backend/uploads/`.
Either the backend was started from the wrong folder (step 6), or you restored a database
dump without the uploads archive (step 9). Re-upload the photo through **Vehicles → Edit**,
or restore the archive.

### `Schema-validation: missing table [...]`

Only happens if `spring.jpa.hibernate.ddl-auto` was changed to `validate`. The database does
not match the entities — re-run `database/schema.sql`.

### `release version 17 not supported` / `invalid target release`

Your JDK is older than 17. Check with `java -version` and install JDK 17 or newer (step 1).

---

## Appendix: what each config value does

### `backend/src/main/resources/application.properties`

| Property | Value | Why |
|----------|-------|-----|
| `server.port` | `8080` | Where the API listens. Must match `baseURL` in `frontend/src/api.js`. |
| `spring.datasource.url` | `jdbc:mysql://localhost:3306/vehicle_rental_db?...` | Host, port and database name. |
| `…?createDatabaseIfNotExist=true` | | Creates the database if missing, so the app starts even before `schema.sql` is run. `schema.sql` is still what defines the constraints and indexes. |
| `…&useSSL=false` | | No TLS for a local connection; avoids a certificate warning. |
| `…&allowPublicKeyRetrieval=true` | | Required by MySQL 8+'s `caching_sha2_password` plugin. |
| `…&serverTimezone=UTC` | | Stops the driver erroring when the server timezone is ambiguous. |
| `spring.datasource.username` | `${MYSQL_USER:root}` | Environment variable, defaulting to `root`. |
| `spring.datasource.password` | `${MYSQL_PASSWORD:}` | Environment variable, defaulting to empty. |
| `spring.jpa.hibernate.ddl-auto` | `update` | Hibernate creates or alters tables to match the entities. Switch to `validate` once the schema is stable so it checks instead of reshaping. |
| `spring.jpa.show-sql` | `true` | Prints every SQL statement. Set to `false` for quieter logs. |
| `spring.servlet.multipart.max-file-size` | `5MB` | Largest vehicle photo accepted. |

### Ports used

| Port | Service | Change it in |
|------|---------|--------------|
| 3306 | MySQL | `spring.datasource.url` |
| 8080 | Spring Boot API | `server.port` + `frontend/src/api.js` |
| 5173 | Vite dev server | `frontend/vite.config.js` + `CorsConfig.java` |

Change any port in **both** places listed, or the pieces stop talking to each other.

### Quick reference — starting the system after setup

Three terminals, in this order:

```bash
# Terminal 1 — database (only if it is not already running as a service)
brew services start mysql          # macOS
sudo systemctl start mysql         # Linux

# Terminal 2 — backend
cd RentoX/backend && mvn spring-boot:run

# Terminal 3 — frontend
cd RentoX/frontend && npm run dev
```

Then open http://localhost:5173 and sign in as `admin` / `admin123`.
