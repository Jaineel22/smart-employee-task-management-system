package com.ncode.smarttask.dto;

import lombok.*;

/**
 * PauseTaskRequest — request payload for pausing a task.
 * Sent to POST /api/tasks/{taskId}/pause endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PauseTaskRequest {

    /**
     * ID of the employee pausing the task.
     * Used for authorization and tracking.
     */
    private Long employeeId;

    /**
     * Mandatory reason for pausing the task.
     * Examples:
     *   - "Urgent production bug P0-123 assigned by manager"
     *   - "Blocked by API dependency from backend team"
     *   - "Higher priority task assigned"
     */
    private String pauseReason;
}