package com.socialflow.entity;

/**
 * Supported social media platforms in SocialFlow.
 *
 * ACTIVE / REAL INTEGRATION:
 *   FACEBOOK — Meta Graph API (Pages, feed & photo publishing, insights)
 *   LINKEDIN — LinkedIn OAuth 2.0 + LinkedIn Share API
 *   YOUTUBE  — Google OAuth 2.0 + YouTube Data API v3
 *
 * ADD NEXT:
 *   INSTAGRAM — Meta Graph API (Instagram Content Publishing API)
 *
 * REMOVED:
 *   TWITTER  — no longer supported in UI
 *   TIKTOK   — no longer supported
 *   PINTEREST — no longer supported
 */
public enum Platform {
    INSTAGRAM,
    FACEBOOK,
    TWITTER,
    YOUTUBE,
    LINKEDIN
}
