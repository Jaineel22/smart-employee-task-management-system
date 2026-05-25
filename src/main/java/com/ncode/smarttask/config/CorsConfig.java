package com.ncode.smarttask.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Allowed origins — React dev servers (Vite and CRA)
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",   // Create React App
                "http://localhost:5173"    // Vite (React)
        ));

        // Allowed HTTP methods — covers all REST operations used in the project
        config.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        // Allowed headers — Authorization is required for JWT to work from React
        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept"
        ));

        // Allow React to read the Authorization header in responses
        config.setExposedHeaders(List.of("Authorization"));

        // Required for sending JWT token with credentials
        config.setAllowCredentials(true);

        // Cache preflight OPTIONS request result for 1 hour
        // Reduces OPTIONS round-trips from React before every real request
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        // Apply CORS config to all API routes
        source.registerCorsConfiguration("/api/**", config);

        return new CorsFilter(source);
    }
}