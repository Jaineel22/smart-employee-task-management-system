package com.ncode.smarttask.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * AI-5: Single recommendation item.
 * Returned by /api/recommendations/* endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {

    private Integer employeeId;
    
    /**
     * The recommendation text shown to the user.
     * Example: "Your attendance dropped 12% — aim for 80%+ this month."
     */
    private String message;

    /**
     * FOCUS | TIME_MANAGEMENT | ATTENDANCE | WORKLOAD_BALANCING |
     * TASK_PRIORITIZATION | DEADLINE_MANAGEMENT |
     * PRODUCTIVITY_IMPROVEMENT | SKILL_IMPROVEMENT | CONSISTENCY
     */
    private String category;

    /** HIGH | MEDIUM | LOW */
    private String priority;

    /** 0–100 — expected impact if employee acts on this */
    private Integer impactScore;

    /** 0–100 — engine confidence */
    private Integer confidence;

    private LocalDateTime generatedAt;
    
    // Additional fields for the controller
    private List<String> recommendations;
    private Integer expectedImprovement;
    private Integer recommendationCount;
}