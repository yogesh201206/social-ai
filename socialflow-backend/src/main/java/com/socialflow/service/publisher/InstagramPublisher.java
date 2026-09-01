package com.socialflow.service.publisher;

import com.socialflow.entity.Post;
import com.socialflow.entity.SocialAccount;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Instagram publisher — COMING SOON.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InstagramPublisher implements SocialMediaPublisher {

    private final RestClient restClient;

    @Override
    public PublishResult publish(Post post, SocialAccount account) {
        return PublishResult.failure(
                "Instagram integration is coming soon. Social account publishing has not been enabled yet. " +
                "Please check back after Meta Business verification is complete.");
    }

    @Override
    public DeleteResult delete(Post post, SocialAccount account) {
        return DeleteResult.failure("Instagram integration is coming soon.");
    }

    @Override
    public MetricsResult fetchMetrics(Post post, SocialAccount account) {
        return MetricsResult.notSupported("Instagram integration is coming soon.");
    }
}
