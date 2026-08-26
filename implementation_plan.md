# Phase 8 – Admin Panel & User Management Module Implementation Plan

This plan outlines the architecture and frontend implementation for Phase 8 of SocialFlow AI: **Admin Panel & User Management Module**.

## User Review Required

> [!IMPORTANT]
> - This module is **Frontend Only**. All mutations (user status changes, restaurant approvals, admin settings) are saved in local React state via `AdminContext` with realistic mock data.
> - All destructive or status-altering actions (Activate, Deactivate, Suspend, Approve, Delete) will prompt a confirmation modal with instant feedback toasts using the existing `NotificationContext`.
> - Admin access guard ensures non-admin role simulation can be demonstrated cleanly.

## Proposed Changes

### Data & Context Layer

#### [NEW] [adminData.js](file:///c:/Users/yoges/Projects/social-ai/src/data/adminData.js)
- Mock dataset containing:
  - `adminStats`: Total Users (248), Active Users (216), Total Restaurants (86), Total Branches (142), Total Posts (4,820), Scheduled Posts (684), AI Generations (12.8K), Active Campaigns (94).
  - `initialUsers`: 12–15 realistic user profiles with Name, Email, Phone, Business Name, Business Type, Plan (Starter, Professional, Enterprise, Trial), Status (Active, Inactive, Suspended), Joined Date, Restaurant & Branch counts, Posts count, AI Generations count, Campaigns count, and recent activity logs.
  - `initialRestaurants`: 8–10 restaurant entities with Name, Owner, Category, Business Type, Contact, Address, Location, Status (Active, Inactive, Pending), Branches list, Performance metrics, and Created Date.
  - `platformActivityData`: Timeline dataset for activity charts (New Users, New Restaurants, Posts Created, AI Generations, Campaigns Created).
  - `reportsData`: Multi-metric analytics dataset for user growth, restaurant growth, post activity, AI usage, and campaign engagement across date ranges.
  - `initialAdminSettings`: Toggle settings for registration allowances, maintenance mode, notification preferences, 2FA security, and system preferences.

#### [NEW] [AdminContext.jsx](file:///c:/Users/yoges/Projects/social-ai/src/context/AdminContext.jsx)
- React context managing state for `users`, `restaurants`, `reportsData`, `adminSettings`, and `adminStats`.
- State mutation helper functions:
  - `getUser(id)`
  - `updateUserStatus(id, newStatus)`
  - `deleteUser(id)`
  - `getRestaurant(id)`
  - `updateRestaurantStatus(id, newStatus)`
  - `approveRestaurant(id)`
  - `deleteRestaurant(id)`
  - `updateAdminSettings(newSettings)`
- Integrates with `useNotifications()` to display toasts upon state updates.

---

### Admin Components

#### [NEW] [AdminConfirmationModal.jsx](file:///c:/Users/yoges/Projects/social-ai/src/components/admin/AdminConfirmationModal.jsx)
- Modal dialog for confirming actions (Deactivate User, Suspend User, Delete User, Approve Restaurant, Deactivate Restaurant, Delete Restaurant).
- Includes action-specific colors (warning yellow, danger red, success green), title, message, cancel, and confirm buttons.

#### [NEW] [AdminGuard.jsx](file:///c:/Users/yoges/Projects/social-ai/src/components/admin/AdminGuard.jsx)
- Frontend role simulation component ensuring admin access control UI representation.

---

### Admin Pages

#### [MODIFY] [AdminDashboard.jsx](file:///c:/Users/yoges/Projects/social-ai/src/pages/AdminDashboard.jsx)
- Route: `/admin`
- Page title: **"Admin Dashboard"**, Subtitle: **"Monitor and manage the SocialFlow AI platform."**
- 8 Stat cards: Total Users (248), Active Users (216), Total Restaurants (86), Total Branches (142), Total Posts (4,820), Scheduled Posts (684), AI Generations (12.8K), Active Campaigns (94).
- Platform Overview section with activity metrics (New Users, New Restaurants, Posts Created, AI Generations, Campaigns Created).
- Interactive SVG activity chart over time (`AreaChartComponent`).
- System activity timeline and server health summary.

#### [NEW] [UsersManagement.jsx](file:///c:/Users/yoges/Projects/social-ai/src/pages/admin/UsersManagement.jsx)
- Route: `/admin/users`
- Page title: **"User Management"**
- Search bar (Name, Email, Business).
- Filter controls: Status (All, Active, Inactive, Suspended), Plan (All, Starter, Professional, Enterprise, Trial), Business Type.
- Responsive Data Table: User (Name & Email), Email, Business, Business Type, Restaurants, Joined Date, Plan, Status, Actions.
- Action triggers for View (`/admin/users/:id`), Edit, Activate, Deactivate, Suspend, and Delete with confirmation modal.

#### [NEW] [UserDetails.jsx](file:///c:/Users/yoges/Projects/social-ai/src/pages/admin/UserDetails.jsx)
- Route: `/admin/users/:id`
- User Profile Overview card (Name, Email, Phone, Business Name, Business Type, Plan, Joined Date, Status).
- Stat Cards: Restaurants, Branches, Posts, AI Generations, Campaigns.
- Activity feed tabs: Recent Posts, Recent AI Generations, Recent Campaigns.
- Direct status management action buttons with confirmation modal triggers.

#### [NEW] [RestaurantsManagement.jsx](file:///c:/Users/yoges/Projects/social-ai/src/pages/admin/RestaurantsManagement.jsx)
- Route: `/admin/restaurants`
- Page title: **"Restaurant Management"**
- Search bar (Restaurant Name, Owner, Location).
- Filters: Category Filter, Status Filter (All, Active, Inactive, Pending).
- Responsive Data Table: Restaurant Name, Owner, Category, Branches, Location, Posts, Status, Created Date, Actions (View, Approve, Deactivate, Delete).

#### [NEW] [RestaurantDetails.jsx](file:///c:/Users/yoges/Projects/social-ai/src/pages/admin/RestaurantDetails.jsx)
- Route: `/admin/restaurants/:id`
- Restaurant Info card (Name, Owner, Category, Business Type, Contact, Address).
- Branch Information table (Branch Name, Location, Contact, Status).
- Performance stats & activity metrics (Posts, Scheduled Posts, AI Generations, Campaigns, Reach).
- Status actions (Approve, Activate, Deactivate, Delete) with confirmation modals.

#### [NEW] [AdminReports.jsx](file:///c:/Users/yoges/Projects/social-ai/src/pages/admin/AdminReports.jsx)
- Route: `/admin/reports`
- Page title: **"Admin Reports & Analytics"**
- Analytics breakdown: User Growth, Restaurant Growth, Post Activity, AI Usage, Campaign Activity.
- Date Range filter options (Last 7 Days, Last 30 Days, Last 3 Months, This Year) and Business Type / Category filters.
- Reusable chart visualizers (`AreaChartComponent` / SVG bar representations).

#### [NEW] [AdminSettings.jsx](file:///c:/Users/yoges/Projects/social-ai/src/pages/admin/AdminSettings.jsx)
- Route: `/admin/settings`
- Page title: **"Admin Settings"**
- Sections: Platform Settings, Notification Settings, Security Settings, System Preferences.
- Toggle switches, inputs, and instant local state save with notification toast confirmation.

---

### Navigation & App Wiring

#### [MODIFY] [main.jsx](file:///c:/Users/yoges/Projects/social-ai/src/main.jsx)
- Import and wrap `<AdminProvider>` in the provider stack.

#### [MODIFY] [dashboardData.js](file:///c:/Users/yoges/Projects/social-ai/src/data/dashboardData.js)
- Add admin route titles (`/admin`, `/admin/users`, `/admin/users/:id`, `/admin/restaurants`, `/admin/restaurants/:id`, `/admin/reports`, `/admin/settings`) to `routeTitles`.

#### [MODIFY] [AppRoutes.jsx](file:///c:/Users/yoges/Projects/social-ai/src/routes/AppRoutes.jsx)
- Wire up all admin routes within `<Route element={<DashboardLayout links={adminSidebarLinks} />}>`:
  - `/admin` -> `AdminDashboard`
  - `/admin/users` -> `UsersManagement`
  - `/admin/users/:id` -> `UserDetails`
  - `/admin/restaurants` -> `RestaurantsManagement`
  - `/admin/restaurants/:id` -> `RestaurantDetails`
  - `/admin/reports` -> `AdminReports`
  - `/admin/settings` -> `AdminSettings`

---

## Verification Plan

### Automated Build & Syntax Checks
- Run Vite build command (`npm run build`) to ensure zero syntax errors or missing imports.

### Manual Verification
- Test `/admin`: Verify all 8 stat cards render exact or realistic values, platform overview activity section renders properly, and activity chart works.
- Test `/admin/users`: Test search box (Name, Email, Business), Status filter, Plan filter, Business Type filter. Ensure table is fully responsive.
- Test `/admin/users/:id`: Click View on a user, check profile details, stats, recent activities, and perform status changes via confirmation modal. Verify notification toast appears.
- Test `/admin/restaurants`: Search and filter by category & status. Test Approve, Deactivate, and Delete actions via confirmation modal.
- Test `/admin/restaurants/:id`: Click View on a restaurant, check restaurant info, branch info table, performance metrics, and status actions.
- Test `/admin/reports`: Verify date range filters (7 Days, 30 Days, 3 Months, This Year) update analytics charts and metrics.
- Test `/admin/settings`: Toggle switches for platform, notification, security, and system preferences. Verify toast notifications on save.
- Test Admin Sidebar & Navigation: Verify clicking all sidebar items routes smoothly.
- Test Dark/Light Mode & Responsiveness: Confirm dark mode styling and zero horizontal scrolling on mobile/tablet viewports.
