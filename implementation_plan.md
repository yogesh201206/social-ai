# Phase 9 – Backend Development & Database Integration Implementation Plan

Build the Spring Boot backend and MySQL database for **SocialFlow AI**, create clean layered REST APIs for all modules, and integrate the React frontend with these APIs while preserving mock fallback for seamless user experience.

## User Review Required

> [!IMPORTANT]
> - **Backend Framework**: Java 17+, Spring Boot 3.x, Maven, Spring Data JPA, Spring Security (JWT authentication + BCrypt), Jakarta Validation, and MySQL Driver.
> - **Database**: Schema `socialflow_ai`. Configuration driven by environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`). Includes H2 in-memory DB fallback so backend runs seamlessly even if local MySQL server is not active.
> - **Frontend Integration**: Modular API clients in `src/services/` (`api.js`, `authService.js`, `restaurantService.js`, `postService.js`, `schedulerService.js`, `analyticsService.js`, `emailService.js`, `aiService.js`, `adminService.js`, `userService.js`) and updated Contexts supporting live backend data with fallback to mock datasets.

## Proposed Changes

### 1. Spring Boot Backend Project (`socialflow-backend/`)

#### [NEW] [pom.xml](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/pom.xml)
- Spring Boot 3.2.3 dependencies: `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `mysql-connector-j`, `h2`, `spring-boot-starter-validation`, `spring-boot-starter-security`, `jjwt-api`, `jjwt-impl`, `jjwt-jackson`, `lombok`.

#### [NEW] [application.properties](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/src/main/resources/application.properties)
- DB connection config (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`), Hibernate auto-ddl (`update`), SQL logging, CORS settings.

#### [NEW] Entities (`src/main/java/com/socialflow/entity/`)
- `User.java`: `id`, `name`, `email` (unique), `password`, `phone`, `businessName`, `businessType`, `plan`, `role` (`USER`, `ADMIN`), `status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`), `createdAt`, `updatedAt`.
- `Restaurant.java`: `id`, `name`, `category`, `businessType`, `description`, `phone`, `email`, `address`, `owner` (ManyToOne to User), `status`, `createdAt`, `updatedAt`.
- `Branch.java`: `id`, `branchName`, `address`, `city`, `state`, `phone`, `restaurant` (ManyToOne to Restaurant), `status`, `createdAt`.
- `Post.java`: `id`, `title`, `caption`, `imageUrl`, `hashtags`, `platform` (`INSTAGRAM`, `FACEBOOK`, `TWITTER`, `TIKTOK`, `YOUTUBE`), `restaurant`, `branch`, `status` (`DRAFT`, `SCHEDULED`, `PUBLISHED`, `CANCELLED`), `scheduledAt`, `publishedAt`, `createdAt`, `updatedAt`.
- `ScheduledPost.java`: `id`, `post`, `restaurant`, `branch`, `platform`, `scheduledDateTime`, `timezone`, `status` (`SCHEDULED`, `PUBLISHED`, `CANCELLED`), `createdAt`, `updatedAt`.
- `AIHistory.java`: `id`, `user`, `restaurant`, `contentType` (`Caption`, `Hashtags`, `CTA`, `Marketing Idea`, `Email Content`), `prompt`, `generatedContent`, `createdAt`.
- `EmailCampaign.java`: `id`, `campaignName`, `restaurant`, `branch`, `audience`, `subject`, `previewText`, `content`, `ctaText`, `ctaLink`, `recipientCount`, `status` (`DRAFT`, `SCHEDULED`, `SENT`, `PAUSED`), `scheduledAt`, `sentAt`, `createdAt`, `updatedAt`.
- `Analytics.java`: `id`, `restaurant`, `branch`, `platform`, `date`, `reach`, `impressions`, `likes`, `comments`, `shares`, `followers`, `engagementRate`.

#### [NEW] Repositories (`src/main/java/com/socialflow/repository/`)
- `UserRepository`, `RestaurantRepository`, `BranchRepository`, `PostRepository`, `ScheduledPostRepository`, `AIHistoryRepository`, `EmailCampaignRepository`, `AnalyticsRepository`.

#### [NEW] DTOs & Exceptions (`src/main/java/com/socialflow/dto/`, `exception/`)
- Request/Response DTOs for Auth, Users, Restaurants, Branches, Posts, Schedules, AI History, Email Campaigns, Analytics, Admin Dashboard.
- Custom exceptions: `ResourceNotFoundException`, `BadRequestException`, `UnauthorizedException`.
- `GlobalExceptionHandler`: Centralized JSON error format (`status`, `message`, `timestamp`, `details`).

#### [NEW] Security & JWT (`src/main/java/com/socialflow/security/`, `config/`)
- `JwtTokenProvider`, `JwtAuthenticationFilter`, `UserPrincipal`, `CustomUserDetailsService`.
- `SecurityConfig`: Configures BCrypt, Stateless JWT filter, route authorization (`/api/auth/**` public, `/api/admin/**` requires `ROLE_ADMIN`).
- `CorsConfig`: Permits frontend dev server (`http://localhost:5173`).

#### [NEW] Services & Controllers (`src/main/java/com/socialflow/service/`, `controller/`)
- Services & Controllers for Authentication, Users, Restaurants & Branches, Posts, AI History, Schedules, Email Campaigns, Analytics, and Admin Management.
- `DataInitializer`: Seed data generator for initial startup.

---

### 2. Frontend Integration Layer (`src/services/` & `src/context/`)

#### [NEW] API Services (`src/services/`)
- `api.js`: Base fetch client configured with `VITE_API_BASE_URL` and automatic JWT `Authorization` header insertion.
- `authService.js`, `restaurantService.js`, `postService.js`, `schedulerService.js`, `aiService.js`, `emailService.js`, `analyticsService.js`, `adminService.js`, `userService.js`.

#### [NEW] [AuthContext.jsx](file:///c:/Users/yoges/Projects/social-ai/src/context/AuthContext.jsx)
- Global context for managing current authenticated user state, JWT token, login, register, and logout.

#### [MODIFY] Contexts (`src/context/`)
- Update `RestaurantContext`, `PostContext`, `AIContext`, `SchedulerContext`, `AnalyticsContext`, `EmailMarketingContext`, `AdminContext` to call API services while falling back to mock data if API request is pending or backend is offline.

#### [NEW] [.env](file:///c:/Users/yoges/Projects/social-ai/.env) & [.env.example](file:///c:/Users/yoges/Projects/social-ai/.env.example)
- `VITE_API_BASE_URL=http://localhost:8080/api`

---

## Verification Plan

### Automated / Build Verification
- Verify clean compilation of Spring Boot Java sources.
- Verify React build passes via Vite build check.

### Manual Verification
- Verify endpoints structure and payload definitions.
- Verify JWT Authentication flow (Login/Register -> Bearer Token -> Secured Endpoints).
- Verify mock data fallback in frontend context hooks.
