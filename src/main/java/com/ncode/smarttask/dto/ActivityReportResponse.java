package com.ncode.smarttask.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * ActivityReportResponse — enriched view returned to manager dashboard.
 * Flattens the DailyWorkReport entity + auto-generated AI insights.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityReportResponse {

    // ── Identity ──────────────────────────────────────────────────────────────
    private Long reportId;
    private Long employeeId;
    private String employeeName;
    private String department;

    // ── Task context ──────────────────────────────────────────────────────────
    private Long taskId;
    private String taskTitle;
    private String taskWorkedOn;

    // ── Work details ──────────────────────────────────────────────────────────
    private String detailedWorkSummary;
    private String technologiesUsed;
    private String completedActivities;
    private String pendingActivities;
    private String tomorrowPlan;
    private String blockers;
    private Boolean hasBlockers;

    // ── Metrics ───────────────────────────────────────────────────────────────
    private Double hoursWorked;
    private Integer completionPercentage;
    private Integer progressPercentage;
    private LocalDate reportDate;
    private LocalDateTime createdAt;

    // ── AI-generated insights (computed in service, not stored) ───────────────
    private List<String> aiInsights;

    /**
     * Parsed technology tags from the comma-separated technologiesUsed string.
     * E.g. ["HTML5", "CSS3", "Bootstrap"]
     */
    private List<String> technologyTags;
}