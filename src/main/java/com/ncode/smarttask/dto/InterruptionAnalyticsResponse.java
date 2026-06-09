package com.ncode.smarttask.dto;

import lombok.*;
import java.util.List;

/**
 * InterruptionAnalyticsResponse — analytics DTO for task interruptions.
 * Returned by GET /api/interruptions/analytics endpoint for managers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterruptionAnalyticsResponse {

    // ── Aggregated metrics ────────────────────────────────────────────────────
    
    /**
     * Total number of interruption records (all time or filtered period)
     */
    private Integer totalInterruptions;
    
    /**
     * Number of tasks currently in paused state (resumedAt is null)
     */
    private Integer currentlyPausedCount;
    
    /**
     * Total hours spent in paused state across all tasks
     */
    private Integer totalPausedHours;
    
    /**
     * Average pause duration in hours per interruption
     */
    private Double avgPauseDurationHours;
    
    // ── Top offenders / insights ───────────────────────────────────────────────
    
    /**
     * Name of the employee with the most interruptions
     */
    private String mostInterruptedEmployee;
    
    /**
     * Name of the project with the most interrupted tasks
     */
    private String mostInterruptedProject;
    
    /**
     * Average number of interruptions per employee
     */
    private Double avgInterruptionsPerEmployee;
    
    // ── Lists for detailed view ───────────────────────────────────────────────
    
    /**
     * List of tasks currently paused (for manager to take action)
     */
    private List<TaskInterruptionResponse> currentlyPausedTasks;
    
    /**
     * List of recent interruptions (last 7 days by default)
     */
    private List<TaskInterruptionResponse> recentInterruptions;
}