# Phase 9 – Backend Development & Database Integration Walkthrough

## Summary of Accomplishments

Phase 9 successfully delivers the complete **Spring Boot backend** and **MySQL database integration** for **SocialFlow AI**, along with a unified frontend API service layer and Context connections.

---

### 1. Spring Boot Backend Project (`socialflow-backend`)

#### Project Setup
- **Framework**: Java 17+, Spring Boot 3.2.3, Maven.
- **Dependencies**: Spring Web, Spring Data JPA, Spring Security, Jakarta Validation, MySQL Driver, H2 Database (zero-config fallback), JJWT (0.11.5), Lombok.
- **Config**: Environment variable driven (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`).

#### Entities & Schema (`com.socialflow.entity`)
- `User`: Handles user registration, authentication, plan, role (`USER`, `ADMIN`), status (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
- `Restaurant`: Stores restaurant details, category, business type, owner reference.
- `Branch`: Multi-branch tracking linked to restaurants.
- `Post`: Social media post drafts, scheduled, and published content with image URL and hashtag storage.
- `ScheduledPost`: Handles post scheduling timestamps, platforms, and timezone info.
- `AIHistory`: Persists AI-generated captions, hashtags, CTAs, marketing ideas, and email content.
- `EmailCampaign`: Stores campaign subject, preview text, content, recipient counts, and scheduling status.
- `Analytics`: Per-restaurant & branch performance metrics (reach, impressions, likes, comments, shares, engagement rate).

#### Security & Authentication (`com.socialflow.security` & `config`)
- **BCrypt Password Hashing**: Passwords stored securely.
- **JWT Token Provider**: Stateless JWT generation and verification.
- **Role-Based Authorization**:
  - `/api/auth/**`: Public access.
  - `/api/admin/**`: Protected with `ROLE_ADMIN`.
  - `/api/**`: Protected with valid Bearer Token.
- **CORS Config**: Configured for Vite frontend dev server (`http://localhost:5173`).

#### Layered Architecture
- **Repositories**: JPA interfaces with query methods (`findByEmail`, `findByOwnerEmail`, `findByStatus`, etc.).
- **Services**: Clean business logic layer (`AuthService`, `UserService`, `RestaurantService`, `BranchService`, `PostService`, `ScheduledPostService`, `AIHistoryService`, `EmailCampaignService`, `AnalyticsService`, `AdminService`).
- **Controllers**: 10 REST Controllers providing endpoints for Auth, Users, Restaurants, Branches, Posts, Schedules, AI History, Campaigns, Analytics, and Admin metrics.
- **DataInitializer**: Auto-seeds initial demo users (`user@socialflow.ai` / `password123`, `admin@socialflow.ai` / `adminpassword`), restaurant, posts, campaigns, and analytics records.

---

### 2. Frontend API Service Layer (`src/services/`)

- `api.js`: Base fetch client configured with `VITE_API_BASE_URL` and automatic JWT `Authorization: Bearer <token>` insertion.
- `authService.js`: login, register, getCurrentUser, logout.
- `restaurantService.js`: CRUD operations for restaurants & branches.
- `postService.js`: CRUD, draft, scheduled, published, schedule, and cancel post endpoints.
- `schedulerService.js`: CRUD and schedule cancellation endpoints.
- `aiService.js`: AI generation history fetch, save, and delete.
- `emailService.js`: Email campaign management & scheduling.
- `analyticsService.js`: Overview stats and platform analytics.
- `adminService.js`: Dashboard metrics, user list, restaurant list, reports.
- `userService.js`: User status updates (Activate, Deactivate, Suspend).

---

### 3. Frontend Context Connections (`src/context/`)

- **AuthContext**: React context for authentication, JWT storage, user login/register/logout.
- **RestaurantContext, PostContext, AIContext, SchedulerContext, AnalyticsContext, EmailMarketingContext, AdminContext**:
  - Connected to live backend REST API endpoints.
  - Features **seamless fallback to mock data** if the API is loading or offline, ensuring existing Phase 1–8 functionality and UI remains 100% operational!

---

## Instructions to Run

### Running the Backend
1. Navigate to `socialflow-backend`:
   ```bash
   cd socialflow-backend
   ```
2. Run using Maven:
   ```bash
   mvn spring-boot:run
   ```
   *(By default, connects to MySQL `socialflow_ai` or falls back gracefully to H2 in-memory DB at port `8080`)*

### Running the Frontend
1. In `socialflow-ai` root directory:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:5173` in your browser.

---

## Postman / API Testing

- `POST /api/auth/register`: `{ "name": "John", "email": "john@test.com", "password": "password123" }`
- `POST /api/auth/login`: `{ "email": "user@socialflow.ai", "password": "password123" }`
- `GET /api/auth/me`: Returns current authenticated user details.
- `GET /api/restaurants`: Returns user restaurants.
- `GET /api/posts`: Returns posts list.
- `GET /api/admin/dashboard`: Returns admin metrics (requires `ROLE_ADMIN`).
