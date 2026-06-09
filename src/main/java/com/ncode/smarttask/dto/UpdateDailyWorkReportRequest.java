package com.ncode.smarttask.dto;

import lombok.*;

/**
 * UpdateDailyWorkReportRequest — extended with Activity Intelligence fields.
 * All fields nullable — only non-null fields are applied (PATCH semantics).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDailyWorkReportRequest {

    // ── EXISTING (unchanged) ──────────────────────────────────────────────────
    private String workDescription;
    private Double hoursWorked;
    private Integer completionPercentage;

    // ── NEW (all optional) ────────────────────────────────────────────────────
    private String taskWorkedOn;
    private String detailedWorkSummary;
    private String technologiesUsed;
    private String completedActivities;
    private String pendingActivities;
    private String tomorrowPlan;
    private String blockers;
    private Integer progressPercentage;
}