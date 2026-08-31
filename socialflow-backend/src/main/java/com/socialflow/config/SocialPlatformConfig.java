package com.socialflow.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class SocialPlatformConfig {

    /**
     * Shared RestClient bean used for all external API calls (HuggingFace, platform APIs).
     */
    @Bean
    public RestClient restClient() {
        return RestClient.builder().build();
    }

    @Configuration
    @ConfigurationProperties(prefix = "meta")
    @Getter
    @Setter
    public static class MetaConfig {
        private String appId;
        private String appSecret;
        private String redirectUri;
    }

    @Configuration
    @ConfigurationProperties(prefix = "x")
    @Getter
    @Setter
    public static class XConfig {
        private String clientId;
        private String clientSecret;
        private String redirectUri;
    }

    @Configuration
    @ConfigurationProperties(prefix = "tiktok")
    @Getter
    @Setter
    public static class TikTokConfig {
        private String clientKey;
        private String clientSecret;
        private String redirectUri;
    }

    @Configuration
    @ConfigurationProperties(prefix = "google")
    @Getter
    @Setter
    public static class GoogleConfig {
        private String clientId;
        private String clientSecret;
        private String redirectUri;
    }
}
