package com.ncode.smarttask.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionRequest {
    private Double attendancePercentage;
    private Double totalHoursWorked;
    private Double completedTasks;
    private Double pendingTasks;
    private Double averageTaskProgress;
    private Double lateTaskCount;
    private Double reportsSubmitted;
    private Double deadlineDisciplineScore;
    private Double attendanceConsistency;
    private Double monthlyProductivityScore;
    private Double overdueTasks;
    private Double avgTaskCompletionTime;
}