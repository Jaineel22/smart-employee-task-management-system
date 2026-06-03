package com.ncode.smarttask.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionRequest {
    
    @JsonProperty("employee_id")
    private Integer employeeId;
    
    @JsonProperty("month")
    private Integer month;
    
    @JsonProperty("year")
    private Integer year;
    
    @JsonProperty("total_tasks_assigned")
    private Integer totalTasksAssigned;
    
    @JsonProperty("total_tasks_completed")
    private Integer totalTasksCompleted;
    
    @JsonProperty("avg_completion_percentage")
    private Double avgCompletionPercentage;
    
    @JsonProperty("on_time_completion_rate")
    private Double onTimeCompletionRate;
    
    @JsonProperty("total_hours_worked")
    private Double totalHoursWorked;
    
    @JsonProperty("expected_hours")
    private Double expectedHours;
    
    @JsonProperty("avg_task_progress")
    private Double avgTaskProgress;
}