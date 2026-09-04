package com.socialflow.service.publisher;

import com.socialflow.entity.Platform;
import com.socialflow.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Factory that returns the correct SocialMediaPublisher for a given platform.
 *
 * ACTIVE platforms (real publishing):
 *   TWITTER  → XPublisher
 *   YOUTUBE  → YouTubePublisher
 *   LINKEDIN → LinkedInPublisher
 *
 * COMING SOON (publishing disabled with informative error):
 *   INSTAGRAM → throws BadRequestException with COMING_SOON message
 *   FACEBOOK  → throws BadRequestException with COMING_SOON message
 *
 * REMOVED:
 *   TIKTOK — no longer exists in Platform enum
 */
@Component
@RequiredArgsConstructor
public class SocialMediaPublisherFactory {

    private final InstagramPublisher instagramPublisher;
    private final FacebookPublisher facebookPublisher;
    private final XPublisher xPublisher;
    private final YouTubePublisher youTubePublisher;
    private final LinkedInPublisher linkedInPublisher;

    /**
     * Returns the publisher for the given platform.
     *
     * @throws BadRequestException for INSTAGRAM and FACEBOOK (Coming Soon)
     */
    public SocialMediaPublisher getPublisher(Platform platform) {
        return switch (platform) {
            case TWITTER  -> xPublisher;
            case YOUTUBE  -> youTubePublisher;
            case LINKEDIN -> linkedInPublisher;
            case FACEBOOK -> facebookPublisher;
            case INSTAGRAM -> throw new BadRequestException(
                    "Instagram integration is coming soon. Social account publishing has not been enabled yet. " +
                    "Please check back after Meta Business verification is complete.");
        };
    }
}
