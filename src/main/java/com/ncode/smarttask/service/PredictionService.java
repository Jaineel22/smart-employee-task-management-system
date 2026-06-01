package com.ncode.smarttask.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ncode.smarttask.dto.PredictionRequest;
import com.ncode.smarttask.dto.PredictionResponse;
import com.ncode.smarttask.entity.DailyWorkReport;
import com.ncode.smarttask.entity.Task;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.enums.Role;
import com.ncode.smarttask.enums.TaskStatus;
import com.ncode.smarttask.repository.DailyWorkReportRepository;
import com.ncode.smarttask.repository.TaskRepository;
import com.ncode.smarttask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * PredictionService.java
 * ======================
 * Orchestrates the full AI prediction pipeline:
 *   1. Extracts 12 ML features from existing MySQL tables (read-only)
 *   2. Calls Python FastAPI POST /predict-productivity
 *   3. Enriches the response with employee identity fields
 *   4. Returns graceful fallback if Python service is unreachable
 *
 * SAFETY GUARANTEES:
 *   ✅ Never modifies any existing table
 *   ✅ Never throws 500 — always returns a valid response
 *   ✅ Zero changes to existing service logic
 *   ✅ Uses existing repositories only — no new DB dependencies
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PredictionService {

    private final TaskRepository            taskRepository;
    private final DailyWorkReportRepository reportRepository;
    private final ProductivityService       productivityService;
    private final AttendanceService         attendanceService;
    private final UserRepository            userRepository;

    @Value("${ai.engine.url:http://localhost:8000}")
    private String aiEngineUrl;

    // HttpClient is thread-safe and reused across calls
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /* ═══════════════════════════════════════════════════════════
       PUBLIC API
    ═══════════════════════════════════════════════════════════ */

    /**
     * GET /api/predictions/me  and  GET /api/predictions/employee/{id}
     * Single employee prediction — enriched with identity fields.
     */
    public PredictionResponse getPrediction(Long employeeId, int month, int year) {
        User employee = userRepository.findById(employeeId).orElse(null);

        // Extract current productivity for trendDelta enrichment
        double currentScore = safeGetCurrentProductivity(employeeId, month, year);

        try {
            PredictionRequest features = extractFeatures(employeeId, month, year, currentScore);
            PredictionResponse rawResponse = callPythonService(features);

            // Enrich raw Python response with employee identity
            return enrich(rawResponse, employeeId,
                    employee != null ? employee.getFullName() : "Employee #" + employeeId,
                    currentScore);

        } catch (java.net.ConnectException e) {
            log.warn("[PredictionService] AI engine unreachable at {}. " +
                     "Start: cd ai-engine && uvicorn app:app --port 8000", aiEngineUrl);
            return buildUnavailableResponse(employeeId,
                    employee != null ? employee.getFullName() : "Employee #" + employeeId,
                    currentScore,
                    "AI prediction service is not running. " +
                    "Start it with: uvicorn app:app --host 0.0.0.0 --port 8000");

        } catch (Exception e) {
            log.error("[PredictionService] Error for employee {}: {}", employeeId, e.getMessage(), e);
            return buildUnavailableResponse(employeeId,
                    employee != null ? employee.getFullName() : "Employee #" + employeeId,
                    currentScore,
                    "Prediction temporarily unavailable: " + e.getMessage());
        }
    }

    /**
     * GET /api/predictions/team
     * Returns predictions for ALL employees.
     * Runs predictions in sequence (safe for small teams).
     * For large teams (50+), consider async batching in a future phase.
     */
    public List<PredictionResponse> getTeamPredictions(int month, int year) {
        List<User> employees = userRepository.findByRole(Role.EMPLOYEE);
        List<PredictionResponse> results = new ArrayList<>();

        for (User emp : employees) {
            try {
                PredictionResponse prediction = getPrediction(emp.getId(), month, year);
                results.add(prediction);
            } catch (Exception e) {
                // Never let one failed employee break the whole team response
                log.warn("[PredictionService] Skipping employee {} due to error: {}",
                        emp.getId(), e.getMessage());
                results.add(buildUnavailableResponse(emp.getId(), emp.getFullName(), 0.0,
                        "Individual prediction unavailable"));
            }
        }

        log.info("[PredictionService] Team predictions: {} employees processed for {}/{}",
                results.size(), month, year);
        return results;
    }

    /**
     * GET /api/predictions/health
     * Checks if FastAPI service is reachable and model is loaded.
     */
    public boolean isAiServiceReachable() {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(aiEngineUrl + "/health"))
                    .GET()
                    .timeout(Duration.ofSeconds(3))
                    .build();
            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            return res.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    /* ═══════════════════════════════════════════════════════════
       PRIVATE: PYTHON SERVICE CALL
    ═══════════════════════════════════════════════════════════ */

    private PredictionResponse callPythonService(PredictionRequest features) throws Exception {
        String requestBody = objectMapper.writeValueAsString(features);
        log.debug("[PredictionService] Sending to AI engine: {}", requestBody);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(aiEngineUrl + "/predict-productivity"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .timeout(Duration.ofSeconds(10))
                .build();

        HttpResponse<String> response = httpClient.send(
                httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.warn("[PredictionService] AI engine HTTP {}: {}",
                    response.statusCode(), response.body());
            throw new RuntimeException("AI engine returned HTTP " + response.statusCode());
        }

        // Parse the raw Python response (which has different field names)
        var rawMap = objectMapper.readValue(response.body(), java.util.Map.class);
        
        // Convert raw Python response to PredictionResponse
        return convertFromPythonResponse(rawMap);
    }

    /* ═══════════════════════════════════════════════════════════
       PRIVATE: CONVERT PYTHON RESPONSE TO DTO
    ═══════════════════════════════════════════════════════════ */

    @SuppressWarnings("unchecked")
    private PredictionResponse convertFromPythonResponse(java.util.Map<String, Object> rawMap) {
        double predictedScore = ((Number) rawMap.getOrDefault("predicted_productivity_score", 50.0)).doubleValue();
        var confidenceInterval = (java.util.List<Double>) rawMap.getOrDefault("confidence_interval", List.of(predictedScore - 5, predictedScore + 5));
        var contributingFactors = (java.util.Map<String, Double>) rawMap.getOrDefault("contributing_factors", java.util.Map.of());
        var recommendations = (java.util.List<String>) rawMap.getOrDefault("recommendations", List.of());

        // Calculate confidence as the width of confidence interval
        double confidence = (confidenceInterval.get(1) - confidenceInterval.get(0)) / 2;

        return PredictionResponse.builder()
                .predictedProductivity(round2(predictedScore))
                .confidence(round2(confidence))
                .performanceLabel(resolveLabel(predictedScore))
                .summary(generateSummary(predictedScore, contributingFactors))
                .reasons(generateReasons(contributingFactors))
                .warnings(generateWarnings(contributingFactors))
                .suggestion(recommendations.isEmpty() ? generateSuggestion(contributingFactors) : recommendations.get(0))
                .modelAvailable(true)
                .build();
    }

    /* ═══════════════════════════════════════════════════════════
       PRIVATE: FEATURE EXTRACTION
       All queries are read-only SELECT — zero side effects
    ═══════════════════════════════════════════════════════════ */

    private PredictionRequest extractFeatures(Long employeeId, int month, int year,
                                              double currentProductivity) {
        LocalDate startDate    = LocalDate.of(year, month, 1);
        LocalDate endDate      = startDate.withDayOfMonth(startDate.lengthOfMonth());
        LocalDate today        = LocalDate.now();
        LocalDate effectiveEnd = endDate.isAfter(today) ? today : endDate;

        // ── 1. Attendance Percentage ──────────────────────────────────────
        double attendancePct = safeGetAttendancePct(employeeId, month, year);

        // ── 2. Total Hours Worked ─────────────────────────────────────────
        double totalHours = safeGetHoursWorked(employeeId, startDate, effectiveEnd);

        // ── 3–9. Task-based features ──────────────────────────────────────
        List<Task> allTasks = taskRepository.findByAssignedToId(employeeId)
                .stream()
                .filter(t -> t.getCreatedAt() == null
                          || !t.getCreatedAt().toLocalDate().isAfter(endDate))
                .collect(Collectors.toList());

        long completedTasks = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();

        long pendingTasks = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.PENDING
                          || t.getStatus() == TaskStatus.IN_PROGRESS).count();

        double avgProgress = allTasks.stream()
                .mapToInt(t -> t.getCompletionPercentage() != null
                             ? t.getCompletionPercentage() : 0)
                .average().orElse(0.0);

        long overdueTasks = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.OVERDUE).count();

        long lateTaskCount = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED
                          && t.getDeadline() != null
                          && t.getCompletedAt() != null
                          && t.getCompletedAt().isAfter(t.getDeadline())).count();

        double avgCompletionTime = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED
                          && t.getCompletedAt() != null
                          && t.getCreatedAt() != null)
                .mapToDouble(t -> ChronoUnit.DAYS.between(
                        t.getCreatedAt().toLocalDate(),
                        t.getCompletedAt().toLocalDate()))
                .average().orElse(5.0);

        // ── 10. Reports Submitted ─────────────────────────────────────────
        long reportsSubmitted = safeGetReportsCount(employeeId, startDate, effectiveEnd);

        // ── 11. Deadline Discipline ───────────────────────────────────────
        double deadlineDiscipline = calcDeadlineDiscipline(allTasks);

        // ── 12. Attendance Consistency ────────────────────────────────────
        double attendanceConsistency = safeGetConsistencyScore(employeeId, month, year,
                attendancePct);

        return PredictionRequest.builder()
                .attendancePercentage(round2(attendancePct))
                .totalHoursWorked(round2(totalHours))
                .completedTasks((double) completedTasks)
                .pendingTasks((double) Math.min(pendingTasks, 30))
                .averageTaskProgress(round2(avgProgress))
                .lateTaskCount((double) lateTaskCount)
                .reportsSubmitted((double) reportsSubmitted)
                .deadlineDisciplineScore(round2(deadlineDiscipline))
                .attendanceConsistency(round2(attendanceConsistency))
                .monthlyProductivityScore(round2(currentProductivity))
                .overdueTasks((double) overdueTasks)
                .avgTaskCompletionTime(round2(avgCompletionTime))
                .build();
    }

    /* ═══════════════════════════════════════════════════════════
       PRIVATE: SAFE HELPER METHODS
       Each method swallows its own exceptions and returns a
       sensible neutral default — prediction never crashes
    ═══════════════════════════════════════════════════════════ */

    private double safeGetCurrentProductivity(Long employeeId, int month, int year) {
        try {
            return productivityService
                    .getEmployeeProductivity(employeeId, month, year)
                    .getProductivityScore();
        } catch (Exception e) {
            log.debug("[PredictionService] Could not get productivity for {}: {}", employeeId, e.getMessage());
            return 70.0; // neutral default
        }
    }

    // FIXED: Removed null check on primitive double
    private double safeGetAttendancePct(Long employeeId, int month, int year) {
        try {
            var summary = attendanceService.getMySummary(employeeId, month, year);
            if (summary != null) {
                return summary.getAttendanceRate(); // double primitive cannot be null
            }
            return 80.0;
        } catch (Exception e) {
            log.debug("[PredictionService] Could not get attendance for {}: {}", employeeId, e.getMessage());
            return 80.0;
        }
    }

    // FIXED: Using existing repository method findByUserIdAndReportDateBetween
    private double safeGetHoursWorked(Long employeeId, LocalDate from, LocalDate to) {
        try {
            List<DailyWorkReport> reports = reportRepository.findByUserIdAndReportDateBetween(employeeId, from, to);
            double totalHours = reports.stream()
                    .mapToDouble(r -> r.getHoursWorked() != null ? r.getHoursWorked() : 0.0)
                    .sum();
            return totalHours;
        } catch (Exception e) {
            log.debug("[PredictionService] Could not get hours for {}: {}", employeeId, e.getMessage());
            return 0.0;
        }
    }

    private long safeGetReportsCount(Long employeeId, LocalDate from, LocalDate to) {
        try {
            return reportRepository.findByUserIdAndReportDateBetween(employeeId, from, to).size();
        } catch (Exception e) {
            return 0L;
        }
    }

    private double safeGetConsistencyScore(Long employeeId, int month, int year,
                                            double fallback) {
        try {
            return attendanceService.getAttendanceConsistencyScore(employeeId, month, year);
        } catch (Exception e) {
            return fallback;
        }
    }

    private double calcDeadlineDiscipline(List<Task> tasks) {
        List<Task> completedWithDeadline = tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED
                          && t.getDeadline() != null
                          && t.getCompletedAt() != null)
                .collect(Collectors.toList());

        if (completedWithDeadline.isEmpty()) return 100.0;

        long onTime = completedWithDeadline.stream()
                .filter(t -> !t.getCompletedAt().isAfter(t.getDeadline())).count();
        return (onTime / (double) completedWithDeadline.size()) * 100.0;
    }

    /* ═══════════════════════════════════════════════════════════
       PRIVATE: RESPONSE ENRICHMENT
    ═══════════════════════════════════════════════════════════ */

    /**
     * Adds employee identity + currentProductivity to the raw Python response.
     * The Python service doesn't know who the employee is — Spring Boot enriches it.
     */
    private PredictionResponse enrich(PredictionResponse raw,
                                      Long employeeId,
                                      String employeeName,
                                      double currentScore) {
        double predictedScore = raw.getPredictedProductivity();
        double trendDeltaValue = predictedScore - currentScore;
        String trendStatus = trendDeltaValue > 5 ? "IMPROVING" : (trendDeltaValue < -5 ? "DECLINING" : "STABLE");
        
        raw.setEmployeeId(employeeId);
        raw.setEmployeeName(employeeName);
        raw.setCurrentProductivity(round2(currentScore));
        raw.setTrendDelta(round2(trendDeltaValue));
        raw.setTrend(trendStatus);
        raw.setModelAvailable(true);
        return raw;
    }

    /**
     * Graceful offline/error fallback — never throws, always returns valid data.
     * Frontend shows amber "AI Offline" banner when modelAvailable=false.
     */
    private PredictionResponse buildUnavailableResponse(Long employeeId,
                                                         String employeeName,
                                                         double currentScore,
                                                         String message) {
        // Rule-based estimate: current score ± small adjustment
        double estimated = Math.min(100, Math.max(40, currentScore));
        String trendStatus = "UNKNOWN";

        return PredictionResponse.builder()
                .employeeId(employeeId)
                .employeeName(employeeName)
                .currentProductivity(round2(currentScore))
                .predictedProductivity(round2(estimated))
                .confidence(30.0)
                .performanceLabel(resolveLabel(estimated))
                .trendDelta(0.0)
                .trend(trendStatus)
                .summary("AI service unavailable. Showing estimated productivity based on current data.")
                .reasons(List.of())
                .warnings(List.of("AI prediction engine is currently offline.", message))
                .suggestion("Start the AI engine: cd ai-engine && uvicorn app:app --host 0.0.0.0 --port 8000")
                .modelAvailable(false)
                .build();
    }

    private String resolveLabel(double score) {
        if (score >= 90) return "Outstanding";
        if (score >= 75) return "Excellent";
        if (score >= 60) return "Good";
        if (score >= 40) return "Needs Improvement";
        return "Low Productivity";
    }

    private String generateSummary(double score, java.util.Map<String, Double> factors) {
        if (score >= 85) return "Excellent performance predicted for next month!";
        if (score >= 70) return "Solid performance expected. Maintain current momentum.";
        if (score >= 55) return "Average productivity expected. Room for improvement.";
        if (score >= 40) return "Below average expected. Focus on completing pending tasks.";
        return "Low productivity expected. Immediate attention needed.";
    }

    private List<String> generateReasons(java.util.Map<String, Double> factors) {
        List<String> reasons = new ArrayList<>();
        Double completion = factors.get("task_completion_rate");
        if (completion != null && completion > 75) {
            reasons.add("High task completion rate (" + completion.intValue() + "%)");
        }
        Double onTime = factors.get("on_time_rate");
        if (onTime != null && onTime > 80) {
            reasons.add("Good deadline management (" + onTime.intValue() + "% on-time)");
        }
        Double hours = factors.get("hours_utilization");
        if (hours != null && hours > 85) {
            reasons.add("Consistent work hours utilization");
        }
        Double progress = factors.get("avg_progress");
        if (progress != null && progress > 70) {
            reasons.add("Strong average task progress");
        }
        if (reasons.isEmpty()) {
            reasons.add("Focus on completing assigned tasks");
        }
        return reasons;
    }

    private List<String> generateWarnings(java.util.Map<String, Double> factors) {
        List<String> warnings = new ArrayList<>();
        Double completion = factors.get("task_completion_rate");
        if (completion != null && completion < 50) {
            warnings.add("Low task completion rate (" + completion.intValue() + "%)");
        }
        Double onTime = factors.get("on_time_rate");
        if (onTime != null && onTime < 60) {
            warnings.add("Frequent deadline misses");
        }
        Double hours = factors.get("hours_utilization");
        if (hours != null && hours < 50) {
            warnings.add("Insufficient work hours");
        }
        return warnings;
    }

    private String generateSuggestion(java.util.Map<String, Double> factors) {
        Double completion = factors.get("task_completion_rate");
        if (completion != null && completion < 60) {
            return "Prioritize completing pending tasks to improve your score";
        }
        Double onTime = factors.get("on_time_rate");
        if (onTime != null && onTime < 70) {
            return "Focus on meeting deadlines by planning tasks better";
        }
        Double hours = factors.get("hours_utilization");
        if (hours != null && hours < 60) {
            return "Maintain consistent working hours to increase productivity";
        }
        return "Keep up the good work! Maintain your current momentum";
    }

    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}