# Implementation Plan: Fix Instagram Token Handling & LinkedIn Media Loading

Fix Instagram publishing token handling and LinkedIn image upload media loading in `socialflow-backend`, while leaving Facebook, scheduler, DB schema, auth, and frontend completely untouched.

## Problem Analysis & Root Cause

### Issue 1: Instagram (Meta API error code 190 "Cannot parse access token")
1. **Host & Token Mismatch**:
   - The Instagram connection flow in `SocialAccountServiceImpl` uses **Instagram Login** (`api.instagram.com/oauth/authorize`, `api.instagram.com/oauth/access_token`, and `graph.instagram.com/access_token`).
   - The returned Instagram user access token (which begins with an Instagram prefix such as `IG...` rather than Meta Facebook Page `EA...`) is sent by `InstagramPublisher` to `https://graph.facebook.com/v19.0/{ig-user-id}/media`.
   - `graph.facebook.com` cannot parse an Instagram Login token and rejects it with:
     ```
     code=190 type=OAuthException Invalid OAuth access token Cannot parse access token
     ```
   - For Instagram Login tokens, the correct Meta endpoint is `https://graph.instagram.com/v20.0/{ig-user-id}/...`.
2. **Missing Local Validation & Diagnostics**:
   - `InstagramPublisher` did not validate that `account.getPlatform() == Platform.INSTAGRAM`, that `post.getRestaurant()` matches `account.getRestaurant()`, or check for blank, whitespace, quotes, or malformed tokens.
   - Safe diagnostics logging was not in place.
   - Malformed/blank tokens were sent to Meta instead of failing locally with `INSTAGRAM_TOKEN_INVALID`.
   - Meta code 190 errors were returned as generic strings like `Meta API error (code=190...)` instead of being classified as `INSTAGRAM_TOKEN_INVALID`.
3. **Token Sanitization & Reconnect**:
   - In `SocialAccountServiceImpl`, tokens received during Instagram OAuth exchange need sanitization (trimming and quote stripping) and validation before saving, ensuring any stale token is cleanly overwritten upon reconnect.

### Issue 2: LinkedIn Image Upload ("Could not read image content for LinkedIn upload")
1. **Missing Local Media Integration**:
   - `LinkedInPublisher` only attempted to load media via `post.getImageUrl()`. If `post.getMediaPath()` was populated (standard for SocialFlow uploads) and `imageUrl` was blank or a relative path `/api/media/files/...`, `fetchMediaBytes` returned `null`.
   - `LinkedInPublisher` did not have `MediaStorageService` injected.
   - When given `/api/media/files/...`, `fetchMediaBytes` skipped it because it did not start with `http://` or `https://` or `data:`.
2. **Missing MIME Type & Content Validation**:
   - LinkedIn requires registering and uploading binary bytes with valid MIME types (`image/jpeg`, `image/png`, etc.).
   - Did not inspect local files or magic bytes; failed with generic message instead of `LINKEDIN_MEDIA_READ_FAILED`.
   - Missing safe logging (LOCAL/PUBLIC, byte length, MIME type, filename, without tokens).

---

## Proposed Changes

### 1. Instagram Publisher: Token Validation, Endpoint Resolution & Error Classification
File: [`InstagramPublisher.java`](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/src/main/java/com/socialflow/service/publisher/InstagramPublisher.java)

- **Safe Diagnostics Logging**:
  Log `socialAccountId`, `restaurantId`, `platformAccountId`, `tokenPresent`, `tokenLength`, `containsWhitespace`, `isConnected`, `tokenExpiresAt` without ever logging the token value.
- **Local Pre-Flight Token & Account Validation**:
  - Verify `account != null` and `account.getPlatform() == Platform.INSTAGRAM`.
  - Verify restaurant ID alignment: `account.getRestaurant().getId().equals(post.getRestaurant().getId())`.
  - Validate token: reject if null, blank, contains whitespace (`\s`, `\n`, `\r`, `\t`), starts/ends with quotes (`"`, `'`), or is `"null"`/`"undefined"`, or length < 20.
  - Fail locally with `INSTAGRAM_TOKEN_INVALID` without calling Meta.
- **Endpoint Resolution & Resilience**:
  - Dynamically route to `https://graph.instagram.com/v20.0` for Instagram Login tokens (`IG...` or non-`EA...`) and `https://graph.facebook.com/v19.0` for Meta Page tokens.
  - Support fallback between hosts if a host mismatch occurs.
- **Error Classification**:
  - If Meta returns error code 190 / OAuthException / "Cannot parse access token", return `PublishResult.failure("INSTAGRAM_TOKEN_INVALID")`.

### 2. Instagram OAuth & Reconnect Token Sanitization
File: [`SocialAccountServiceImpl.java`](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/src/main/java/com/socialflow/service/impl/SocialAccountServiceImpl.java)

- In `exchangeInstagramTokens(...)`, sanitize `accessToken` (strip surrounding quotes and leading/trailing whitespace).
- On reconnect/callback:
  - Overwrite stale Instagram token with the fresh sanitized token.
  - Clear any previous error state.
  - Validate that the saved token is valid and non-blank.

### 3. LinkedIn Publisher: MediaStorageService Integration & Image Resolution
File: [`LinkedInPublisher.java`](file:///c:/Users/yoges/Projects/social-ai/socialflow-backend/src/main/java/com/socialflow/service/publisher/LinkedInPublisher.java)

- **Inject `MediaStorageService`**:
  Add `private final MediaStorageService mediaStorageService;`.
- **Support All Image Forms**:
  Check both `post.getMediaPath()` and `post.getImageUrl()`.
  Resolution order:
  1. Try `mediaStorageService.loadMediaBytes(mediaPath)` (if `mediaPath` present).
  2. Try `mediaStorageService.loadMediaBytes(imageUrl)` (handles `/api/media/files/{filename}`, local relative/absolute paths, and `data:` URIs).
  3. If public `http://` or `https://` URL, download image bytes via `restClient`.
- **Content Type & MIME Sniffing**:
  - Detect MIME type from metadata, URL/filename extension, response headers, or magic bytes (`image/jpeg`, `image/png`, `image/webp`, `image/gif`).
  - Reject unsupported MIME or empty/null bytes with `LINKEDIN_MEDIA_READ_FAILED`.
- **Safe Diagnostics Logging**:
  Log source type (`LOCAL`/`PUBLIC`), byte length, MIME type, filename. No tokens.
- **Error Classification**:
  Classify unreadable or invalid image errors as `LINKEDIN_MEDIA_READ_FAILED`.

---

## Verification Plan

### Automated Build & Compilation
```powershell
cd c:\Users\yoges\Projects\social-ai\socialflow-backend
mvn clean compile
```

### Manual Verification Checklist
1. **Instagram Flow**:
   - Reconnect Instagram account.
   - Verify DB row `is_connected=true` and token is properly stored without quotes or corruption.
   - Publish a JPG post; verify safe diagnostics are logged (no token printed).
   - If token is blank/malformed or code 190 received, verify error is strictly `INSTAGRAM_TOKEN_INVALID`.
2. **LinkedIn Flow**:
   - Upload fresh JPG.
   - Publish post to LinkedIn.
   - Verify `MediaStorageService` loads bytes locally without needing remote downloading.
   - Verify safe diagnostics log (`sourceType=LOCAL`, `byteLength > 0`, `mimeType=image/jpeg`).
   - Confirm LinkedIn post ID/URN is returned.