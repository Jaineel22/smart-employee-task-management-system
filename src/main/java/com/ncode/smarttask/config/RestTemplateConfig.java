package com.ncode.smarttask.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

/**
 * RestTemplate configuration with timeout settings.
 * Ensures AI service calls don't block the main application.
 *
 * Placement: src/main/java/com/hrms/config/RestTemplateConfig.java
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);   // 5 seconds to connect
        factory.setReadTimeout(15_000);     // 15 seconds to read response
        return new RestTemplate(factory);
    }
}