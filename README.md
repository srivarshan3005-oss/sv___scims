# SCIMS — Smart Community Issue Management System

A full-stack web application that connects citizens with city administrators to report, track, and resolve community issues such as road damage, garbage, water leakage, and streetlight failures.

---

## Features

**Citizen**
- Register / login with JWT authentication
- Submit complaints with optional photo evidence
- Track complaint status in real time (Pending → In Progress → Resolved)
- View full status history and admin remarks
- Edit profile and upload a profile photo

**Admin**
- Dashboard with complaint statistics and progress bars
- View, filter, search, and paginate all complaints
- Update complaint status with remarks
- Manage citizens (activate / deactivate accounts)
- Manage complaint categories (create, edit, toggle, delete)

---

## Technology Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, React Router 6, Bootstrap 5, Axios   |
| Backend    | Spring Boot 3.2, Spring Security, Spring Data JPA |
| Auth       | JWT (jjwt 0.11.5), BCrypt password hashing     |
| Database   | MySQL 8                                         |
| Build      | Maven (backend), Create React App (frontend)    |

---

## Prerequisites

- Java 17+
- Node.js 18+
- MySQL 8+
- Maven 3.8+

---

## Installation

### 1. Database

```sql
mysql -u root -p < sql/schema.sql
```

This creates the `scims_db` database, all tables, indexes, seed roles, categories, and demo users.

**Demo credentials**

| Role    | Email                | Password     |
|---------|----------------------|--------------|
| Admin   | admin@scims.com      | Admin@123    |
| Citizen | john@example.com     | Citizen@123  |
| Citizen | jane@example.com     | Citizen@123  |

### 2. Backend

```bash
cd backend
# Edit src/main/resources/application.properties if your MySQL credentials differ
mvn spring-boot:run
```

The API starts on **http://localhost:8080/api**

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

The app opens on **http://localhost:3000**

---

## Project Structure

```
sv-clean/
├── sql/
│   └── schema.sql              # Database schema + seed data
│
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/scims/
│       ├── ScimsApplication.java
│       ├── config/             # SecurityConfig, AppConfig (CORS, file serving)
│       ├── controller/         # REST controllers (Auth, Admin, Citizen, Category)
│       ├── dto/                # Request / Response DTOs
│       ├── entity/             # JPA entities
│       ├── exception/          # Custom exceptions + GlobalExceptionHandler
│       ├── repository/         # Spring Data JPA repositories
│       ├── security/           # JWT filter, UserDetailsImpl, JwtUtils
│       └── service/            # Service interfaces + implementations
│
└── frontend/
    ├── package.json
    └── src/
        ├── api/                # Axios instance + API functions
        ├── components/
        │   ├── auth/           # PrivateRoute, AdminRoute, CitizenRoute
        │   └── common/         # Layout, Sidebar, StatusBadge, PriorityBadge
        ├── pages/
        │   ├── admin/          # AdminDashboard, AdminComplaints, AdminUsers, AdminCategories
        │   └── citizen/        # CitizenDashboard, ComplaintForm, ComplaintList, ComplaintTrack, ProfilePage
        ├── utils/
        │   ├── AuthContext.js  # React auth context + useAuth hook
        │   └── helpers.js      # Date formatting, badge helpers, error extraction
        ├── App.js              # Route definitions
        └── index.css           # Global styles
```

---

## Running Tests

```bash
cd backend
mvn test
```

The test suite uses an in-memory H2 database so no MySQL connection is required.

---

## Configuration Reference

Key settings in `backend/src/main/resources/application.properties`:

| Property                    | Default              | Description                              |
|-----------------------------|----------------------|------------------------------------------|
| `server.port`               | `8080`               | Backend port                             |
| `spring.datasource.url`     | `...scims_db...`     | MySQL connection URL                     |
| `spring.datasource.username`| `root`               | MySQL username                           |
| `spring.datasource.password`| `root`               | MySQL password                           |
| `app.jwt.secret`            | (66-char string)     | HMAC-SHA256 signing key (min 32 chars)   |
| `app.jwt.expiration`        | `86400000`           | Token lifetime in ms (default: 24 hours) |
| `app.upload.dir`            | `uploads`            | Directory for uploaded images            |
| `app.cors.allowed-origins`  | `http://localhost:3000` | Allowed CORS origins                  |

---

## API Endpoints

### Auth (public)
| Method | Path              | Description        |
|--------|-------------------|--------------------|
| POST   | `/api/auth/login`    | Login              |
| POST   | `/api/auth/register` | Register as citizen|

### Citizen (requires ROLE_CITIZEN)
| Method | Path                           | Description             |
|--------|--------------------------------|-------------------------|
| GET    | `/api/citizen/dashboard`       | Stats for current user  |
| GET    | `/api/citizen/profile`         | Get profile             |
| PUT    | `/api/citizen/profile`         | Update profile          |
| POST   | `/api/citizen/profile/image`   | Upload profile photo    |
| GET    | `/api/citizen/complaints`      | List my complaints      |
| POST   | `/api/citizen/complaints`      | Submit new complaint    |
| GET    | `/api/citizen/complaints/{id}` | View complaint          |
| DELETE | `/api/citizen/complaints/{id}` | Delete (PENDING only)   |

### Admin (requires ROLE_ADMIN)
| Method | Path                              | Description          |
|--------|-----------------------------------|----------------------|
| GET    | `/api/admin/dashboard`            | System stats         |
| GET    | `/api/admin/users`                | List citizens        |
| PATCH  | `/api/admin/users/{id}/toggle-status` | Activate/deactivate |
| GET    | `/api/admin/complaints`           | All complaints (filterable) |
| PATCH  | `/api/admin/complaints/{id}/status` | Update status      |
| DELETE | `/api/admin/complaints/{id}`      | Delete complaint     |

### Categories
| Method | Path                       | Description              |
|--------|----------------------------|--------------------------|
| GET    | `/api/categories/active`   | Active categories (auth) |
| GET    | `/api/categories`          | All categories (admin)   |
| POST   | `/api/categories`          | Create (admin)           |
| PUT    | `/api/categories/{id}`     | Update (admin)           |
| PATCH  | `/api/categories/{id}/toggle` | Toggle active (admin) |
| DELETE | `/api/categories/{id}`     | Delete (admin)           |
