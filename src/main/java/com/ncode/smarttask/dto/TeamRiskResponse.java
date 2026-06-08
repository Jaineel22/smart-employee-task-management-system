package com.ncode.smarttask.dto;

import lombok.*;
import java.util.List;

/**
 * AI-6: Team-wide risk summary for manager dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamRiskResponse {

    private Integer month;
    private Integer year;
    private Integer totalEmployees;
    private Integer totalActiveTasks;

    private Integer criticalTaskCount;
    private Integer highRiskTaskCount;
    private Integer mediumRiskTaskCount;
    private Integer lowRiskTaskCount;

    /** Average risk score across all active tasks in the team */
    private Integer teamAvgRiskScore;

    /** Overall risk label for the team */
    private String teamRiskLevel;

    /** Per-employee risk summaries — sorted by avgRiskScore DESC */
    private List<EmployeeRiskResponse> employeeRisks;

    /** Top CRITICAL tasks across all employees */
    private List<RiskPredictionResponse> criticalTasks;
}