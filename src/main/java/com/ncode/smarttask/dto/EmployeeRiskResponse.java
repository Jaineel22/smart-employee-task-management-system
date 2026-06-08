package com.ncode.smarttask.dto;

import lombok.*;
import java.util.List;

/**
 * AI-6: Risk summary for all tasks belonging to one employee.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeRiskResponse {

    private Long   employeeId;
    private String employeeName;
    private String department;

    /** Overall highest risk level across all tasks */
    private String overallRiskLevel;

    /** Average risk score across all active tasks */
    private Integer avgRiskScore;

    private Integer criticalTaskCount;
    private Integer highRiskTaskCount;
    private Integer mediumRiskTaskCount;
    private Integer lowRiskTaskCount;

    /** Full risk detail per task — sorted by riskScore DESC */
    private List<RiskPredictionResponse> taskRisks;
}