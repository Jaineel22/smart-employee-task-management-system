package com.ncode.smarttask.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DailyWorkReport — enhanced with Activity Intelligence fields.
 *
 * All existing fields are preserved exactly.
 * 8 new fields added as nullable columns — backward compatible.
 * Existing data rows will have NULL for all new columns (safe).
 */
@Entity
@Table(name = "daily_work_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyWorkReport {

    // ── EXISTING FIELDS (unchanged) ───────────────────────────────────────────

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Legacy free-text description — kept for backward compat */
    @Column(columnDefinition = "TEXT")
    private String workDescription;

    private Double hoursWorked;

    private Integer completionPercentage;

    private LocalDate reportDate;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    // ── NEW: Activity Intelligence Fields ────────────────────────────────────

    /**
     * The task name/title the employee worked on.
     * Maps to column: task_worked_on
     */
    @Column(name = "task_worked_on", length = 500)
    private String taskWorkedOn;

    /**
     * Rich text description of all work done today.
     * Maps to column: detailed_work_summary
     */
    @Column(name = "detailed_work_summary", columnDefinition = "TEXT")
    private String detailedWorkSummary;

    /**
     * Comma-separated list of technologies used (e.g. "HTML5, CSS3, Bootstrap").
     * Maps to column: technologies_used
     */
    @Column(name = "technologies_used", length = 500)
    private String technologiesUsed;

    /**
     * Bullet-point list of activities completed today.
     * Maps to column: completed_activities
     */
    @Column(name = "completed_activities", columnDefinition = "TEXT")
    private String completedActivities;

    /**
     * Activities still pending / not yet done.
     * Maps to column: pending_activities
     */
    @Column(name = "pending_activities", columnDefinition = "TEXT")
    private String pendingActivities;

    /**
     * What the employee plans to do tomorrow.
     * Maps to column: tomorrow_plan
     */
    @Column(name = "tomorrow_plan", columnDefinition = "TEXT")
    private String tomorrowPlan;

    /**
     * Any blockers or impediments faced today.
     * NOTE: also exists as a legacy substring inside workDescription —
     * this dedicated column supersedes that pattern for new reports.
     * Maps to column: blockers
     */
    @Column(name = "blockers", length = 1000)
    private String blockers;

    /**
     * Self-reported progress percentage for this specific work session (0–100).
     * Distinct from Task.completionPercentage (overall task progress).
     * Maps to column: progress_percentage
     */
    @Builder.Default
    @Column(name = "progress_percentage")
    private Integer progressPercentage = 0;
}