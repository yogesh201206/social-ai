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
   *(Connects to MySQL `socialflow` at port `8080`)*

### Running the Frontend
1. In `socialflow-ai` root directory:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:5173` in your browser.

---

## Scheduled Post Timezone & Timing Fix Walkthrough

### 1. Root Cause
- The frontend was sending local datetime strings (e.g. `2026-09-02T00:05:00`), which were saved directly into MySQL without converting from the selected timezone (`Asia/Kolkata` IST) to UTC (`2026-09-01T18:35:00Z`).
- The scheduler job `ScheduledPostPublisherJob` was querying against UTC (`LocalDateTime.now(ZoneOffset.UTC)` or `NOW() = 18:35:00 UTC`), causing the scheduler to treat `2026-09-02 00:05:00` as 5 hours and 30 minutes in the future.
- Slicing and parsing in frontend displayed raw string parts without localization.

### 2. Timezone Conversion Flow
```
User Local Selection (e.g. 02 Sep 2026, 12:05 AM IST)
                  ↓
Frontend sends: scheduledDateTime: "2026-09-02T00:05:00", timezone: "Asia/Kolkata"
                  ↓
Backend converts using ZoneId.of("Asia/Kolkata") -> UTC Instant -> 2026-09-01 18:35:00 UTC
                  ↓
Saved in MySQL database as: 2026-09-01 18:35:00 (UTC) + timezone: "Asia/Kolkata"
                  ↓
ScheduledPostPublisherJob: scheduledDateTime <= LocalDateTime.now(ZoneOffset.UTC)
                  ↓
At 12:05:00 AM IST (18:35:00 UTC): Job matches due post, transitions SCHEDULED -> PROCESSING -> PUBLISHED
                  ↓
---

# Real Facebook Page Integration Walkthrough

## Summary of Changes & Architecture

Real Facebook Page integration has been implemented across the backend and frontend of SocialFlow AI using the Meta Graph API (v19.0).

### 1. Facebook Page OAuth 2.0 Flow & Security
- **Endpoints**:
  - `GET /api/social-accounts/FACEBOOK/connect?restaurantId={restaurantId}`: Generates cryptographically secure CSRF state token linked to the authenticated user and restaurant, requesting scopes `pages_show_list,pages_manage_posts,pages_read_engagement,read_insights,public_profile`.
  - `GET /api/social-accounts/FACEBOOK/callback?code=...&state=...`: Validates CSRF state, exchanges authorization code for Meta User Access Token, and queries `GET /me/accounts` to retrieve all Facebook Pages managed by the user and their Page Access Tokens.
  - `GET /api/social-accounts/FACEBOOK/pages?selectionToken={token}`: Returns candidate Facebook Pages (names, IDs, categories — never tokens) for multi-page selection.
  - `POST /api/social-accounts/FACEBOOK/select-page`: Securely finalizes connecting the chosen Facebook Page.

### 2. Multi-Page Support
- **Single Page**: Auto-connects the Page immediately and redirects back to Settings (`?connected=FACEBOOK`).
- **Multiple Pages**: Returns `selectionToken` with 10-minute TTL, opens the **Facebook Page Selection Modal** in Settings, allowing the user to choose which Page to connect to the restaurant.

### 3. Real Meta Graph API Publishing (`FacebookPublisher.java`)
- **Text Post**: Publishes to `POST https://graph.facebook.com/v19.0/{page-id}/feed` with `message` and `access_token`.
- **Photo Post**: Uploads multipart image binary or URL to `POST https://graph.facebook.com/v19.0/{page-id}/photos` with `caption` and `access_token`. Cleans up temporary files upon success.
- **Scheduling**: Fully integrated with SocialFlow scheduler and UTC conversion in `ScheduledPostPublisherJob`.
- **Delete Everywhere**: Calls `DELETE https://graph.facebook.com/v19.0/{platformPostId}?access_token={page_access_token}` and removes local record only after external confirmation.
- **Real Performance Metrics**: Fetches real `reactions`, `comments`, `shares`, and `insights` (impressions/reach) via `GET /{platformPostId}`. Zero fake or fabricated metrics.

### 4. Platform Status & Alignment
- **ACTIVE**: `FACEBOOK`, `LINKEDIN`, `YOUTUBE`
- **ADD NEXT**: `INSTAGRAM` (Meta architecture preserved and ready)
- **REMOVED**: `TWITTER/X`, `TIKTOK`, `PINTEREST` (removed from selectable UI)

