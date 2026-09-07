# Walkthrough: Instagram Token Handling & LinkedIn Media Loading Fixes

## Overview
We fixed two isolated issues:
1. **Instagram Publishing Token Handling & Error Classification**: Resolved Meta API error code 190 ("Cannot parse access token"), added safe diagnostics, pre-flight validation (`INSTAGRAM_TOKEN_INVALID`), correct API host routing, and token sanitization upon reconnect.
2. **LinkedIn Image Upload Media Loading**: Injected `MediaStorageService` into `LinkedInPublisher`, enabled local file loading for both `mediaPath` and `imageUrl` (`/api/media/files/...`), added MIME sniffing/validation (`image/jpeg`, `image/png`), safe diagnostics logging, and error classification (`LINKEDIN_MEDIA_READ_FAILED`).

---

## Key Changes

### 1. Instagram Publisher
[`InstagramPublisher.java`](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/src/main/java/com/socialflow/service/publisher/InstagramPublisher.java)
- **Safe Diagnostics**: Logs `socialAccountId`, `restaurantId`, `platformAccountId`, `tokenPresent`, `tokenLength`, `containsWhitespace`, `isConnected`, `tokenExpiresAt` without ever exposing the token.
- **Local Validation**: Fails locally with `INSTAGRAM_TOKEN_INVALID` if the token is missing, malformed, quoted, contains whitespace, or if platform/restaurant mismatch occurs.
- **API Endpoint Routing**: Directs Instagram Login tokens (`IG...`) to `https://graph.instagram.com/v20.0` rather than `graph.facebook.com`.
- **Error Classification**: Maps Meta error code 190 to `INSTAGRAM_TOKEN_INVALID`.

### 2. Social Account Service
[`SocialAccountServiceImpl.java`](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/src/main/java/com/socialflow/service/impl/SocialAccountServiceImpl.java)
- Sanitizes access tokens by trimming and stripping surrounding quotes.
- Ensures reconnect overwrites any stale Instagram token cleanly in `handleCallbackWithResult`.

### 3. LinkedIn Publisher
[`LinkedInPublisher.java`](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/src/main/java/com/socialflow/service/publisher/LinkedInPublisher.java)
- Injected `MediaStorageService`.
- Supports all SocialFlow image paths (`mediaPath`, `/api/media/files/...`, `data:`, and remote `https://`).
- Validates MIME types (`image/jpeg`, `image/png`, etc.) via extension and magic byte sniffing.
- Maps media read failures to `LINKEDIN_MEDIA_READ_FAILED`.

---

## Verification Guide

### Compile
```powershell
cd c:\Users\yoges\Projects\social-ai\socialflow-backend
mvn clean compile
```

### Instagram Test
1. Disconnect and reconnect your Instagram account.
2. Verify `social_accounts` has `is_connected=true` and non-corrupted tokens.
3. Publish a JPG post and confirm media container creation and publish succeed.
4. If token is invalid or code 190 is encountered, verify failure reason is `INSTAGRAM_TOKEN_INVALID`.

### LinkedIn Test
1. Upload a JPG image post.
2. Publish to LinkedIn.
3. Verify `MediaStorageService` loads the image locally (`sourceType=LOCAL`, `mimeType=image/jpeg`).
4. Confirm LinkedIn post ID/URN is returned.
