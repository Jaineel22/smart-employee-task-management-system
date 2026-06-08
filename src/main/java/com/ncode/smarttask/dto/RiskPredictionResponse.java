package com.ncode.smarttask.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * AI-6: Deadline risk prediction for a single task.
 * Shared schema for both rule-engine (now) and ML model (future).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskPredictionResponse {

    private Long   taskId;
    private String taskTitle;
    private String taskStatus;
    private String priority;

    /** 0–100 composite risk score */
    private Integer riskScore;

    /**
     * LOW (0–30) | MEDIUM (31–60) | HIGH (61–80) | CRITICAL (81–100)
     */
    private String riskLevel;

    /** 0–100 — engine confidence */
    private Integer confidence;

    /** Days remaining until deadline (negative = already overdue) */
    private Long daysRemaining;

    /** Current task completion % */
    private Integer completionPercentage;

    /** Human-readable risk drivers */
    private List<String> reasons;

    /** Actionable steps to reduce risk */
    private List<String> recommendations;

    /** Component scores that fed into riskScore — for transparency */
    private RiskFactorBreakdown factorBreakdown;

    /** Whether ML model was used (false = rule engine) */
    private Boolean mlModelUsed;

    private LocalDateTime generatedAt;

    // ── Nested breakdown ────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskFactorBreakdown {
        private Integer deadlineProximityScore; // 30% weight
        private Integer progressScore;          // 25% weight
        private Integer productivityScore;      // 15% weight
        private Integer utilizationScore;       // 10% weight
        private Integer attendanceScore;        // 10% weight
        private Integer historicalScore;        // 10% weight
    }
}