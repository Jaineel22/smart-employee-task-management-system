package com.ncode.smarttask.dto;

import lombok.*;
import java.util.List;

/**
 * AI-5: Full recommendation payload for one employee.
 * Wraps a prioritised list of RecommendationResponse items
 * plus the employee context used to generate them.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeRecommendationResponse {

    private Long   employeeId;
    private String employeeName;
    private String department;

    /** Snapshot metrics used to generate recommendations */
    private Double productivityScore;
    private Double attendancePct;
    private Double utilizationPct;
    private Integer pendingTasks;
    private Integer overdueTasks;

    /** Ordered HIGH → MEDIUM → LOW */
    private List<RecommendationResponse> recommendations;

    /** Total count for quick display */
    private Integer totalRecommendations;

    /** Highest priority level present: HIGH | MEDIUM | LOW */
    private String overallPriority;
}