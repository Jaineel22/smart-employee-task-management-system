package com.ncode.smarttask.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UpdateDailyWorkReportRequest {
    private String workDescription;
    private BigDecimal hoursWorked;
    private Integer completionPercentage;
}