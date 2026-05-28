package com.ncode.smarttask.dto;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AttendanceSummaryDTO {
    private Long   userId;
    private String employeeName;
    private String month;
    private int    year;

    // Counts
    private int    totalWorkingDays;   // days in month (Mon–Fri)
    private int    presentDays;
    private int    lateDays;
    private int    absentDays;
    private int    halfDays;

    // Rates (0–100)
    private double attendanceRate;     // present / working days * 100
    private double consistencyScore;   // (present + late) / working days * 100

    // Hours
    private double totalHoursWorked;
    private double averageHoursPerDay;
    private double expectedHours;      // working days * 8

    // Today's status
    private String  todayStatus;       // "CLOCKED_IN", "CLOCKED_OUT", "NOT_MARKED"
    private String  clockInTime;
    private String  workingHoursToday; // e.g. "6h 42m"
}