package com.socialflow.service.publisher;

import com.socialflow.entity.Platform;
import com.socialflow.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Factory that returns the correct SocialMediaPublisher for a given platform.
 * Separates routing logic from individual publisher implementations.
 */
@Component
@RequiredArgsConstructor
public class SocialMediaPublisherFactory {

    private final InstagramPublisher instagramPublisher;
    private final FacebookPublisher facebookPublisher;
    private final XPublisher xPublisher;
    private final TikTokPublisher tikTokPublisher;
    private final YouTubePublisher youTubePublisher;

    public SocialMediaPublisher getPublisher(Platform platform) {
        return switch (platform) {
            case INSTAGRAM -> instagramPublisher;
            case FACEBOOK -> facebookPublisher;
            case TWITTER -> xPublisher;
            case TIKTOK -> tikTokPublisher;
            case YOUTUBE -> youTubePublisher;
        };
    }
}
