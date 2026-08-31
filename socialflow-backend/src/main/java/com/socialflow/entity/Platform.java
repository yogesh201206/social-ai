package com.socialflow.entity;

/**
 * Supported social media platforms in SocialFlow.
 *
 * ACTIVE / REAL INTEGRATION:
 *   TWITTER  — X (Twitter) OAuth 2.0 + API v2
 *   YOUTUBE  — Google OAuth 2.0 + YouTube Data API v3
 *   LINKEDIN — LinkedIn OAuth 2.0 + LinkedIn Share API
 *
 * COMING SOON (architecture ready, publishing disabled):
 *   INSTAGRAM — Meta Graph API (requires Meta Business verification)
 *   FACEBOOK  — Meta Graph API (requires Meta Business verification)
 *
 * REMOVED:
 *   TIKTOK — no longer supported
 */
public enum Platform {
    INSTAGRAM,
    FACEBOOK,
    TWITTER,
    YOUTUBE,
    LINKEDIN
}
