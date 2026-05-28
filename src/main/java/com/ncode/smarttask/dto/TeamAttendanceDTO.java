package com.ncode.smarttask.dto;

import lombok.*;

import java.util.List;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TeamAttendanceDTO {
    private String date;

    // Today's board
    private long presentToday;
    private long lateToday;
    private long absentToday;
    private long totalEmployees;
    private double attendanceRateToday;

    // Per-employee today
    private List<AttendanceRecordDTO> todayRecords;

    // Monthly aggregates per employee
    private List<AttendanceSummaryDTO> monthlySummaries;
}