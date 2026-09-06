package com.socialflow.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Configuration beans for all social media OAuth credentials.
 *
 * ACTIVE (real OAuth + publishing):
 *   X (Twitter)  — prefix: x
 *   Google/YouTube — prefix: google
 *   LinkedIn       — prefix: linkedin
 *
 * COMING SOON (architecture ready, credentials optional until enabled):
 *   Meta (Instagram + Facebook) — prefix: meta
 *
 * REMOVED:
 *   TikTok — no longer supported
 *
 * Set values via environment variables — NEVER commit real secrets.
 */
@Configuration
public class SocialPlatformConfig {

    /**
     * Shared RestClient bean used for all external API calls with sensible connect/read timeouts.
     */
    @Bean
    public RestClient restClient() {
        org.springframework.http.client.SimpleClientHttpRequestFactory requestFactory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(java.time.Duration.ofSeconds(10));
        requestFactory.setReadTimeout(java.time.Duration.ofSeconds(30));
        return RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    /**
     * Meta / Facebook Pages — Active.
     * Set META_APP_ID, META_APP_SECRET, and META_REDIRECT_URI environment variables.
     */
    @Configuration
    @ConfigurationProperties(prefix = "meta")
    @Getter
    @Setter
    public static class MetaConfig {
        private String appId;
        private String appSecret;
        private String redirectUri;
    }

    /**
     * Instagram (Business Login) — Active.
     * Set INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, and INSTAGRAM_REDIRECT_URI environment variables.
     */
    @Configuration
    @ConfigurationProperties(prefix = "instagram")
    @Getter
    @Setter
    public static class InstagramConfig {
        private String clientId;
        private String clientSecret;
        private String redirectUri;
    }

    /**
     * X (Twitter) — Active.
     * Set X_CLIENT_ID and X_CLIENT_SECRET environment variables.
     */
    @Configuration
    @ConfigurationProperties(prefix = "x")
    @Getter
    @Setter
    public static class XConfig {
        private String clientId;
        private String clientSecret;
        private String redirectUri;
    }

    /**
     * Google (YouTube) — Active.
     * Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.
     */
    @Configuration
    @ConfigurationProperties(prefix = "google")
    @Getter
    @Setter
    public static class GoogleConfig {
        private String clientId;
        private String clientSecret;
        private String redirectUri;
    }

    /**
     * LinkedIn — Active.
     * Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET environment variables.
     * Register app at https://www.linkedin.com/developers/apps
     * Required product: "Share on LinkedIn"
     * Required scopes: openid, profile, w_member_social
     */
    @Configuration
    @ConfigurationProperties(prefix = "linkedin")
    @Getter
    @Setter
    public static class LinkedInConfig {
        private String clientId;
        private String clientSecret;
        private String redirectUri;
    }
}
