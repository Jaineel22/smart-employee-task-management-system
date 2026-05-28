package com.ncode.smarttask.service;

import com.ncode.smarttask.dto.ProductivityDTO;
import com.ncode.smarttask.dto.TeamAnalyticsDTO;
import com.ncode.smarttask.entity.DailyWorkReport;
import com.ncode.smarttask.entity.Task;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.enums.Role;
import com.ncode.smarttask.enums.TaskStatus;
import com.ncode.smarttask.repository.DailyWorkReportRepository;
import com.ncode.smarttask.repository.TaskRepository;
import com.ncode.smarttask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductivityService {

    private final UserRepository            userRepository;
    private final TaskRepository            taskRepository;
    private final DailyWorkReportRepository reportRepository;
    private final AttendanceService         attendanceService;  // ADDED

    // Expected working hours per month (22 working days × 8 hrs)
    private static final double EXPECTED_MONTHLY_HOURS = 176.0;

    // Weighted component multipliers - UPDATED
    private static final double W_ATTENDANCE = 0.10;  // NEW
    private static final double W_HOURS      = 0.35;  // was 0.40
    private static final double W_COMPLETE   = 0.25;  // was 0.30
    private static final double W_PROGRESS   = 0.20;  // unchanged
    private static final double W_DEADLINE   = 0.10;  // unchanged

    /* ── PUBLIC: single employee ──────────────────────────── */
    public ProductivityDTO getEmployeeProductivity(Long employeeId, int month, int year) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        return buildProductivityDTO(employee, month, year);
    }

    /* ── PUBLIC: full team (manager view) ────────────────── */
    public TeamAnalyticsDTO getTeamAnalytics(int month, int year) {
        List<User> employees = userRepository.findByRole(Role.EMPLOYEE);

        List<ProductivityDTO> employeeStats = employees.stream()
                .map(emp -> buildProductivityDTO(emp, month, year))
                .collect(Collectors.toList());

        double teamAvg = employeeStats.stream()
                .mapToDouble(ProductivityDTO::getProductivityScore)
                .average()
                .orElse(0.0);

        double totalHours = employeeStats.stream()
                .mapToDouble(ProductivityDTO::getHoursWorked)
                .sum();

        int totalCompleted = employeeStats.stream()
                .mapToInt(ProductivityDTO::getTotalTasksCompleted)
                .sum();

        int totalPending = employeeStats.stream()
                .mapToInt(d -> d.getTotalTasksAssigned() - d.getTotalTasksCompleted())
                .sum();

        ProductivityDTO best   = employeeStats.stream()
                .max(Comparator.comparingDouble(ProductivityDTO::getProductivityScore))
                .orElse(null);

        ProductivityDTO lowest = employeeStats.stream()
                .min(Comparator.comparingDouble(ProductivityDTO::getProductivityScore))
                .orElse(null);

        String monthName = Month.of(month).getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        return TeamAnalyticsDTO.builder()
                .month(monthName)
                .year(year)
                .teamAvgProductivity(round2(teamAvg))
                .totalHoursLogged(round2(totalHours))
                .totalTasksCompleted(totalCompleted)
                .totalTasksPending(Math.max(0, totalPending))
                .bestPerformerName(best   != null ? best.getEmployeeName()   : null)
                .bestPerformerScore(best  != null ? best.getProductivityScore() : 0)
                .lowestPerformerName(lowest != null ? lowest.getEmployeeName() : null)
                .lowestPerformerScore(lowest != null ? lowest.getProductivityScore() : 0)
                .employees(employeeStats)
                .build();
    }

    /* ── PRIVATE: build one employee's DTO ───────────────── */
    private ProductivityDTO buildProductivityDTO(User employee, int month, int year) {

        // Date range for the given month/year
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate   = startDate.withDayOfMonth(startDate.lengthOfMonth());

        // ── 1. Hours Worked Score (35%) ───────────────────
        List<DailyWorkReport> reports = reportRepository
                .findByUserIdAndReportDateBetween(employee.getId(), startDate, endDate);

        double hoursWorked = reports.stream()
                .mapToDouble(r -> r.getHoursWorked() != null ? r.getHoursWorked().doubleValue() : 0.0)
                .sum();

        double hoursScore = Math.min(100.0, (hoursWorked / EXPECTED_MONTHLY_HOURS) * 100.0);

        // ── 2. Task Completion Score (25%) ────────────────
        List<Task> assignedTasks = taskRepository.findByAssignedToId(employee.getId());

        // Filter: tasks created/assigned within or before this month
        // (we count tasks that were active in this period)
        List<Task> relevantTasks = assignedTasks.stream()
                .filter(t -> {
                    if (t.getCreatedAt() == null) return true;
                    LocalDate created = t.getCreatedAt().toLocalDate();
                    return !created.isAfter(endDate);
                })
                .collect(Collectors.toList());

        int totalAssigned  = relevantTasks.size();
        int totalCompleted = (int) relevantTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED)
                .count();

        double taskCompletionScore = totalAssigned > 0
                ? (totalCompleted / (double) totalAssigned) * 100.0
                : 0.0;

        // ── 3. Average Progress Score (20%) ───────────────
        double avgProgress = relevantTasks.stream()
                .mapToInt(t -> t.getCompletionPercentage() != null ? t.getCompletionPercentage() : 0)
                .average()
                .orElse(0.0);

        // ── 4. Deadline Discipline Score (10%) ────────────
        List<Task> completedWithDeadline = relevantTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED
                          && t.getDeadline() != null
                          && t.getCompletedAt() != null)
                .collect(Collectors.toList());

        long onTime = completedWithDeadline.stream()
                .filter(t -> !t.getCompletedAt().isAfter(t.getDeadline()))
                .count();

        double deadlineScore = completedWithDeadline.isEmpty()
                ? 100.0   // no deadlines set → not penalized
                : (onTime / (double) completedWithDeadline.size()) * 100.0;

        // ── 5. Attendance Consistency Score (10%) ────────────────
        double attendanceScore;
        try {
            attendanceScore = attendanceService.getAttendanceConsistencyScore(
                    employee.getId(), month, year);
        } catch (Exception e) {
            // Attendance module not yet populated → neutral 100% so existing scores are unaffected
            attendanceScore = 100.0;
        }

        // ── Final Weighted Score ────────────────────────────────
        double productivityScore =
                (attendanceScore       * W_ATTENDANCE) +
                (hoursScore            * W_HOURS)       +
                (taskCompletionScore   * W_COMPLETE)    +
                (avgProgress           * W_PROGRESS)    +
                (deadlineScore         * W_DEADLINE);

        productivityScore = Math.min(100.0, Math.max(0.0, productivityScore));

        // ── Trend delta (vs previous month) ──────────────
        Double trendDelta = calculateTrendDelta(employee, month, year,
                hoursScore, taskCompletionScore, avgProgress, deadlineScore);

        String monthName = Month.of(month).getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        return ProductivityDTO.builder()
                .employeeId(employee.getId())
                .employeeName(employee.getFullName())
                .department(employee.getDepartment())
                .month(monthName)
                .year(year)
                .hoursWorked(round2(hoursWorked))
                .expectedHours(EXPECTED_MONTHLY_HOURS)
                .totalTasksAssigned(totalAssigned)
                .totalTasksCompleted(totalCompleted)
                .avgTaskProgress(round2(avgProgress))
                .onTimeCompletionRate(round2(deadlineScore))
                .hoursScore(round2(hoursScore))
                .taskCompletionScore(round2(taskCompletionScore))
                .avgProgressScore(round2(avgProgress))
                .deadlineDisciplineScore(round2(deadlineScore))
                .productivityScore(round2(productivityScore))
                .performanceStatus(getPerformanceStatus(productivityScore))
                .trendDelta(trendDelta)
                .build();
    }

    /* ── Trend: compare against prior month ──────────────── */
    private Double calculateTrendDelta(User employee,
                                       int month, int year,
                                       double curHours, double curCompletion,
                                       double curProgress, double curDeadline) {
        try {
            // Go back one month safely
            LocalDate current  = LocalDate.of(year, month, 1);
            LocalDate previous = current.minusMonths(1);
            int prevMonth = previous.getMonthValue();
            int prevYear  = previous.getYear();

            LocalDate prevStart = LocalDate.of(prevYear, prevMonth, 1);
            LocalDate prevEnd   = prevStart.withDayOfMonth(prevStart.lengthOfMonth());

            List<DailyWorkReport> prevReports = reportRepository
                    .findByUserIdAndReportDateBetween(employee.getId(), prevStart, prevEnd);

            double prevHours = prevReports.stream()
                    .mapToDouble(r -> r.getHoursWorked() != null ? r.getHoursWorked().doubleValue() : 0.0)
                    .sum();

            // If no previous month data at all, return null (no trend available)
            if (prevHours == 0 && prevReports.isEmpty()) return null;

            double prevHoursScore = Math.min(100.0, (prevHours / EXPECTED_MONTHLY_HOURS) * 100.0);

            List<Task> prevTasks = taskRepository.findByAssignedToId(employee.getId()).stream()
                    .filter(t -> t.getCreatedAt() != null && !t.getCreatedAt().toLocalDate().isAfter(prevEnd))
                    .collect(Collectors.toList());

            int prevAssigned  = prevTasks.size();
            int prevCompleted = (int) prevTasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
            double prevCompletion = prevAssigned > 0 ? (prevCompleted / (double) prevAssigned) * 100.0 : 0.0;
            double prevProgress   = prevTasks.stream().mapToInt(t -> t.getCompletionPercentage() != null ? t.getCompletionPercentage() : 0).average().orElse(0.0);

            // For previous month, use neutral attendance score (100) if attendanceService not available
            double prevAttendanceScore;
            try {
                prevAttendanceScore = attendanceService.getAttendanceConsistencyScore(employee.getId(), prevMonth, prevYear);
            } catch (Exception e) {
                prevAttendanceScore = 100.0;
            }

            double prevScore =
                    (prevAttendanceScore * W_ATTENDANCE) +
                    (prevHoursScore      * W_HOURS)      +
                    (prevCompletion      * W_COMPLETE)   +
                    (prevProgress        * W_PROGRESS)   +
                    (100.0               * W_DEADLINE);  // no deadline data for prev → neutral

            double curScore =
                    (curHours        * W_HOURS)    +
                    (curCompletion   * W_COMPLETE)  +
                    (curProgress     * W_PROGRESS)  +
                    (curDeadline     * W_DEADLINE);

            // Add attendance to current score
            double curAttendanceScore;
            try {
                curAttendanceScore = attendanceService.getAttendanceConsistencyScore(employee.getId(), month, year);
            } catch (Exception e) {
                curAttendanceScore = 100.0;
            }
            curScore += (curAttendanceScore * W_ATTENDANCE);

            return round2(curScore - prevScore);

        } catch (Exception e) {
            return null;
        }
    }

    /* ── Helpers ─────────────────────────────────────────── */
    private String getPerformanceStatus(double score) {
        if (score >= 90) return "Outstanding";
        if (score >= 75) return "Excellent";
        if (score >= 60) return "Good";
        if (score >= 40) return "Needs Improvement";
        return "Low Productivity";
    }

    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}