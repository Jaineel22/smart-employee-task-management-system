package com.ncode.smarttask.dto;

import com.ncode.smarttask.enums.AttendanceStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AttendanceRecordDTO {
    private Long            id;
    private Long            userId;
    private String          employeeName;
    private String          department;
    private LocalDate       date;
    private LocalDateTime   clockInTime;
    private LocalDateTime   clockOutTime;
    private Double          totalHoursWorked;
    private AttendanceStatus attendanceStatus;
    private String          remarks;
    // Is the employee currently clocked in (no clock-out yet)?
    private boolean         currentlyActive;
}