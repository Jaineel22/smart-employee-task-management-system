package com.ncode.smarttask.service;

import com.ncode.smarttask.dto.EmployeeRiskResponse;
import com.ncode.smarttask.dto.RiskPredictionResponse;
import com.ncode.smarttask.dto.RiskPredictionResponse.RiskFactorBreakdown;
import com.ncode.smarttask.dto.TeamRiskResponse;
import com.ncode.smarttask.entity.Task;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.enums.Priority;
import com.ncode.smarttask.enums.Role;
import com.ncode.smarttask.enums.TaskStatus;
import com.ncode.smarttask.repository.TaskRepository;
import com.ncode.smarttask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI-6: Deadline Risk Prediction Service
 * ========================================
 * Hybrid architecture:
 *   Layer 1 — Rule-based risk engine (active now)
 *   Layer 2 — ML-ready slot (plug in RandomForest later)
 *
 * Risk score = weighted sum of six components (total = 100):
 *   Deadline Proximity  30%
 *   Progress            25%
 *   Productivity        15%
 *   Utilization         10%
 *   Attendance          10%
 *   Historical Delivery 10%
 *
 * Risk levels:  0–30 LOW | 31–60 MEDIUM | 61–80 HIGH | 81–100 CRITICAL
 *
 * ZERO changes to existing services, repos, or tables.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeadlineRiskService {

    private final TaskRepository      taskRepository;
    private final UserRepository      userRepository;
    private final ProductivityService productivityService;
    private final AttendanceService   attendanceService;

    // ── Weight constants (must sum to 1.0) ────────────────────────────────────
    private static final double W_DEADLINE    = 0.30;
    private static final double W_PROGRESS    = 0.25;
    private static final double W_PRODUCTIVITY = 0.15;
    private static final double W_UTILIZATION = 0.10;
    private static final double W_ATTENDANCE  = 0.10;
    private static final double W_HISTORICAL  = 0.10;

    // ════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ════════════════════════════════════════════════════════════════════════

    /** GET /api/risk/task/{taskId} */
    public RiskPredictionResponse getTaskRisk(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        if (task.getAssignedTo() == null) {
            return buildNoAssigneeResponse(task);
        }

        User employee = task.getAssignedTo();
        EmployeeContext ctx = buildContext(employee);
        return scoreTask(task, ctx);
    }

    /** GET /api/risk/employee/{employeeId} */
    public EmployeeRiskResponse getEmployeeRisk(Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        EmployeeContext ctx = buildContext(employee);

        List<Task> activeTasks = taskRepository.findActiveTasksWithDeadlineByEmployee(employeeId);
        List<RiskPredictionResponse> taskRisks = activeTasks.stream()
                .map(t -> scoreTask(t, ctx))
                .sorted(Comparator.comparingInt(RiskPredictionResponse::getRiskScore).reversed())
                .collect(Collectors.toList());

        return buildEmployeeRisk(employee, taskRisks);
    }

    /** GET /api/risk/project/{projectId} */
    public List<RiskPredictionResponse> getProjectRisk(Long projectId) {
        List<Task> tasks = taskRepository.findActiveTasksWithDeadlineByProject(projectId);
        return tasks.stream()
                .map(t -> {
                    if (t.getAssignedTo() == null) return buildNoAssigneeResponse(t);
                    return scoreTask(t, buildContext(t.getAssignedTo()));
                })
                .sorted(Comparator.comparingInt(RiskPredictionResponse::getRiskScore).reversed())
                .collect(Collectors.toList());
    }

    /** GET /api/risk/team */
    public TeamRiskResponse getTeamRisk(int month, int year) {
        List<User> employees = userRepository.findByRole(Role.EMPLOYEE);

        List<EmployeeRiskResponse> employeeRisks = employees.stream()
                .map(emp -> {
                    try {
                        return getEmployeeRisk(emp.getId());
                    } catch (Exception e) {
                        log.warn("[DeadlineRiskService] Skipping employee {}: {}", emp.getId(), e.getMessage());
                        return buildEmptyEmployeeRisk(emp);
                    }
                })
                .sorted(Comparator.comparingInt(EmployeeRiskResponse::getAvgRiskScore).reversed())
                .collect(Collectors.toList());

        return buildTeamRisk(month, year, employeeRisks);
    }

    /** GET /api/risk/critical — all CRITICAL tasks across team */
    public List<RiskPredictionResponse> getCriticalTasks() {
        List<Task> allActive = taskRepository.findAllActiveTasksWithDeadline();
        return allActive.stream()
                .filter(t -> t.getAssignedTo() != null)
                .map(t -> scoreTask(t, buildContext(t.getAssignedTo())))
                .filter(r -> r.getRiskScore() >= 81)
                .sorted(Comparator.comparingInt(RiskPredictionResponse::getRiskScore).reversed())
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════════════════════
    // CORE RULE ENGINE
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Score a single task using the six-component weighted rule engine.
     * This method is the ML plug-in point: swap for ML prediction in AI-7+.
     */
    private RiskPredictionResponse scoreTask(Task task, EmployeeContext ctx) {
        LocalDateTime now = LocalDateTime.now();
        List<String> reasons = new ArrayList<>();
        List<String> recs    = new ArrayList<>();

        // ── 1. Deadline Proximity (30%) ───────────────────────────────────────
        long daysRemaining = task.getDeadline() != null
                ? ChronoUnit.DAYS.between(now.toLocalDate(), task.getDeadline().toLocalDate())
                : 999L;

        int deadlineRaw;
        if (daysRemaining < 0) {
            deadlineRaw = 100;
            reasons.add("Task is already overdue by " + Math.abs(daysRemaining) + " day(s)");
            recs.add("Escalate immediately — deadline has passed");
        } else if (daysRemaining == 0) {
            deadlineRaw = 95;
            reasons.add("Deadline is today");
            recs.add("Complete and submit today — no time remaining");
        } else if (daysRemaining <= 2) {
            deadlineRaw = 85;
            reasons.add("Deadline in " + daysRemaining + " day(s)");
            recs.add("All other tasks should be paused — focus entirely on this");
        } else if (daysRemaining <= 5) {
            deadlineRaw = 65;
            reasons.add("Deadline approaching in " + daysRemaining + " days");
            recs.add("Increase daily work allocation on this task");
        } else if (daysRemaining <= 10) {
            deadlineRaw = 40;
        } else if (daysRemaining <= 20) {
            deadlineRaw = 20;
        } else {
            deadlineRaw = 5;
        }

        // ── 2. Progress (25%) ────────────────────────────────────────────────
        int progress = task.getCompletionPercentage() != null ? task.getCompletionPercentage() : 0;

        // Expected progress = time elapsed ratio × 100
        int expectedProgress = 50; // default
        if (task.getCreatedAt() != null && task.getDeadline() != null) {
            long totalDays   = ChronoUnit.DAYS.between(task.getCreatedAt().toLocalDate(), task.getDeadline().toLocalDate());
            long elapsedDays = ChronoUnit.DAYS.between(task.getCreatedAt().toLocalDate(), now.toLocalDate());
            expectedProgress = totalDays > 0 ? (int) Math.min(100, (elapsedDays * 100.0 / totalDays)) : 50;
        }

        int progressGap = Math.max(0, expectedProgress - progress);
        int progressRaw;
        if (progressGap >= 50) {
            progressRaw = 90;
            reasons.add("Progress (" + progress + "%) is severely behind schedule (expected " + expectedProgress + "%)");
            recs.add("Allocate additional daily hours to close the progress gap");
        } else if (progressGap >= 30) {
            progressRaw = 70;
            reasons.add("Progress behind schedule by " + progressGap + "%");
            recs.add("Prioritize this task in daily work allocation");
        } else if (progressGap >= 15) {
            progressRaw = 45;
            reasons.add("Slight progress lag detected");
        } else if (progress >= 80) {
            progressRaw = 10;
        } else {
            progressRaw = 25;
        }

        // ── 3. Productivity (15%) ─────────────────────────────────────────────
        double prodScore = ctx.productivityScore;
        int productivityRaw;
        if (prodScore < 40) {
            productivityRaw = 85;
            reasons.add("Employee productivity critically low (" + (int) prodScore + "%)");
            recs.add("Review workload — reassign some tasks to balance team");
        } else if (prodScore < 55) {
            productivityRaw = 60;
            reasons.add("Below-average productivity (" + (int) prodScore + "%)");
        } else if (prodScore < 70) {
            productivityRaw = 35;
        } else {
            productivityRaw = 10;
        }

        // ── 4. Utilization (10%) ──────────────────────────────────────────────
        double utilPct = ctx.utilizationPct;
        int utilizationRaw;
        if (utilPct > 95) {
            utilizationRaw = 90;
            reasons.add("Employee utilization critical (" + (int) utilPct + "%) — overloaded");
            recs.add("Redistribute tasks from this employee to reduce overload");
        } else if (utilPct > 85) {
            utilizationRaw = 60;
            reasons.add("High utilization (" + (int) utilPct + "%)");
        } else if (utilPct < 40) {
            utilizationRaw = 20; // low utilization = under-engaged
        } else {
            utilizationRaw = 15;
        }

        // ── 5. Attendance (10%) ───────────────────────────────────────────────
        double attPct = ctx.attendancePct;
        int attendanceRaw;
        if (attPct < 60) {
            attendanceRaw = 80;
            reasons.add("Attendance critically low (" + (int) attPct + "%)");
        } else if (attPct < 75) {
            attendanceRaw = 50;
            reasons.add("Below-average attendance (" + (int) attPct + "%)");
        } else {
            attendanceRaw = 10;
        }

        // ── 6. Historical Delivery (10%) ──────────────────────────────────────
        double histRate = ctx.historicalOnTimeRate;
        int historicalRaw;
        if (histRate < 50) {
            historicalRaw = 80;
            reasons.add("Historical on-time delivery rate low (" + (int) histRate + "%)");
        } else if (histRate < 70) {
            historicalRaw = 50;
        } else {
            historicalRaw = 10;
        }

        // ── Priority multiplier ───────────────────────────────────────────────
        double priorityMultiplier = switch (task.getPriority()) {
            case HIGH   -> 1.15;
            case MEDIUM -> 1.0;
            case LOW    -> 0.85;
            default     -> 1.0;
        };

        // ── Weighted composite ────────────────────────────────────────────────
        double raw =
                deadlineRaw    * W_DEADLINE    +
                progressRaw    * W_PROGRESS    +
                productivityRaw * W_PRODUCTIVITY +
                utilizationRaw * W_UTILIZATION +
                attendanceRaw  * W_ATTENDANCE  +
                historicalRaw  * W_HISTORICAL;

        int riskScore = (int) Math.min(100, Math.max(0, Math.round(raw * priorityMultiplier)));

        String riskLevel = resolveRiskLevel(riskScore);

        // ── Confidence — higher when more signals confirm risk ────────────────
        int signalCount = (deadlineRaw > 50 ? 1 : 0) + (progressRaw > 50 ? 1 : 0)
                        + (productivityRaw > 50 ? 1 : 0) + (utilizationRaw > 50 ? 1 : 0);
        int confidence = 60 + (signalCount * 8);
        confidence = Math.min(95, confidence);

        if (recs.isEmpty()) {
            recs.add("Continue current pace — risk level is manageable");
        }

        return RiskPredictionResponse.builder()
                .taskId(task.getId())
                .taskTitle(task.getTitle())
                .taskStatus(task.getStatus() != null ? task.getStatus().name() : "UNKNOWN")
                .priority(task.getPriority() != null ? task.getPriority().name() : "MEDIUM")
                .riskScore(riskScore)
                .riskLevel(riskLevel)
                .confidence(confidence)
                .daysRemaining(daysRemaining == 999L ? null : daysRemaining)
                .completionPercentage(progress)
                .reasons(reasons.isEmpty()
                        ? List.of("No significant risk signals detected") : reasons)
                .recommendations(recs)
                .factorBreakdown(RiskFactorBreakdown.builder()
                        .deadlineProximityScore(deadlineRaw)
                        .progressScore(progressRaw)
                        .productivityScore(productivityRaw)
                        .utilizationScore(utilizationRaw)
                        .attendanceScore(attendanceRaw)
                        .historicalScore(historicalRaw)
                        .build())
                .mlModelUsed(false)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    // ════════════════════════════════════════════════════════════════════════
    // CONTEXT BUILDER
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Gather all employee-level signals needed across task scoring.
     * Done once per employee so we don't repeat service calls per task.
     */
    private EmployeeContext buildContext(User employee) {
        int month = LocalDate.now().getMonthValue();
        int year  = LocalDate.now().getYear();

        double productivityScore = safeGetProductivity(employee.getId(), month, year);
        double attendancePct     = safeGetAttendance(employee.getId(), month, year);
        double utilizationPct    = safeGetUtilization(employee.getId());
        double historicalOnTime  = safeGetHistoricalOnTimeRate(employee.getId());

        return new EmployeeContext(productivityScore, attendancePct, utilizationPct, historicalOnTime);
    }

    /** Immutable context record — holds all pre-fetched employee signals */
    private record EmployeeContext(
            double productivityScore,
            double attendancePct,
            double utilizationPct,
            double historicalOnTimeRate
    ) {}

    // ════════════════════════════════════════════════════════════════════════
    // AGGREGATION BUILDERS
    // ════════════════════════════════════════════════════════════════════════

    private EmployeeRiskResponse buildEmployeeRisk(User employee,
                                                    List<RiskPredictionResponse> taskRisks) {
        int avg = taskRisks.isEmpty() ? 0
                : (int) taskRisks.stream().mapToInt(RiskPredictionResponse::getRiskScore).average().orElse(0);

        long critical = taskRisks.stream().filter(r -> "CRITICAL".equals(r.getRiskLevel())).count();
        long high     = taskRisks.stream().filter(r -> "HIGH".equals(r.getRiskLevel())).count();
        long medium   = taskRisks.stream().filter(r -> "MEDIUM".equals(r.getRiskLevel())).count();
        long low      = taskRisks.stream().filter(r -> "LOW".equals(r.getRiskLevel())).count();

        String overallLevel = critical > 0 ? "CRITICAL"
                : high > 0     ? "HIGH"
                : medium > 0   ? "MEDIUM"
                : "LOW";

        return EmployeeRiskResponse.builder()
                .employeeId(employee.getId())
                .employeeName(employee.getFullName())
                .department(employee.getDepartment())
                .overallRiskLevel(overallLevel)
                .avgRiskScore(avg)
                .criticalTaskCount((int) critical)
                .highRiskTaskCount((int) high)
                .mediumRiskTaskCount((int) medium)
                .lowRiskTaskCount((int) low)
                .taskRisks(taskRisks)
                .build();
    }

    private TeamRiskResponse buildTeamRisk(int month, int year,
                                            List<EmployeeRiskResponse> empRisks) {
        int totalTasks = empRisks.stream()
                .mapToInt(e -> e.getTaskRisks().size()).sum();

        long critical = empRisks.stream().mapToLong(EmployeeRiskResponse::getCriticalTaskCount).sum();
        long high     = empRisks.stream().mapToLong(EmployeeRiskResponse::getHighRiskTaskCount).sum();
        long medium   = empRisks.stream().mapToLong(EmployeeRiskResponse::getMediumRiskTaskCount).sum();
        long low      = empRisks.stream().mapToLong(EmployeeRiskResponse::getLowRiskTaskCount).sum();

        int teamAvg = empRisks.isEmpty() ? 0
                : (int) empRisks.stream().mapToInt(EmployeeRiskResponse::getAvgRiskScore).average().orElse(0);

        String teamLevel = resolveRiskLevel(teamAvg);

        List<RiskPredictionResponse> criticalTasks = empRisks.stream()
                .flatMap(e -> e.getTaskRisks().stream())
                .filter(r -> "CRITICAL".equals(r.getRiskLevel()))
                .sorted(Comparator.comparingInt(RiskPredictionResponse::getRiskScore).reversed())
                .collect(Collectors.toList());

        return TeamRiskResponse.builder()
                .month(month)
                .year(year)
                .totalEmployees(empRisks.size())
                .totalActiveTasks(totalTasks)
                .criticalTaskCount((int) critical)
                .highRiskTaskCount((int) high)
                .mediumRiskTaskCount((int) medium)
                .lowRiskTaskCount((int) low)
                .teamAvgRiskScore(teamAvg)
                .teamRiskLevel(teamLevel)
                .employeeRisks(empRisks)
                .criticalTasks(criticalTasks)
                .build();
    }

    // ════════════════════════════════════════════════════════════════════════
    // SAFE FETCHERS — never crash; always return defaults
    // ════════════════════════════════════════════════════════════════════════

    private double safeGetProductivity(Long empId, int month, int year) {
        try {
            return productivityService.getEmployeeProductivity(empId, month, year).getProductivityScore();
        } catch (Exception e) {
            log.debug("[RiskService] productivity fallback for {}: {}", empId, e.getMessage());
            return 70.0;
        }
    }

    private double safeGetAttendance(Long empId, int month, int year) {
        try {
            var summary = attendanceService.getMySummary(empId, month, year);
            return summary != null ? summary.getAttendanceRate() : 80.0;
        } catch (Exception e) {
            log.debug("[RiskService] attendance fallback for {}: {}", empId, e.getMessage());
            return 80.0;
        }
    }

    private double safeGetUtilization(Long empId) {
        try {
            // Utilization = (active tasks / reasonable max) × 100
            // Uses pending non-completed task count as a proxy
            List<Task> active = taskRepository.findActiveTasks(empId);
            // 8 tasks = 100% utilization baseline (configurable)
            return Math.min(110.0, (active.size() / 8.0) * 100.0);
        } catch (Exception e) {
            return 70.0;
        }
    }

    private double safeGetHistoricalOnTimeRate(Long empId) {
        try {
            long onTime    = taskRepository.countOnTimeCompletions(empId);
            long totalDone = taskRepository.countCompletedWithDeadline(empId);
            return totalDone > 0 ? (onTime / (double) totalDone) * 100.0 : 100.0;
        } catch (Exception e) {
            return 100.0;
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════════════════════════

    private String resolveRiskLevel(int score) {
        if (score >= 81) return "CRITICAL";
        if (score >= 61) return "HIGH";
        if (score >= 31) return "MEDIUM";
        return "LOW";
    }

    private RiskPredictionResponse buildNoAssigneeResponse(Task task) {
        return RiskPredictionResponse.builder()
                .taskId(task.getId())
                .taskTitle(task.getTitle())
                .taskStatus(task.getStatus() != null ? task.getStatus().name() : "UNKNOWN")
                .priority(task.getPriority() != null ? task.getPriority().name() : "MEDIUM")
                .riskScore(0)
                .riskLevel("LOW")
                .confidence(0)
                .reasons(List.of("Task has no assigned employee"))
                .recommendations(List.of("Assign an employee to this task"))
                .mlModelUsed(false)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    private EmployeeRiskResponse buildEmptyEmployeeRisk(User emp) {
        return EmployeeRiskResponse.builder()
                .employeeId(emp.getId())
                .employeeName(emp.getFullName())
                .department(emp.getDepartment())
                .overallRiskLevel("LOW")
                .avgRiskScore(0)
                .criticalTaskCount(0).highRiskTaskCount(0)
                .mediumRiskTaskCount(0).lowRiskTaskCount(0)
                .taskRisks(List.of())
                .build();
    }
}