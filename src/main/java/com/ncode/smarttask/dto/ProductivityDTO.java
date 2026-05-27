package com.ncode.smarttask.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductivityDTO {

    private Long   employeeId;
    private String employeeName;
    private String department;
    private String month;
    private int    year;

    // Raw metrics
    private double hoursWorked;
    private double expectedHours;
    private int    totalTasksAssigned;
    private int    totalTasksCompleted;
    private double avgTaskProgress;
    private double onTimeCompletionRate;

    // Component scores (0-100)
    private double hoursScore;
    private double taskCompletionScore;
    private double avgProgressScore;
    private double deadlineDisciplineScore;

    // Final weighted score (0-100)
    private double productivityScore;

    // Label: Outstanding / Excellent / Good / Needs Improvement / Low Productivity
    private String performanceStatus;

    // Month-over-month delta (null if no previous month data)
    private Double trendDelta;
}