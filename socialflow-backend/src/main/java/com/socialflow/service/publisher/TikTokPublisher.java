package com.socialflow.service.publisher;

/**
 * TikTok publishing has been REMOVED from SocialFlow.
 *
 * This file is kept as a placeholder to avoid orphaned imports.
 * TikTok is no longer a supported platform (removed as of platform migration).
 *
 * DO NOT re-add this as a Spring @Component or reference it from the factory.
 * The Platform enum no longer contains TIKTOK.
 *
 * @deprecated Removed. Use LinkedInPublisher, XPublisher, or YouTubePublisher instead.
 */
@Deprecated(since = "2026", forRemoval = true)
public final class TikTokPublisher {
    // This class is intentionally empty. TikTok has been removed.
    private TikTokPublisher() {}
}
