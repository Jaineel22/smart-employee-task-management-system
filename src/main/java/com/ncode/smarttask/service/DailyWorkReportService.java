package com.ncode.smarttask.service;

import com.ncode.smarttask.dto.ActivityReportResponse;
import com.ncode.smarttask.dto.CreateDailyWorkReportRequest;
import com.ncode.smarttask.dto.UpdateDailyWorkReportRequest;
import com.ncode.smarttask.entity.DailyWorkReport;
import com.ncode.smarttask.entity.Task;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.repository.DailyWorkReportRepository;
import com.ncode.smarttask.repository.TaskRepository;
import com.ncode.smarttask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DailyWorkReportService — extended with Activity Intelligence.
 *
 * All existing public methods are preserved with identical signatures.
 * New methods (activity view, insights) are purely additive.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DailyWorkReportService {

    private final DailyWorkReportRepository dailyWorkReportRepository;
    private final UserRepository            userRepository;
    private final TaskRepository            taskRepository;

    // ════════════════════════════════════════════════════════════════════════
    // EXISTING METHODS — unchanged signatures, enhanced implementation
    // ════════════════════════════════════════════════════════════════════════

    public DailyWorkReport createReport(CreateDailyWorkReportRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getUserId()));

        Task task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + request.getTaskId()));

        if (request.getHoursWorked() == null || request.getHoursWorked() <= 0) {
            throw new RuntimeException("Hours worked must be greater than 0");
        }

        if (request.getCompletionPercentage() != null &&
                (request.getCompletionPercentage() < 0 || request.getCompletionPercentage() > 100)) {
            throw new RuntimeException("Completion percentage must be between 0 and 100");
        }

        if (request.getProgressPercentage() != null &&
                (request.getProgressPercentage() < 0 || request.getProgressPercentage() > 100)) {
            throw new RuntimeException("Progress percentage must be between 0 and 100");
        }

        // Prevent duplicate: one report per user per task per day
        dailyWorkReportRepository
                .findByUserIdAndTaskIdAndReportDate(
                        request.getUserId(), request.getTaskId(), request.getReportDate())
                .ifPresent(existing -> {
                    throw new RuntimeException(
                            "A report for this task on " + request.getReportDate()
                            + " already exists for this user");
                });

        DailyWorkReport report = DailyWorkReport.builder()
                // ── existing fields ──
                .workDescription(request.getWorkDescription())
                .hoursWorked(request.getHoursWorked())
                .completionPercentage(
                        request.getCompletionPercentage() != null ? request.getCompletionPercentage() : 0)
                .reportDate(request.getReportDate())
                .user(user)
                .task(task)
                // ── new activity intelligence fields ──
                .taskWorkedOn(request.getTaskWorkedOn())
                .detailedWorkSummary(request.getDetailedWorkSummary())
                .technologiesUsed(request.getTechnologiesUsed())
                .completedActivities(request.getCompletedActivities())
                .pendingActivities(request.getPendingActivities())
                .tomorrowPlan(request.getTomorrowPlan())
                .blockers(request.getBlockers())
                .progressPercentage(
                        request.getProgressPercentage() != null ? request.getProgressPercentage() : 0)
                .build();

        return dailyWorkReportRepository.save(report);
    }

    public List<DailyWorkReport> getAllReports() {
        return dailyWorkReportRepository.findAll();
    }

    public DailyWorkReport getReportById(Long id) {
        return dailyWorkReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found with id: " + id));
    }

    public List<DailyWorkReport> getReportsByUser(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return dailyWorkReportRepository.findByUserId(userId);
    }

    public List<DailyWorkReport> getReportsByDate(LocalDate date) {
        return dailyWorkReportRepository.findByReportDate(date);
    }

    public DailyWorkReport updateReport(Long id, UpdateDailyWorkReportRequest request) {
        DailyWorkReport report = getReportById(id);

        // ── existing fields ────────────────────────────────────────────────
        if (request.getWorkDescription() != null) {
            report.setWorkDescription(request.getWorkDescription());
        }
        if (request.getHoursWorked() != null) {
            if (request.getHoursWorked() <= 0) {
                throw new RuntimeException("Hours worked must be greater than 0");
            }
            report.setHoursWorked(request.getHoursWorked());
        }
        if (request.getCompletionPercentage() != null) {
            if (request.getCompletionPercentage() < 0 || request.getCompletionPercentage() > 100) {
                throw new RuntimeException("Completion percentage must be between 0 and 100");
            }
            report.setCompletionPercentage(request.getCompletionPercentage());
        }

        // ── new activity fields ────────────────────────────────────────────
        if (request.getTaskWorkedOn() != null) {
            report.setTaskWorkedOn(request.getTaskWorkedOn());
        }
        if (request.getDetailedWorkSummary() != null) {
            report.setDetailedWorkSummary(request.getDetailedWorkSummary());
        }
        if (request.getTechnologiesUsed() != null) {
            report.setTechnologiesUsed(request.getTechnologiesUsed());
        }
        if (request.getCompletedActivities() != null) {
            report.setCompletedActivities(request.getCompletedActivities());
        }
        if (request.getPendingActivities() != null) {
            report.setPendingActivities(request.getPendingActivities());
        }
        if (request.getTomorrowPlan() != null) {
            report.setTomorrowPlan(request.getTomorrowPlan());
        }
        if (request.getBlockers() != null) {
            report.setBlockers(request.getBlockers());
        }
        if (request.getProgressPercentage() != null) {
            if (request.getProgressPercentage() < 0 || request.getProgressPercentage() > 100) {
                throw new RuntimeException("Progress percentage must be between 0 and 100");
            }
            report.setProgressPercentage(request.getProgressPercentage());
        }

        return dailyWorkReportRepository.save(report);
    }

    public void deleteReport(Long id) {
        DailyWorkReport report = getReportById(id);
        dailyWorkReportRepository.delete(report);
    }

    // ════════════════════════════════════════════════════════════════════════
    // NEW: Activity Intelligence methods
    // ════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/reports/activity/user/{userId}
     * Returns enriched ActivityReportResponse list for one employee,
     * ordered newest first, with AI insights generated per report.
     */
    public List<ActivityReportResponse> getActivityReportsByUser(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        return dailyWorkReportRepository.findByUserId(userId).stream()
                .map(this::toActivityResponse)
                .collect(Collectors.toList());
    }

    /**
     * GET /api/reports/activity
     * Returns enriched activity reports for ALL employees — manager view.
     */
    public List<ActivityReportResponse> getAllActivityReports() {
        return dailyWorkReportRepository.findAll().stream()
                .map(this::toActivityResponse)
                .collect(Collectors.toList());
    }

    /**
     * GET /api/reports/activity/date/{date}
     * Returns all activity reports for a specific date — manager daily view.
     */
    public List<ActivityReportResponse> getActivityReportsByDate(LocalDate date) {
        return dailyWorkReportRepository.findByReportDate(date).stream()
                .map(this::toActivityResponse)
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ════════════════════════════════════════════════════════════════════════

    /** Map DailyWorkReport entity → ActivityReportResponse with insights */
    private ActivityReportResponse toActivityResponse(DailyWorkReport r) {
        User emp = r.getUser();

        List<String> technologyTags = parseTags(r.getTechnologiesUsed());
        List<String> insights       = generateInsights(r, technologyTags);

        return ActivityReportResponse.builder()
                .reportId(r.getId())
                .employeeId(emp != null ? emp.getId() : null)
                .employeeName(emp != null ? emp.getFullName() : "Unknown")
                .department(emp != null ? emp.getDepartment() : null)
                .taskId(r.getTask() != null ? r.getTask().getId() : null)
                .taskTitle(r.getTask() != null ? r.getTask().getTitle() : null)
                .taskWorkedOn(r.getTaskWorkedOn())
                .detailedWorkSummary(r.getDetailedWorkSummary())
                .technologiesUsed(r.getTechnologiesUsed())
                .completedActivities(r.getCompletedActivities())
                .pendingActivities(r.getPendingActivities())
                .tomorrowPlan(r.getTomorrowPlan())
                .blockers(r.getBlockers())
                .hasBlockers(r.getBlockers() != null && !r.getBlockers().isBlank())
                .hoursWorked(r.getHoursWorked())
                .completionPercentage(r.getCompletionPercentage())
                .progressPercentage(r.getProgressPercentage())
                .reportDate(r.getReportDate())
                .createdAt(r.getCreatedAt())
                .aiInsights(insights)
                .technologyTags(technologyTags)
                .build();
    }

    /** Parse "HTML5, CSS3, Bootstrap" → ["HTML5", "CSS3", "Bootstrap"] */
    private List<String> parseTags(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split("[,;]"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
    }

    /**
     * Generate rule-based AI insights from the report.
     * These are displayed on the manager's Activity Intelligence Dashboard.
     */
    private List<String> generateInsights(DailyWorkReport r, List<String> techTags) {
        List<String> insights = new ArrayList<>();

        String empName = r.getUser() != null ? r.getUser().getFullName().split(" ")[0] : "Employee";
        String taskName = r.getTaskWorkedOn() != null ? r.getTaskWorkedOn()
                        : (r.getTask() != null ? r.getTask().getTitle() : "the task");

        // Hours insight
        if (r.getHoursWorked() != null) {
            if (r.getHoursWorked() >= 8) {
                insights.add(empName + " logged " + r.getHoursWorked() + " hours on " + taskName + " — full day commitment.");
            } else if (r.getHoursWorked() >= 5) {
                insights.add(empName + " spent " + r.getHoursWorked() + " hours on " + taskName + ".");
            } else {
                insights.add(empName + " logged " + r.getHoursWorked() + " hours — partial day on " + taskName + ".");
            }
        }

        // Technology insight
        if (!techTags.isEmpty()) {
            String techStr = techTags.size() == 1
                    ? techTags.get(0)
                    : String.join(", ", techTags.subList(0, techTags.size() - 1))
                      + " and " + techTags.get(techTags.size() - 1);
            insights.add("Technology focus: " + techStr + ".");
        }

        // Progress insight
        if (r.getProgressPercentage() != null && r.getProgressPercentage() > 0) {
            if (r.getProgressPercentage() >= 20) {
                insights.add("Strong session progress of " + r.getProgressPercentage()
                        + "% reported — task advancing well.");
            } else {
                insights.add("Progress this session: " + r.getProgressPercentage() + "%.");
            }
        }

        // Blockers insight
        if (r.getBlockers() != null && !r.getBlockers().isBlank()) {
            insights.add("⚠ Blocker reported: " + r.getBlockers().trim() + " — manager attention may be needed.");
        }

        // Pending insight
        if (r.getPendingActivities() != null && !r.getPendingActivities().isBlank()) {
            insights.add("Remaining work identified — continuation expected tomorrow.");
        }

        // Tomorrow plan insight
        if (r.getTomorrowPlan() != null && !r.getTomorrowPlan().isBlank()) {
            insights.add("Tomorrow: " + r.getTomorrowPlan().trim());
        }

        return insights;
    }
}