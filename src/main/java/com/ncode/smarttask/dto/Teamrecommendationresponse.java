package com.ncode.smarttask.dto;

import lombok.*;
import java.util.List;

/**
 * AI-5: Team-level recommendation payload for manager view.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Teamrecommendationresponse {

    private Integer month;
    private Integer year;

    /** Team-level aggregate metrics */
    private Double  teamAvgProductivity;
    private Double  teamAvgAttendance;
    private Double  teamAvgUtilization;
    private Integer totalPendingTasks;
    private Integer totalOverdueTasks;
    private Integer totalEmployees;

    /** Team-wide recommendations (workload, redistribution, risk alerts) */
    private List<RecommendationResponse> teamRecommendations;

    /** Per-employee summary — sorted by productivity ascending (worst first) */
    private List<EmployeeRecommendationResponse> employeeBreakdown;

    /** Employees with HIGH-priority recommendations */
    private List<String> atRiskEmployeeNames;
}