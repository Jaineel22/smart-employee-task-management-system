package com.ncode.smarttask.service;

import com.ncode.smarttask.dto.*;
import com.ncode.smarttask.entity.Task;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.enums.Role;
import com.ncode.smarttask.enums.TaskStatus;
import com.ncode.smarttask.repository.TaskRepository;
import com.ncode.smarttask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI-5: Recommendation Engine Service
 * =====================================
 * Generates context-aware, prioritised recommendations for:
 *   - Individual employees  → getMyRecommendations / getEmployeeRecommendations
 *   - Full team             → getTeamRecommendations
 *   - Project team          → getProjectRecommendations
 *
 * Designed as a platform service:
 *   - AI-7 Team Intelligence can call getTeamRecommendations()
 *   - AI-8 GenAI can call getEmployeeRecommendations() and inject into prompts
 *
 * ZERO changes to existing services, tables, or APIs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final UserRepository      userRepository;
    private final TaskRepository      taskRepository;
    private final ProductivityService productivityService;
    private final AttendanceService   attendanceService;

    // ════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ════════════════════════════════════════════════════════════════════════

    /** GET /api/recommendations/me  (employee calls own) */
    public EmployeeRecommendationResponse getMyRecommendations(Long employeeId, int month, int year) {
        return getEmployeeRecommendations(employeeId, month, year);
    }

    /** GET /api/recommendations/employee/{id}  (manager calls for an employee) */
    public EmployeeRecommendationResponse getEmployeeRecommendations(Long employeeId,
                                                                      int month, int year) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        EmployeeMetrics metrics = gatherMetrics(employee, month, year);
        List<RecommendationResponse> recs = generateEmployeeRecommendations(metrics);

        String overallPriority = recs.stream()
                .map(RecommendationResponse::getPriority)
                .min(Comparator.comparingInt(this::priorityOrdinal))
                .orElse("LOW");

        return EmployeeRecommendationResponse.builder()
                .employeeId(employee.getId())
                .employeeName(employee.getFullName())
                .department(employee.getDepartment())
                .productivityScore(metrics.productivityScore)
                .attendancePct(metrics.attendancePct)
                .utilizationPct(metrics.utilizationPct)
                .pendingTasks(metrics.pendingTasks)
                .overdueTasks(metrics.overdueTasks)
                .recommendations(recs)
                .totalRecommendations(recs.size())
                .overallPriority(overallPriority)
                .build();
    }

    /** GET /api/recommendations/team  (manager view — all employees) */
    public Teamrecommendationresponse getTeamRecommendations(int month, int year) {
        List<User> employees = userRepository.findByRole(Role.EMPLOYEE);

        List<EmployeeRecommendationResponse> breakdown = employees.stream()
                .map(emp -> {
                    try {
                        return getEmployeeRecommendations(emp.getId(), month, year);
                    } catch (Exception e) {
                        log.warn("[RecommendationService] skipping employee {}: {}", emp.getId(), e.getMessage());
                        return buildEmptyEmployeeResponse(emp);
                    }
                })
                .sorted(Comparator.comparingDouble(
                        r -> Optional.ofNullable(r.getProductivityScore()).orElse(100.0)))
                .collect(Collectors.toList());

        // Team-level aggregated metrics
        double teamAvgProd = breakdown.stream()
                .mapToDouble(r -> Optional.ofNullable(r.getProductivityScore()).orElse(0.0))
                .average().orElse(0.0);
        double teamAvgAtt = breakdown.stream()
                .mapToDouble(r -> Optional.ofNullable(r.getAttendancePct()).orElse(0.0))
                .average().orElse(0.0);
        double teamAvgUtil = breakdown.stream()
                .mapToDouble(r -> Optional.ofNullable(r.getUtilizationPct()).orElse(0.0))
                .average().orElse(0.0);
        int totalPending = breakdown.stream()
                .mapToInt(r -> Optional.ofNullable(r.getPendingTasks()).orElse(0)).sum();
        int totalOverdue = breakdown.stream()
                .mapToInt(r -> Optional.ofNullable(r.getOverdueTasks()).orElse(0)).sum();

        // At-risk employees — those with any HIGH recommendation
        List<String> atRisk = breakdown.stream()
                .filter(r -> "HIGH".equals(r.getOverallPriority()))
                .map(EmployeeRecommendationResponse::getEmployeeName)
                .collect(Collectors.toList());

        // Team-level recommendations
        TeamMetrics teamMetrics = new TeamMetrics(teamAvgProd, teamAvgAtt, teamAvgUtil,
                totalPending, totalOverdue, breakdown.size());
        List<RecommendationResponse> teamRecs = generateTeamRecommendations(teamMetrics, breakdown);

        return Teamrecommendationresponse.builder()
                .month(month)
                .year(year)
                .teamAvgProductivity(round2(teamAvgProd))
                .teamAvgAttendance(round2(teamAvgAtt))
                .teamAvgUtilization(round2(teamAvgUtil))
                .totalPendingTasks(totalPending)
                .totalOverdueTasks(totalOverdue)
                .totalEmployees(employees.size())
                .teamRecommendations(teamRecs)
                .employeeBreakdown(breakdown)
                .atRiskEmployeeNames(atRisk)
                .build();
    }

    /** GET /api/recommendations/project/{projectId} */
    public List<EmployeeRecommendationResponse> getProjectRecommendations(Long projectId,
                                                                           int month, int year) {
        List<Task> projectTasks = taskRepository.findByProjectId(projectId);
        Set<Long> employeeIds = projectTasks.stream()
                .filter(t -> t.getAssignedTo() != null)
                .map(t -> t.getAssignedTo().getId())
                .collect(Collectors.toSet());

        return employeeIds.stream()
                .map(id -> {
                    try {
                        return getEmployeeRecommendations(id, month, year);
                    } catch (Exception e) {
                        log.warn("[RecommendationService] skipping employee {} in project: {}", id, e.getMessage());
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(this::sortByOverallPriority))
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════════════════════
    // EMPLOYEE RECOMMENDATION RULES
    // ════════════════════════════════════════════════════════════════════════

    private List<RecommendationResponse> generateEmployeeRecommendations(EmployeeMetrics m) {
        List<RecommendationResponse> recs = new ArrayList<>();

        // ── ATTENDANCE ────────────────────────────────────────────────────────
        if (m.attendancePct < 65) {
            recs.add(rec("Your attendance is critically low (" + fmt(m.attendancePct) + "%) — "
                    + "aim for at least 80% to avoid productivity penalties",
                    "ATTENDANCE", "HIGH", 90, 88));
        } else if (m.attendancePct < 75) {
            recs.add(rec("Attendance dropped to " + fmt(m.attendancePct) + "% this month — "
                    + "increase consistency to above 80%",
                    "ATTENDANCE", "MEDIUM", 70, 82));
        } else if (m.attendancePct < 85) {
            recs.add(rec("Good attendance (" + fmt(m.attendancePct) + "%) — "
                    + "maintain this to maximise your productivity score",
                    "CONSISTENCY", "LOW", 40, 75));
        }

        // ── PRODUCTIVITY ──────────────────────────────────────────────────────
        if (m.productivityScore < 45) {
            recs.add(rec("Productivity critically low (" + fmt(m.productivityScore) + "%) — "
                    + "identify and eliminate the top 3 time-wasting activities immediately",
                    "PRODUCTIVITY_IMPROVEMENT", "HIGH", 95, 90));
        } else if (m.productivityScore < 60) {
            recs.add(rec("Use time-blocking techniques — allocate dedicated 2-hour focus blocks "
                    + "for your highest-priority tasks daily",
                    "TIME_MANAGEMENT", "HIGH", 80, 85));
        } else if (m.productivityScore < 72) {
            recs.add(rec("Productivity at " + fmt(m.productivityScore) + "% — "
                    + "completing pending tasks before accepting new ones will push this above 75%",
                    "FOCUS", "MEDIUM", 60, 78));
        } else if (m.productivityScore >= 85) {
            recs.add(rec("Excellent productivity (" + fmt(m.productivityScore) + "%) — "
                    + "consider mentoring teammates to sustain team performance",
                    "SKILL_IMPROVEMENT", "LOW", 35, 72));
        }

        // ── OVERDUE TASKS ─────────────────────────────────────────────────────
        if (m.overdueTasks >= 5) {
            recs.add(rec(m.overdueTasks + " overdue tasks detected — "
                    + "set aside 2 dedicated hours daily to clear the backlog before any new work",
                    "TASK_PRIORITIZATION", "HIGH", 92, 91));
        } else if (m.overdueTasks >= 2) {
            recs.add(rec("Reduce overdue tasks (" + m.overdueTasks + " overdue) by 50% this week — "
                    + "focus on oldest deadlines first",
                    "DEADLINE_MANAGEMENT", "HIGH", 85, 87));
        } else if (m.overdueTasks == 1) {
            recs.add(rec("1 overdue task — clear it today before working on in-progress items",
                    "DEADLINE_MANAGEMENT", "MEDIUM", 70, 82));
        }

        // ── PENDING TASKS / WORKLOAD ───────────────────────────────────────────
        if (m.pendingTasks >= 10) {
            recs.add(rec("Heavy backlog: " + m.pendingTasks + " pending tasks — "
                    + "break them into daily achievable sub-goals and avoid accepting new assignments",
                    "WORKLOAD_BALANCING", "HIGH", 88, 84));
        } else if (m.pendingTasks >= 6) {
            recs.add(rec("Elevated pending task count (" + m.pendingTasks + ") — "
                    + "complete current assignments before taking on new ones",
                    "FOCUS", "MEDIUM", 65, 79));
        }

        // ── UTILIZATION ───────────────────────────────────────────────────────
        if (m.utilizationPct > 95) {
            recs.add(rec("Utilization critically high (" + fmt(m.utilizationPct) + "%) — "
                    + "speak with your manager about redistributing some tasks",
                    "WORKLOAD_BALANCING", "HIGH", 87, 83));
        } else if (m.utilizationPct < 45) {
            recs.add(rec("Utilization is low (" + fmt(m.utilizationPct) + "%) — "
                    + "take on additional tasks to improve your contribution score",
                    "PRODUCTIVITY_IMPROVEMENT", "MEDIUM", 60, 76));
        }

        // ── REPORT CONSISTENCY ────────────────────────────────────────────────
        if (m.reportConsistency < 50) {
            recs.add(rec("Daily work report submission rate is very low (" + fmt(m.reportConsistency) + "%) — "
                    + "reports directly impact your efficiency calculation",
                    "CONSISTENCY", "HIGH", 80, 86));
        } else if (m.reportConsistency < 70) {
            recs.add(rec("Improve report submission rate to above 80% for accurate productivity tracking",
                    "CONSISTENCY", "MEDIUM", 55, 78));
        }

        // ── AI PREDICTION INTEGRATION ─────────────────────────────────────────
        if (m.predictedProductivity != null) {
            double delta = m.predictedProductivity - m.productivityScore;
            if (delta >= 8) {
                recs.add(rec("Your productivity is projected to increase by " + fmt(delta) + "% next month — "
                        + "maintain current work habits to realise this gain",
                        "PRODUCTIVITY_IMPROVEMENT", "LOW", 50, 74));
            } else if (delta <= -8) {
                recs.add(rec("AI forecast predicts productivity decline of " + fmt(Math.abs(delta)) + "% — "
                        + "focus on task completion and attendance consistency now",
                        "PRODUCTIVITY_IMPROVEMENT", "HIGH", 88, 80));
            }
        }

        // Sort: HIGH first, then MEDIUM, then LOW — then by impactScore desc
        recs.sort(Comparator
                .comparingInt((RecommendationResponse r) -> priorityOrdinal(r.getPriority()))
                .thenComparingInt(r -> -(r.getImpactScore() != null ? r.getImpactScore() : 0)));

        return recs;
    }

    // ════════════════════════════════════════════════════════════════════════
    // TEAM-LEVEL RECOMMENDATION RULES
    // ════════════════════════════════════════════════════════════════════════

    private List<RecommendationResponse> generateTeamRecommendations(
            TeamMetrics m, List<EmployeeRecommendationResponse> breakdown) {

        List<RecommendationResponse> recs = new ArrayList<>();

        if (m.avgProductivity < 55) {
            recs.add(rec("Team productivity critically low (" + fmt(m.avgProductivity) + "%) — "
                    + "conduct a team retrospective to identify systemic blockers",
                    "PRODUCTIVITY_IMPROVEMENT", "HIGH", 95, 88));
        } else if (m.avgProductivity < 70) {
            recs.add(rec("Team productivity at " + fmt(m.avgProductivity) + "% — "
                    + "focus on workload distribution and deadline management",
                    "WORKLOAD_BALANCING", "MEDIUM", 75, 82));
        } else if (m.avgProductivity >= 80) {
            recs.add(rec("Team productivity strong (" + fmt(m.avgProductivity) + "%) — "
                    + "identify top performers and document their practices for team-wide adoption",
                    "SKILL_IMPROVEMENT", "LOW", 45, 72));
        }

        if (m.totalOverdueTasks >= 10) {
            recs.add(rec(m.totalOverdueTasks + " overdue tasks across the team — "
                    + "schedule a priority review session and redistribute critical items",
                    "DEADLINE_MANAGEMENT", "HIGH", 92, 87));
        } else if (m.totalOverdueTasks >= 4) {
            recs.add(rec(m.totalOverdueTasks + " overdue tasks detected — "
                    + "review assignment loads and deadline feasibility",
                    "DEADLINE_MANAGEMENT", "MEDIUM", 72, 80));
        }

        if (m.avgUtilization > 90) {
            recs.add(rec("Team utilization exceeds 90% — risk of burnout; "
                    + "consider redistributing tasks or adjusting deadlines",
                    "WORKLOAD_BALANCING", "HIGH", 89, 85));
        }

        if (m.avgAttendance < 70) {
            recs.add(rec("Team attendance below 70% — investigate root causes "
                    + "and review attendance policy",
                    "ATTENDANCE", "HIGH", 85, 83));
        }

        // Flag employees with HIGH-priority issues
        long highRiskCount = breakdown.stream()
                .filter(r -> "HIGH".equals(r.getOverallPriority())).count();
        if (highRiskCount > 0) {
            recs.add(rec(highRiskCount + " employee(s) have high-priority issues — "
                    + "schedule 1:1 reviews this week",
                    "FOCUS", "HIGH", 90, 86));
        }

        // Workload imbalance check
        OptionalDouble maxUtil = breakdown.stream()
                .mapToDouble(r -> Optional.ofNullable(r.getUtilizationPct()).orElse(0.0)).max();
        OptionalDouble minUtil = breakdown.stream()
                .mapToDouble(r -> Optional.ofNullable(r.getUtilizationPct()).orElse(0.0)).min();
        if (maxUtil.isPresent() && minUtil.isPresent() && (maxUtil.getAsDouble() - minUtil.getAsDouble()) > 40) {
            recs.add(rec("Workload imbalance detected — utilization range exceeds 40% across team; "
                    + "redistribute tasks from overloaded to under-utilized members",
                    "WORKLOAD_BALANCING", "MEDIUM", 78, 81));
        }

        recs.sort(Comparator
                .comparingInt((RecommendationResponse r) -> priorityOrdinal(r.getPriority()))
                .thenComparingInt(r -> -(r.getImpactScore() != null ? r.getImpactScore() : 0)));

        return recs;
    }

    // ════════════════════════════════════════════════════════════════════════
    // METRICS GATHERING — safe, never throws
    // ════════════════════════════════════════════════════════════════════════

    private EmployeeMetrics gatherMetrics(User employee, int month, int year) {
        double productivityScore = safeGetProductivity(employee.getId(), month, year);
        double attendancePct     = safeGetAttendancePct(employee.getId(), month, year);
        double utilizationPct    = safeGetUtilization(employee.getId());
        double reportConsistency = safeGetReportConsistency(employee.getId(), month, year);
        Double predictedProd     = null; // AI-3 integration point — pass in if available

        List<Task> activeTasks = safeGetActiveTasks(employee.getId());
        int pendingTasks = activeTasks.size();
        int overdueTasks = (int) activeTasks.stream()
                .filter(t -> t.getDeadline() != null
                          && t.getDeadline().isBefore(LocalDateTime.now()))
                .count();

        return new EmployeeMetrics(productivityScore, attendancePct, utilizationPct,
                reportConsistency, pendingTasks, overdueTasks, predictedProd);
    }

    private double safeGetProductivity(Long empId, int month, int year) {
        try {
            return productivityService.getEmployeeProductivity(empId, month, year).getProductivityScore();
        } catch (Exception e) {
            return 70.0;
        }
    }

    private double safeGetAttendancePct(Long empId, int month, int year) {
        try {
            var s = attendanceService.getMySummary(empId, month, year);
            return s != null ? s.getAttendanceRate() : 80.0;
        } catch (Exception e) {
            return 80.0;
        }
    }

    private double safeGetUtilization(Long empId) {
        try {
            return Math.min(110.0, (taskRepository.findActiveTasks(empId).size() / 8.0) * 100.0);
        } catch (Exception e) {
            return 70.0;
        }
    }

    private double safeGetReportConsistency(Long empId, int month, int year) {
        try {
            return attendanceService.getAttendanceConsistencyScore(empId, month, year);
        } catch (Exception e) {
            return 80.0;
        }
    }

    private List<Task> safeGetActiveTasks(Long empId) {
        try {
            return taskRepository.findActiveTasks(empId);
        } catch (Exception e) {
            return List.of();
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // FACTORY + HELPERS
    // ════════════════════════════════════════════════════════════════════════

    private RecommendationResponse rec(String message, String category,
                                        String priority, int impact, int confidence) {
        return RecommendationResponse.builder()
                .message(message)
                .category(category)
                .priority(priority)
                .impactScore(impact)
                .confidence(confidence)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    private int priorityOrdinal(String priority) {
        return switch (priority != null ? priority : "LOW") {
            case "HIGH"   -> 0;
            case "MEDIUM" -> 1;
            default       -> 2;
        };
    }

    private int sortByOverallPriority(EmployeeRecommendationResponse r) {
        return priorityOrdinal(r.getOverallPriority());
    }

    private String fmt(double val) {
        return String.valueOf((int) Math.round(val));
    }

    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }

    private EmployeeRecommendationResponse buildEmptyEmployeeResponse(User emp) {
        return EmployeeRecommendationResponse.builder()
                .employeeId(emp.getId())
                .employeeName(emp.getFullName())
                .department(emp.getDepartment())
                .recommendations(List.of())
                .totalRecommendations(0)
                .overallPriority("LOW")
                .build();
    }

    // ── Internal records ──────────────────────────────────────────────────────

    private record EmployeeMetrics(
            double productivityScore,
            double attendancePct,
            double utilizationPct,
            double reportConsistency,
            int pendingTasks,
            int overdueTasks,
            Double predictedProductivity
    ) {}

    private record TeamMetrics(
            double avgProductivity,
            double avgAttendance,
            double avgUtilization,
            int totalPendingTasks,
            int totalOverdueTasks,
            int employeeCount
    ) {}
}