package com.ncode.smarttask.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * PredictionResponse.java
 * =======================
 * Full AI prediction response returned by Spring Boot to the React frontend.
 *
 * Enriched with employee identity fields (employeeId, employeeName,
 * currentProductivity) compared to the raw Python FastAPI response — Spring Boot
 * adds these after deserializing the Python payload.
 *
 * Field mapping:
 *   Python FastAPI → Spring Boot (via ObjectMapper)
 *   Spring Boot adds employeeId, employeeName, currentProductivity before returning
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionResponse {

    // ── Employee identity (added by Spring Boot, not from Python) ──────────
    /** The employee this prediction belongs to */
    private Long   employeeId;

    /** Full name of the employee */
    private String employeeName;

    /** Current month's actual productivity score (from ProductivityService) */
    private Double currentProductivity;

    // ── Prediction output (from Python RandomForestRegressor) ──────────────
    /** Predicted next-month productivity score (40.0–100.0) */
    private Double predictedProductivity;

    /** Model confidence estimate (30.0–98.0%) based on RandomForest tree variance */
    private Double confidence;

    /** Outstanding / Excellent / Good / Needs Improvement / Low Productivity */
    private String performanceLabel;

    /** predicted − current (positive = improving, negative = declining) */
    private Double trendDelta;

    /** "IMPROVING" | "STABLE" | "DECLINING" | "UNKNOWN" */
    private String trend;

    /** One-line human-readable summary of the prediction */
    private String summary;

    /** Top 2–4 positive driving factors */
    private List<String> reasons;

    /** 0–3 risk signals detected */
    private List<String> warnings;

    /** Single most impactful actionable recommendation */
    private String suggestion;

    /**
     * true  = RandomForestRegressor used (model.pkl loaded)
     * false = Rule-based fallback (AI service offline or model not trained)
     * Frontend shows "Estimate" badge when false.
     */
    private Boolean modelAvailable;
}