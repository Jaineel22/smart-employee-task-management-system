package com.ncode.smarttask.dto;

import lombok.*;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * CreateDailyWorkReportRequest — enhanced with Activity Intelligence fields.
 *
 * Existing fields kept exactly. New fields are all optional (nullable)
 * so existing frontend code that only sends the old fields still works.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDailyWorkReportRequest {

    // ── EXISTING fields (unchanged) ───────────────────────────────────────────

    /** Legacy free-text description (kept for backward compat) */
    @NotBlank(message = "Work description is required")
    private String workDescription;

    @NotNull(message = "Hours worked is required")
    private Double hoursWorked;

    private Integer completionPercentage;

    @NotNull(message = "Report date is required")
    private LocalDate reportDate;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Task ID is required")
    private Long taskId;

    // ── NEW: Activity Intelligence fields (all optional) ─────────────────────

    /** Task name/title the employee worked on today */
    private String taskWorkedOn;

    /**
     * Rich detailed description of today's work.
     * Supersedes workDescription for new reports.
     */
    private String detailedWorkSummary;

    /** Comma-separated: "HTML5, CSS3, Bootstrap, React" */
    private String technologiesUsed;

    /** What was finished today */
    private String completedActivities;

    /** What is still in progress / not done */
    private String pendingActivities;

    /** Plan for the next working day */
    private String tomorrowPlan;

    /**
     * Any blockers or impediments.
     * New dedicated field — old code concatenated this into workDescription;
     * new form sends it here separately.
     */
    private String blockers;

    /**
     * Self-reported session progress % (0–100).
     * How much progress was made in THIS session specifically.
     */
    private Integer progressPercentage;
}