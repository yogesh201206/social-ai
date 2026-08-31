package com.socialflow.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "huggingface")
@Getter
@Setter
public class HuggingFaceConfig {

    private Api api = new Api();
    private String model = "openai/gpt-oss-120b:preferred";

    @Getter
    @Setter
    public static class Api {
        private String token;
        private String baseUrl = "https://router.huggingface.co/v1";
    }
}
