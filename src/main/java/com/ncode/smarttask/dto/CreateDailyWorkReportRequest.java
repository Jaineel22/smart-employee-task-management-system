package com.ncode.smarttask.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class CreateDailyWorkReportRequest {
    private String workDescription;
    private BigDecimal hoursWorked;
    private Integer completionPercentage;
    private LocalDate reportDate;
    private Long userId;
    private Long taskId;
}