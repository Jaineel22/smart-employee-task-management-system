package com.ncode.smarttask.service;

import com.ncode.smarttask.dto.*;
import com.ncode.smarttask.entity.Attendance;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.enums.AttendanceStatus;
import com.ncode.smarttask.enums.Role;
import com.ncode.smarttask.repository.AttendanceRepository;
import com.ncode.smarttask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository       userRepository;

    // Clock-in cutoff: before 10:00 AM = PRESENT, after = LATE
    private static final LocalTime LATE_THRESHOLD    = LocalTime.of(10, 0);
    private static final int       WORKING_DAYS_WEEK = 5;

    /* ── CLOCK IN ─────────────────────────────────────────── */
    public AttendanceRecordDTO clockIn(Long userId, String remarks) {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        // Guard: already clocked in today?
        Optional<Attendance> existing = attendanceRepository.findByUserIdAndDate(userId, today);
        if (existing.isPresent()) {
            Attendance record = existing.get();
            if (record.getClockInTime() != null) {
                throw new RuntimeException(
                    "Already clocked in for today at "
                    + record.getClockInTime().toLocalTime()
                              .format(DateTimeFormatter.ofPattern("hh:mm a"))
                );
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // Determine status from clock-in time
        AttendanceStatus status = now.toLocalTime().isBefore(LATE_THRESHOLD)
                ? AttendanceStatus.PRESENT
                : AttendanceStatus.LATE;

        Attendance attendance = Attendance.builder()
                .user(user)
                .date(today)
                .clockInTime(now)
                .attendanceStatus(status)
                .remarks(remarks)
                .build();

        Attendance saved = attendanceRepository.save(attendance);
        return toRecordDTO(saved, true);
    }

    /* ── CLOCK OUT ────────────────────────────────────────── */
    public AttendanceRecordDTO clockOut(Long userId, String remarks) {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        Attendance attendance = attendanceRepository.findByUserIdAndDate(userId, today)
                .orElseThrow(() -> new RuntimeException(
                    "You have not clocked in today. Please clock in first."));

        if (attendance.getClockInTime() == null) {
            throw new RuntimeException("No clock-in record found for today.");
        }

        if (attendance.getClockOutTime() != null) {
            throw new RuntimeException(
                "Already clocked out at "
                + attendance.getClockOutTime().toLocalTime()
                            .format(DateTimeFormatter.ofPattern("hh:mm a"))
            );
        }

        // Calculate total hours worked
        Duration worked = Duration.between(attendance.getClockInTime(), now);
        double hours = worked.toMinutes() / 60.0;
        hours = Math.round(hours * 100.0) / 100.0;

        // Re-classify to HALF_DAY if worked < 4 hours
        AttendanceStatus status = attendance.getAttendanceStatus();
        if (hours < 4.0) {
            status = AttendanceStatus.HALF_DAY;
        }

        attendance.setClockOutTime(now);
        attendance.setTotalHoursWorked(hours);
        attendance.setAttendanceStatus(status);
        if (remarks != null && !remarks.isBlank()) {
            attendance.setRemarks(remarks);
        }

        Attendance saved = attendanceRepository.save(attendance);
        return toRecordDTO(saved, false);
    }

    /* ── MY HISTORY (Employee) ────────────────────────────── */
    public List<AttendanceRecordDTO> getMyHistory(Long userId) {
        return attendanceRepository.findByUserIdOrderByDateDesc(userId)
                .stream()
                .map(a -> toRecordDTO(a, a.getClockOutTime() == null && a.getClockInTime() != null))
                .collect(Collectors.toList());
    }

    /* ── MY SUMMARY (Employee — current month) ────────────── */
    public AttendanceSummaryDTO getMySummary(Long userId, int month, int year) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate   = startDate.withDayOfMonth(startDate.lengthOfMonth());
        LocalDate today     = LocalDate.now();

        List<Attendance> records = attendanceRepository
                .findByUserIdAndDateBetweenOrderByDateDesc(userId, startDate, endDate);

        int workingDays = countWorkingDays(startDate, endDate.isAfter(today) ? today : endDate);
        int presentDays = (int) records.stream().filter(a -> a.getAttendanceStatus() == AttendanceStatus.PRESENT).count();
        int lateDays    = (int) records.stream().filter(a -> a.getAttendanceStatus() == AttendanceStatus.LATE).count();
        int halfDays    = (int) records.stream().filter(a -> a.getAttendanceStatus() == AttendanceStatus.HALF_DAY).count();
        int markedDays  = (int) records.stream().filter(a -> a.getAttendanceStatus() != null).count();
        int absentDays  = Math.max(0, workingDays - markedDays);

        double totalHours = records.stream()
                .mapToDouble(a -> a.getTotalHoursWorked() != null ? a.getTotalHoursWorked() : 0.0)
                .sum();

        double attendanceRate   = workingDays > 0 ? ((presentDays + lateDays) / (double) workingDays) * 100.0 : 0;
        double consistencyScore = workingDays > 0 ? ((presentDays + lateDays + halfDays * 0.5) / workingDays) * 100.0 : 0;

        // Today's status
        Optional<Attendance> todayRecord = attendanceRepository.findByUserIdAndDate(userId, today);
        String todayStatus = "NOT_MARKED";
        String clockInStr  = null;
        String workedToday = null;

        if (todayRecord.isPresent()) {
            Attendance tr = todayRecord.get();
            if (tr.getClockOutTime() != null) {
                todayStatus = "CLOCKED_OUT";
            } else if (tr.getClockInTime() != null) {
                todayStatus = "CLOCKED_IN";
                clockInStr  = tr.getClockInTime().toLocalTime()
                               .format(DateTimeFormatter.ofPattern("hh:mm a"));
                Duration d = Duration.between(tr.getClockInTime(), LocalDateTime.now());
                workedToday = formatDuration(d);
            }
        }

        String monthName = Month.of(month).getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        return AttendanceSummaryDTO.builder()
                .userId(userId)
                .employeeName(user.getFullName())
                .month(monthName)
                .year(year)
                .totalWorkingDays(workingDays)
                .presentDays(presentDays)
                .lateDays(lateDays)
                .absentDays(absentDays)
                .halfDays(halfDays)
                .attendanceRate(round2(attendanceRate))
                .consistencyScore(round2(consistencyScore))
                .totalHoursWorked(round2(totalHours))
                .averageHoursPerDay(workingDays > 0 ? round2(totalHours / Math.max(1, presentDays + lateDays)) : 0)
                .expectedHours(workingDays * 8.0)
                .todayStatus(todayStatus)
                .clockInTime(clockInStr)
                .workingHoursToday(workedToday)
                .build();
    }

    /* ── TEAM ATTENDANCE (Manager) ─────────────────────────── */
    public TeamAttendanceDTO getTeamAttendance(int month, int year) {
        LocalDate today     = LocalDate.now();
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate   = startDate.withDayOfMonth(startDate.lengthOfMonth());

        List<User> employees = userRepository.findByRole(Role.EMPLOYEE);
        long total = employees.size();

        // Today's records
        List<Attendance> todayRecords = attendanceRepository.findByDateOrderByUserFullNameAsc(today);
        long presentToday = attendanceRepository.countPresentToday(today);
        long lateToday    = attendanceRepository.countByDateAndAttendanceStatus(today, AttendanceStatus.LATE);
        long absentToday  = total - todayRecords.size();
        double rateToday  = total > 0 ? (presentToday / (double) total) * 100.0 : 0;

        List<AttendanceRecordDTO> todayDTOs = todayRecords.stream()
                .map(a -> toRecordDTO(a, a.getClockOutTime() == null && a.getClockInTime() != null))
                .collect(Collectors.toList());

        // Monthly summary per employee
        List<AttendanceSummaryDTO> summaries = employees.stream()
                .map(emp -> getMySummary(emp.getId(), month, year))
                .collect(Collectors.toList());

        return TeamAttendanceDTO.builder()
                .date(today.toString())
                .presentToday(presentToday)
                .lateToday(lateToday)
                .absentToday(Math.max(0, absentToday))
                .totalEmployees(total)
                .attendanceRateToday(round2(rateToday))
                .todayRecords(todayDTOs)
                .monthlySummaries(summaries)
                .build();
    }

    /* ── EMPLOYEE HISTORY (Manager view) ──────────────────── */
    public List<AttendanceRecordDTO> getEmployeeHistory(Long employeeId) {
        userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));
        return attendanceRepository.findByUserIdOrderByDateDesc(employeeId)
                .stream()
                .map(a -> toRecordDTO(a, a.getClockOutTime() == null && a.getClockInTime() != null))
                .collect(Collectors.toList());
    }

    /* ── PUBLIC: attendance consistency score for productivity ─ */
    // Returns 0–100; used by ProductivityService as an additive component
    public double getAttendanceConsistencyScore(Long userId, int month, int year) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate   = startDate.withDayOfMonth(startDate.lengthOfMonth());
        LocalDate today     = LocalDate.now();
        LocalDate effectiveEnd = endDate.isAfter(today) ? today : endDate;

        int workingDays = countWorkingDays(startDate, effectiveEnd);
        if (workingDays == 0) return 100.0; // no working days yet → not penalized

        List<Attendance> records = attendanceRepository
                .findByUserIdAndDateBetweenOrderByDateDesc(userId, startDate, effectiveEnd);

        double effectiveDays = records.stream().mapToDouble(a -> {
            if (a.getAttendanceStatus() == AttendanceStatus.PRESENT) return 1.0;
            if (a.getAttendanceStatus() == AttendanceStatus.LATE)    return 0.85; // late = slight penalty
            if (a.getAttendanceStatus() == AttendanceStatus.HALF_DAY)return 0.5;
            return 0.0; // ABSENT
        }).sum();

        return Math.min(100.0, (effectiveDays / workingDays) * 100.0);
    }

    /* ── HELPERS ──────────────────────────────────────────── */
    private int countWorkingDays(LocalDate from, LocalDate to) {
        int count = 0;
        LocalDate d = from;
        while (!d.isAfter(to)) {
            DayOfWeek day = d.getDayOfWeek();
            if (day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY) count++;
            d = d.plusDays(1);
        }
        return count;
    }

    private String formatDuration(Duration d) {
        long hours   = d.toHours();
        long minutes = d.toMinutesPart();
        return hours + "h " + String.format("%02d", minutes) + "m";
    }

    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }

    private AttendanceRecordDTO toRecordDTO(Attendance a, boolean currentlyActive) {
        return AttendanceRecordDTO.builder()
                .id(a.getId())
                .userId(a.getUser().getId())
                .employeeName(a.getUser().getFullName())
                .department(a.getUser().getDepartment())
                .date(a.getDate())
                .clockInTime(a.getClockInTime())
                .clockOutTime(a.getClockOutTime())
                .totalHoursWorked(a.getTotalHoursWorked())
                .attendanceStatus(a.getAttendanceStatus())
                .remarks(a.getRemarks())
                .currentlyActive(currentlyActive)
                .build();
    }
}