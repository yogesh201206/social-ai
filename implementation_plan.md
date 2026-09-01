# Fix Scheduled Post Timing and Timezone Issue

## Overview
When a user schedules a social media post for a specific local time (e.g., `2026-09-02 00:05` in `Asia/Kolkata` IST), the post does not publish at the user's selected time because the local timestamp is saved directly as UTC in the database without timezone conversion. As a result, the scheduler comparing against UTC thinks the post is 5 hours and 30 minutes in the future.

This plan addresses the root cause by implementing proper local-to-UTC conversion on scheduling, UTC comparison in `ScheduledPostPublisherJob`, and UTC-to-local conversion for frontend display, without hardcoding offsets or altering unrelated functionalities.

---

## Root Cause Analysis
1. **Local Time Stored Directly Without Offset Conversion**:
   The frontend was passing local date-time strings (e.g. `2026-09-02T00:05:00`), and backend entities (`ScheduledPost`, `Post`) saved this value directly as a `LocalDateTime` into MySQL without converting from `Asia/Kolkata` to UTC (`2026-09-01T18:35:00Z`).
2. **Scheduler Comparison Mismatch**:
   `ScheduledPostPublisherJob` queried `scheduledDateTime <= LocalDateTime.now()`. When the server/database uses UTC (`NOW() = 18:35:00 UTC`), `2026-09-02 00:05:00` in the database is evaluated as 5.5 hours in the future.
3. **Frontend Display Slicing**:
   The frontend parsed datetime strings via raw string slicing (`split('T')[0]`), which showed whatever raw string was returned without localized timezone formatting.

---

## Proposed Changes

### Backend (`socialflow-backend`)

#### [MODIFY] [Post.java](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/src/main/java/com/socialflow/entity/Post.java)
- Add `private String timezone;` so that posts created/scheduled preserve their associated timezone.

#### [MODIFY] [PostRequest.java](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/src/main/java/com/socialflow/dto/PostRequest.java) & [PostResponse.java](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/src/main/java/com/socialflow/dto/PostResponse.java)
- Add `private String timezone;` to both request and response DTOs.

#### [MODIFY] [ScheduledPostServiceImpl.java](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/src/main/java/com/socialflow/service/impl/ScheduledPostServiceImpl.java)
- In `createSchedule` and `updateSchedule`:
  - Read `request.getScheduledDateTime()` and `request.getTimezone()` (defaulting to `"Asia/Kolkata"`).
  - Convert `LocalDateTime` in the user's `ZoneId` to UTC `LocalDateTime`:
    ```java
    ZoneId userZone = ZoneId.of(tzStr);
    ZonedDateTime userZoned = request.getScheduledDateTime().atZone(userZone);
    LocalDateTime utcDateTime = userZoned.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
    ```
  - Validate future time in UTC: `utcDateTime.isBefore(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1))`.
  - Persist `utcDateTime` and `timezone` to `ScheduledPost` and `Post`.

#### [MODIFY] [PostServiceImpl.java](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/src/main/java/com/socialflow/service/impl/PostServiceImpl.java) & [PostService.java](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/src/main/java/com/socialflow/service/PostService.java) & [PostController.java](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/src/main/java/com/socialflow/controller/PostController.java)
- In `createPost`, `updatePost`, and `schedulePost`:
  - Convert incoming local `scheduledAt` using the provided `timezone` to UTC `LocalDateTime`.
  - Validate future timestamp against `LocalDateTime.now(ZoneOffset.UTC)`.
  - Save UTC timestamp in `post.setScheduledAt(utcDateTime)` and `scheduledPost.setScheduledDateTime(utcDateTime)`.
  - In `publishPost`: use `LocalDateTime.now(ZoneOffset.UTC)` for `publishedAt`.

#### [MODIFY] [ScheduledPostPublisherJob.java](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/src/main/java/com/socialflow/service/ScheduledPostPublisherJob.java)
- In `publishDuePosts()`:
  - Query due posts using `LocalDateTime.now(ZoneOffset.UTC)`:
    ```java
    LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
    List<ScheduledPost> duePosts = scheduledPostRepository
            .findByStatusAndScheduledDateTimeBefore(ScheduleStatus.SCHEDULED, nowUtc);
    ```
  - In `processScheduledPost()`:
    - On success: set `post.setPublishedAt(LocalDateTime.now(ZoneOffset.UTC))`, status `PUBLISHED` on both `Post` and `ScheduledPost`.
    - On failure: mark status `FAILED` on both `Post` and `ScheduledPost`.

---

### Frontend (`src/`)

#### [MODIFY] [SchedulerContext.jsx](file:///c:/Users/yoges/Projects/social-ai/src/context/SchedulerContext.jsx)
- Implement timezone conversion utilities using `Intl.DateTimeFormat`:
  - Parse UTC strings properly (`dateStr + 'Z'`).
  - `formatDisplayDate(dateStr, timezone)`: Formats in user timezone (e.g. `September 2, 2026`).
  - `formatDisplayTime(dateStr, timezone)`: Formats in user timezone (e.g. `12:05 AM`).
  - `parseDatePartInTimezone(dateStr, timezone)`: Returns `YYYY-MM-DD` in target timezone for inputs.
  - `parseTimeInputInTimezone(dateStr, timezone)`: Returns `HH:mm` in target timezone for inputs.
- Send `scheduledDateTime` (local datetime format `YYYY-MM-DDTHH:mm:ss`) and `timezone` to the backend.

#### [MODIFY] [PostContext.jsx](file:///c:/Users/yoges/Projects/social-ai/src/context/PostContext.jsx)
- Update `mapPostFromBackend` to format `scheduledDate` and `scheduledTime` in the post's timezone.
- Pass `timezone` when creating, updating, and scheduling posts.

#### [MODIFY] [CreateSchedule.jsx](file:///c:/Users/yoges/Projects/social-ai/src/pages/scheduler/CreateSchedule.jsx) & [CreatePost.jsx](file:///c:/Users/yoges/Projects/social-ai/src/pages/posts/CreatePost.jsx)
- Ensure timezone field is sent in request payloads (`timezone: form.timezone || 'Asia/Kolkata'`).
- Validate that selected date and time in the selected timezone is in the future before submitting.

#### [MODIFY] [ScheduledPostDetails.jsx](file:///c:/Users/yoges/Projects/social-ai/src/pages/scheduler/ScheduledPostDetails.jsx) & [ScheduleCalendar.jsx](file:///c:/Users/yoges/Projects/social-ai/src/pages/scheduler/ScheduleCalendar.jsx)
- Verify timezone-aware date and time rendering so scheduled posts display the user's selected time (e.g., `02 Sep 2026, 12:05 AM IST`).

---

## Verification Plan

### Timezone Conversion Verification
- Sample test case:
  - Input Local: `2026-09-02 00:05:00`
  - Input Timezone: `Asia/Kolkata` (UTC+05:30)
  - Backend UTC Conversion: `2026-09-01 18:35:00 UTC`
  - ScheduledPostPublisherJob comparison: At `2026-09-01 18:35:00 UTC` (which is `2026-09-02 00:05:00 IST`), `nowUtc >= scheduledDateTime` becomes `true` and the post publishes immediately on time.
  - Frontend Display: `02 Sep 2026, 12:05 AM IST`.

### Static Code Validation
- Review all modified backend Java files for type safety, null safety, and clean exception handling.
- Review all modified frontend JSX files for clean state management, timezone formatting, and validation.
