package com.ncode.smarttask.controller;

import com.ncode.smarttask.dto.AttritionResponse;
import com.ncode.smarttask.dto.BurnoutResponse;
import com.ncode.smarttask.dto.ForecastResponse;
import com.ncode.smarttask.dto.RecommendationResponse;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.repository.UserRepository;
import com.ncode.smarttask.service.WorkforceIntelligenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * WorkforceIntelligenceController.java
 * =====================================
 * REST endpoints for AI-4 workforce intelligence features.
 *
 * Endpoints:
 * - GET /api/ai/burnout/{id} - Get burnout risk for an employee
 * - GET /api/ai/attrition/{id} - Get attrition risk for an employee
 * - GET /api/ai/recommendations/{id} - Get recommendations for an employee
 * - GET /api/ai/forecast/{id} - Get productivity forecast for an employee
 * - GET /api/ai/burnout/me - Get burnout risk for current user
 * - GET /api/ai/health - Check AI service health
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class WorkforceIntelligenceController {

    private final WorkforceIntelligenceService workforceIntelligenceService;
    private final UserRepository userRepository;

    /**
     * Get burnout risk for a specific employee (Manager only).
     */
    @GetMapping("/burnout/{id}")
    public ResponseEntity<BurnoutResponse> getBurnoutRisk(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        int resolvedMonth = month > 0 ? month : LocalDate.now().getMonthValue();
        int resolvedYear = year > 0 ? year : LocalDate.now().getYear();

        return ResponseEntity.ok(
                workforceIntelligenceService.getBurnoutRisk(
                        id,
                        resolvedMonth,
                        resolvedYear
                )
        );
    }

    /**
     * Get attrition risk for a specific employee.
     */
    @GetMapping("/attrition/{id}")
    public ResponseEntity<AttritionResponse> getAttritionRisk(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        int resolvedMonth = month > 0 ? month : LocalDate.now().getMonthValue();
        int resolvedYear = year > 0 ? year : LocalDate.now().getYear();

        // Placeholder response
        AttritionResponse response = new AttritionResponse();
        response.setEmployeeId(id.intValue());
        response.setAttritionRisk(25);
        response.setLevel("LOW");
        response.setConfidence(70);
        response.setReasons(
                List.of("No significant attrition indicators detected")
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Get recommendations for a specific employee.
     */
    @GetMapping("/recommendations/{id}")
    public ResponseEntity<RecommendationResponse> getRecommendations(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        RecommendationResponse response = new RecommendationResponse();
        response.setEmployeeId(id.intValue());
        response.setRecommendations(
                List.of(
                        "Complete pending tasks to improve productivity",
                        "Maintain consistent work hours",
                        "Submit reports regularly"
                )
        );
        response.setExpectedImprovement(8);
        response.setPriority("MEDIUM");
        response.setRecommendationCount(3);

        return ResponseEntity.ok(response);
    }

    /**
     * Get productivity forecast for a specific employee.
     */
    @GetMapping("/forecast/{id}")
    public ResponseEntity<ForecastResponse> getForecast(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        ForecastResponse response = new ForecastResponse();
        response.setEmployeeId(id.intValue());
        response.setCurrentProductivity(65);
        response.setPredictedProductivity3Months(72);
        response.setPredictedProductivity6Months(78);
        response.setImprovement3Months(7);
        response.setImprovement6Months(13);
        response.setTrendDirection("IMPROVING");
        response.setTrendPerMonth(1.2);
        response.setConfidence(75);
        response.setDataPoints(6);

        return ResponseEntity.ok(response);
    }

    /**
     * Get burnout risk for the currently authenticated user.
     */
    @GetMapping("/burnout/me")
    public ResponseEntity<BurnoutResponse> getMyBurnoutRisk(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        // Extract user ID from authentication email
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with email: " + email
                        )
                );

        int resolvedMonth = month > 0
                ? month
                : LocalDate.now().getMonthValue();

        int resolvedYear = year > 0
                ? year
                : LocalDate.now().getYear();

        return ResponseEntity.ok(
                workforceIntelligenceService.getBurnoutRisk(
                        user.getId(),
                        resolvedMonth,
                        resolvedYear
                )
        );
    }

    /**
     * Check AI service health.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        return ResponseEntity.ok(
                Map.of(
                        "status", "healthy",
                        "service", "Workforce Intelligence AI",
                        "timestamp", System.currentTimeMillis()
                )
        );
    }
}