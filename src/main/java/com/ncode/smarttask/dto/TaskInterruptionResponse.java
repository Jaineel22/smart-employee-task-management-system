package com.ncode.smarttask.dto;

import lombok.*;
import java.time.LocalDateTime;

/**
 * TaskInterruptionResponse — response DTO for task interruption records.
 * Returned by GET /api/tasks/{taskId}/interruptions and related endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskInterruptionResponse {

    // ── Identity ──────────────────────────────────────────────────────────────
    private Long id;
    private Long taskId;
    private String taskTitle;
    private Long employeeId;
    private String employeeName;

    // ── Timeline ──────────────────────────────────────────────────────────────
    private LocalDateTime pausedAt;
    private LocalDateTime resumedAt;

    // ── User input ────────────────────────────────────────────────────────────
    private String pauseReason;
    private String resumeNote;

    // ── Calculated fields ─────────────────────────────────────────────────────
    private Integer interruptionDurationHours;
    private String delayJustification;

    // ── Derived status ────────────────────────────────────────────────────────
    /**
     * True when resumedAt is null — task is currently paused.
     */
    private Boolean currentlyPaused;

    // ── Metadata ──────────────────────────────────────────────────────────────
    private LocalDateTime createdAt;
}