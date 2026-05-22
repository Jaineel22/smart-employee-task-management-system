package com.ncode.smarttask.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Getter
@Setter
public class CreateDailyWorkReportRequest {
    @NotBlank(message = "Work description is required")
    private String workDescription;
    @NotNull(message = "Hours worked is required")
    private BigDecimal hoursWorked;
    private Integer completionPercentage;
    @NotNull(message = "Report date is required")
    private LocalDate reportDate;
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @NotNull(message = "Task ID is required")
    private Long taskId;
}