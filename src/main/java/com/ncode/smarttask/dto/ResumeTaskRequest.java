package com.ncode.smarttask.dto;

import lombok.*;

/**
 * ResumeTaskRequest — request payload for resuming a paused task.
 * Sent to POST /api/tasks/{taskId}/resume endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeTaskRequest {

    /**
     * ID of the employee resuming the task.
     * Used for authorization and tracking.
     */
    private Long employeeId;

    /**
     * Optional note about what was done or changed during the pause.
     * Examples:
     *   - "Hotfix deployed to production"
     *   - "API dependency resolved by backend team"
     *   - "Higher priority task completed"
     */
    private String resumeNote;

    /**
     * Employee-provided justification when task misses deadline due to this interruption.
     * Used by productivity engine to avoid unfair penalty.
     * Examples:
     *   - "Task paused for 2 days due to P0 hotfix"
     *   - "Blocked by external API integration"
     */
    private String delayJustification;
}