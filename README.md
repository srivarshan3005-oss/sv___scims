# SCIMS — Smart Community Issue Management System

## Project Overview

A full-stack web application for community issue reporting and management.

- **Frontend**: React 18 + Bootstrap 5 (CRA)
- **Backend**: Spring Boot 3.2.3 + Spring Security + JWT
- **Database**: MySQL 8+

---

## Demo Credentials

| Role    | Email               | Password    |
|---------|---------------------|-------------|
| Admin   | admin@scims.com     | Admin@123   |
| Citizen | john@example.com    | Citizen@123 |
| Citizen | jane@example.com    | Citizen@123 |

---

## Prerequisites

| Tool    | Version   |
|---------|-----------|
| Java    | 17+       |
| Maven   | 3.8+      |
| Node.js | 16–22     |
| MySQL   | 8.0+      |

---

## Quick Start

### Step 1: Database Setup

```bash
# Connect to MySQL and run the combined schema + seed script
mysql -u root -p < sql/schema.sql
```

This creates:
- Database `scims_db`
- All tables (roles, users, categories, complaints, complaint_images, status_history)
- Sample data with admin and citizen accounts

### Step 2: Backend Configuration

Edit `backend/src/main/resources/application.properties` if your MySQL credentials differ:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/scims_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root
```

**Important**: `spring.sql.init.mode=never` is the default. Change to `always` only if you want Spring Boot to run the SQL init scripts on startup instead of running `sql/schema.sql` manually.

### Step 3: Start the Backend

```bash
cd backend
mvn clean install -DskipTests
mvn spring-boot:run
```

The API will be available at: `http://localhost:8080/api`

### Step 4: Start the Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

The app will open at: `http://localhost:3000`

---

## Project Structure

```
scims/
├── sql/
│   └── schema.sql              # Combined DDL + seed data (run manually)
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/scims/
│       │   ├── config/         # Spring Security, CORS, resource handlers
│       │   ├── controller/     # REST controllers
│       │   ├── dto/            # Request/Response DTOs
│       │   ├── entity/         # JPA entities
│       │   ├── exception/      # Exception classes + global handler
│       │   ├── repository/     # Spring Data JPA repositories
│       │   ├── security/       # JWT utils, filters, UserDetails
│       │   └── service/        # Business logic (interfaces + implementations)
│       └── resources/
│           ├── application.properties
│           └── db/
│               ├── schema.sql  # DDL only (for Spring SQL init)
│               └── data.sql    # Seed data (for Spring SQL init)
└── frontend/
    ├── package.json
    └── src/
        ├── api/index.js        # Axios client + all API calls
        ├── utils/
        │   ├── AuthContext.js  # JWT auth context
        │   └── helpers.js      # Formatters, constants
        ├── components/
        │   ├── auth/           # PrivateRoute, AdminRoute, CitizenRoute
        │   └── common/         # Layout, Sidebar, StatusBadge
        └── pages/
            ├── admin/          # AdminDashboard, AdminComplaints, AdminUsers, AdminCategories
            └── citizen/        # CitizenDashboard, ComplaintForm, ComplaintList, ComplaintTrack, ProfilePage
```

---

## API Endpoints

### Authentication (Public)
| Method | Path              | Description        |
|--------|-------------------|--------------------|
| POST   | /api/auth/login   | Login              |
| POST   | /api/auth/register| Register citizen   |

### Citizen Endpoints (ROLE_CITIZEN)
| Method | Path                          | Description           |
|--------|-------------------------------|-----------------------|
| GET    | /api/citizen/profile          | Get profile           |
| PUT    | /api/citizen/profile          | Update profile        |
| POST   | /api/citizen/profile/image    | Upload profile photo  |
| GET    | /api/citizen/dashboard        | Get dashboard stats   |
| POST   | /api/citizen/complaints       | Submit complaint      |
| GET    | /api/citizen/complaints       | Get my complaints     |
| GET    | /api/citizen/complaints/{id}  | Get complaint detail  |
| DELETE | /api/citizen/complaints/{id}  | Delete PENDING complaint|

### Admin Endpoints (ROLE_ADMIN)
| Method | Path                              | Description           |
|--------|-----------------------------------|-----------------------|
| GET    | /api/admin/dashboard              | System dashboard      |
| GET    | /api/admin/complaints             | All complaints (paginated, filtered)|
| GET    | /api/admin/complaints/{id}        | Complaint detail      |
| PATCH  | /api/admin/complaints/{id}/status | Update status         |
| DELETE | /api/admin/complaints/{id}        | Delete complaint      |
| GET    | /api/admin/users                  | All citizens          |
| GET    | /api/admin/users/{id}             | Citizen detail        |
| PATCH  | /api/admin/users/{id}/toggle-status| Toggle active status |
| DELETE | /api/admin/users/{id}             | Deactivate citizen    |

### Category Endpoints
| Method | Path                      | Description           |
|--------|---------------------------|-----------------------|
| GET    | /api/categories/active    | Active categories (auth required)|
| GET    | /api/categories           | All categories (ADMIN)|
| POST   | /api/categories           | Create category (ADMIN)|
| PUT    | /api/categories/{id}      | Update category (ADMIN)|
| PATCH  | /api/categories/{id}/toggle| Toggle status (ADMIN)|
| DELETE | /api/categories/{id}      | Delete category (ADMIN)|

---

## Node.js Version Notes

React Scripts 5.0.1 has a known incompatibility with Node.js 22+ due to the `ajv-keywords` dependency. The `package.json` includes `overrides` to fix this automatically:

```json
"overrides": {
  "ajv": "^6.12.6",
  "ajv-keywords": "^3.5.2"
}
```

If you encounter the `MODULE_NOT_FOUND` error for `ajv-keywords`, run:
```bash
npm install --legacy-peer-deps
```

---

## File Uploads

Uploaded files are stored in the `uploads/` directory relative to the backend working directory:
- Complaint images: `uploads/complaints/{uuid}.jpg`
- Profile photos: `uploads/profiles/{uuid}.jpg`

They are served at: `http://localhost:8080/api/uploads/{path}`

---

## Remaining Runtime-Only Risks

The following can only be verified by running the application against a live MySQL instance:

1. **BCrypt hash validity** — The seeded password hashes must match the BCrypt cost factor 12. If login fails, regenerate hashes with the correct cost factor.

2. **MySQL ENUM vs Java enum mapping** — The `status` and `priority` columns use MySQL `ENUM`. On schema re-creation (e.g. adding a new status), the ENUM definition in MySQL must be updated manually.

3. **File upload directory permissions** — The `uploads/` directory must be writable by the JVM process.

4. **Concurrent status updates** — No optimistic locking on complaints; concurrent status updates from two admins could result in lost updates. Add `@Version` to `Complaint` entity if this is a concern.

5. **JWT secret rotation** — Changing `app.jwt.secret` invalidates all existing tokens immediately. Active sessions will require re-login.
