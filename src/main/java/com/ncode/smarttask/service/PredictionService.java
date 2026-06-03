package com.ncode.smarttask.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonInclude;
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

import jakarta.annotation.PostConstruct;  // ✅ Fixed: Use jakarta instead of javax
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

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        // Configure ObjectMapper to include null values
        objectMapper.setSerializationInclusion(JsonInclude.Include.ALWAYS);
        log.info("✅ PredictionService initialized with ObjectMapper configuration");
    }

    public PredictionResponse getPrediction(Long employeeId, int month, int year) {
        User employee = userRepository.findById(employeeId).orElse(null);
        double currentScore = safeGetCurrentProductivity(employeeId, month, year);

        try {
            PredictionRequest features = extractFeatures(employeeId, month, year, currentScore);
            PredictionResponse rawResponse = callPythonService(features);

            return enrich(rawResponse, employeeId,
                    employee != null ? employee.getFullName() : "Employee #" + employeeId,
                    currentScore);

        } catch (java.net.ConnectException e) {
            log.warn("[PredictionService] AI engine unreachable at {}.", aiEngineUrl);
            return buildUnavailableResponse(employeeId,
                    employee != null ? employee.getFullName() : "Employee #" + employeeId,
                    currentScore,
                    "AI prediction service is not running.");

        } catch (Exception e) {
            log.error("[PredictionService] Error for employee {}: {}", employeeId, e.getMessage(), e);
            return buildUnavailableResponse(employeeId,
                    employee != null ? employee.getFullName() : "Employee #" + employeeId,
                    currentScore,
                    "Prediction temporarily unavailable: " + e.getMessage());
        }
    }

    public List<PredictionResponse> getTeamPredictions(int month, int year) {
        List<User> employees = userRepository.findByRole(Role.EMPLOYEE);
        List<PredictionResponse> results = new ArrayList<>();

        for (User emp : employees) {
            try {
                PredictionResponse prediction = getPrediction(emp.getId(), month, year);
                results.add(prediction);
            } catch (Exception e) {
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

    // ✅ UPDATED: Enhanced error logging with null and empty body checks
    private PredictionResponse callPythonService(PredictionRequest features) throws Exception {
        // Make sure features is not null
        if (features == null) {
            log.error("❌ PredictionRequest features is null!");
            throw new RuntimeException("PredictionRequest features cannot be null");
        }
        
        String requestBody = objectMapper.writeValueAsString(features);
        log.info("📤 Sending to AI Engine: {}", requestBody);
        
        // Verify requestBody is not empty
        if (requestBody == null || requestBody.isEmpty() || requestBody.equals("{}")) {
            log.error("❌ Request body is empty! Features: {}", features);
            throw new RuntimeException("Request body is empty");
        }

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(aiEngineUrl + "/predict-productivity"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .timeout(Duration.ofSeconds(10))
                .build();

        HttpResponse<String> response = httpClient.send(
                httpRequest, HttpResponse.BodyHandlers.ofString());

        log.info("📥 AI Engine Response Status: {}, Body: {}", response.statusCode(), response.body());

        if (response.statusCode() != 200) {
            log.error("❌ AI Engine Error {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("AI engine returned HTTP " + response.statusCode() + " body=" + response.body());
        }

        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> rawMap = objectMapper.readValue(response.body(), java.util.Map.class);
        return convertFromPythonResponse(rawMap);
    }

    @SuppressWarnings("unchecked")
    private PredictionResponse convertFromPythonResponse(java.util.Map<String, Object> rawMap) {
        double predictedScore = ((Number) rawMap.getOrDefault("predicted_productivity_score", 50.0)).doubleValue();
        var confidenceInterval = (java.util.List<Double>) rawMap.getOrDefault("confidence_interval", List.of(predictedScore - 5, predictedScore + 5));
        var contributingFactors = (java.util.Map<String, Double>) rawMap.getOrDefault("contributing_factors", java.util.Map.of());
        var recommendations = (java.util.List<String>) rawMap.getOrDefault("recommendations", List.of());

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

    private PredictionRequest extractFeatures(Long employeeId, int month, int year,
                                              double currentProductivity) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        LocalDate today = LocalDate.now();
        LocalDate effectiveEnd = endDate.isAfter(today) ? today : endDate;

        List<Task> allTasks = taskRepository.findByAssignedToId(employeeId)
                .stream()
                .filter(t -> t.getCreatedAt() == null
                          || !t.getCreatedAt().toLocalDate().isAfter(endDate))
                .collect(Collectors.toList());

        long totalTasksAssigned = allTasks.size();
        long completedTasks = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
        
        double avgProgress = allTasks.stream()
                .mapToInt(t -> t.getCompletionPercentage() != null ? t.getCompletionPercentage() : 0)
                .average().orElse(0.0);
        
        double onTimeRate = calculateOnTimeRate(allTasks);
        double totalHours = safeGetHoursWorked(employeeId, startDate, effectiveEnd);
        double expectedHours = 176.0;

        log.info("📊 Extracted features for employee {}: totalTasks={}, completed={}, avgProgress={}%, onTimeRate={}%, hours={}/{}",
                employeeId, totalTasksAssigned, completedTasks, avgProgress, onTimeRate, totalHours, expectedHours);

        PredictionRequest request = PredictionRequest.builder()
                .employeeId(employeeId.intValue())
                .month(month)
                .year(year)
                .totalTasksAssigned((int) totalTasksAssigned)
                .totalTasksCompleted((int) completedTasks)
                .avgCompletionPercentage(round2(avgProgress))
                .onTimeCompletionRate(round2(onTimeRate))
                .totalHoursWorked(round2(totalHours))
                .expectedHours(expectedHours)
                .avgTaskProgress(round2(avgProgress))
                .build();
        
        // ✅ ADDED LOG to verify built object
        log.info("✅ Built PredictionRequest: employeeId={}, month={}, year={}, totalTasks={}, completedTasks={}, avgProgress={}, onTimeRate={}, hours={}, expected={}",
                request.getEmployeeId(), request.getMonth(), request.getYear(),
                request.getTotalTasksAssigned(), request.getTotalTasksCompleted(),
                request.getAvgCompletionPercentage(), request.getOnTimeCompletionRate(),
                request.getTotalHoursWorked(), request.getExpectedHours());
        
        return request;
    }

    private double calculateOnTimeRate(List<Task> tasks) {
        List<Task> completedWithDeadline = tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED
                          && t.getDeadline() != null
                          && t.getCompletedAt() != null)
                .collect(Collectors.toList());

        if (completedWithDeadline.isEmpty()) {
            return 100.0;
        }

        long onTime = completedWithDeadline.stream()
                .filter(t -> !t.getCompletedAt().isAfter(t.getDeadline()))
                .count();
        
        return (onTime / (double) completedWithDeadline.size()) * 100.0;
    }

    private double safeGetCurrentProductivity(Long employeeId, int month, int year) {
        try {
            return productivityService
                    .getEmployeeProductivity(employeeId, month, year)
                    .getProductivityScore();
        } catch (Exception e) {
            log.debug("[PredictionService] Could not get productivity for {}: {}", employeeId, e.getMessage());
            return 70.0;
        }
    }

    private double safeGetAttendancePct(Long employeeId, int month, int year) {
        try {
            var summary = attendanceService.getMySummary(employeeId, month, year);
            if (summary != null) {
                return summary.getAttendanceRate();
            }
            return 80.0;
        } catch (Exception e) {
            log.debug("[PredictionService] Could not get attendance for {}: {}", employeeId, e.getMessage());
            return 80.0;
        }
    }
    
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

    private double safeGetConsistencyScore(Long employeeId, int month, int year, double fallback) {
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

    private PredictionResponse buildUnavailableResponse(Long employeeId,
                                                         String employeeName,
                                                         double currentScore,
                                                         String message) {
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