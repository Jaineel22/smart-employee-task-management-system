package com.ncode.smarttask.service;

import com.ncode.smarttask.dto.BurnoutResponse;
import com.ncode.smarttask.dto.ProductivityDTO;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.repository.DailyWorkReportRepository;
import com.ncode.smarttask.repository.TaskRepository;
import com.ncode.smarttask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * WorkforceIntelligenceService.java
 * =================================
 * Orchestrates calls to AI-4 engines (Burnout, Attrition, Team Health, etc.)
 * 
 * This service communicates with the Python FastAPI service which hosts
 * all AI prediction models.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkforceIntelligenceService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final DailyWorkReportRepository reportRepository;
    private final ProductivityService productivityService;
    private final AttendanceService attendanceService;
    
    @Value("${ai.engine.url:http://localhost:8000}")
    private String aiEngineUrl;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    /**
     * Get burnout risk assessment for an employee.
     * 
     * @param employeeId The employee ID
     * @param month Month (1-12)
     * @param year Year
     * @return BurnoutResponse with risk assessment
     */
    @SuppressWarnings("unchecked")
    public BurnoutResponse getBurnoutRisk(Long employeeId, int month, int year) {
        User employee = userRepository.findById(employeeId).orElse(null);
        
        try {
            // Prepare features from existing data
            Map<String, Object> features = extractBurnoutFeatures(employeeId, month, year);
            features.put("employee_id", employeeId);
            
            // Call Python FastAPI service
            String url = aiEngineUrl + "/api/v1/burnout/" + employeeId;
            
            // Add query parameters
            StringBuilder fullUrl = new StringBuilder(url);
            fullUrl.append("?attendance=").append(features.get("attendance_percentage"))
                   .append("&hours=").append(features.get("monthly_hours_worked"))
                   .append("&daily_hours=").append(features.get("daily_avg_hours"))
                   .append("&pending=").append(features.get("pending_tasks"))
                   .append("&overdue=").append(features.get("overdue_tasks"))
                   .append("&utilization=").append(features.get("utilization_percentage"))
                   .append("&consecutive_days=").append(features.get("consecutive_work_days"))
                   .append("&reports=").append(features.get("reports_submitted"))
                   .append("&expected_reports=").append(features.get("expected_reports"));
            
            Map<String, Object> response = restTemplate.getForObject(fullUrl.toString(), Map.class);
            
            if (response != null) {
                return BurnoutResponse.builder()
                        .employeeId(employeeId)
                        .employeeName(employee != null ? employee.getFullName() : "Unknown")
                        .burnoutRisk(((Number) response.get("burnoutRisk")).doubleValue())
                        .level((String) response.get("level"))
                        .reasons((List<String>) response.get("reasons"))
                        .recommendations((List<String>) response.get("recommendations"))
                        .timestamp((String) response.get("timestamp"))
                        .aiServiceAvailable(true)
                        .colorCode(getColorCode((String) response.get("level")))
                        .suggestedAction(getSuggestedAction((String) response.get("level")))
                        .build();
            }
            
        } catch (Exception e) {
            log.warn("Burnout prediction service unavailable: {}", e.getMessage());
        }
        
        // Fallback response when AI service is unavailable
        return buildFallbackBurnoutResponse(employeeId, employee);
    }
    
    /**
     * Extract features for burnout prediction from existing data.
     */
    private Map<String, Object> extractBurnoutFeatures(Long employeeId, int month, int year) {
        Map<String, Object> features = new HashMap<>();
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        
        try {
            // Get productivity data
            ProductivityDTO productivity = productivityService.getEmployeeProductivity(employeeId, month, year);
            
            // Get attendance rate
            double attendanceRate = 80.0;
            try {
                var summary = attendanceService.getMySummary(employeeId, month, year);
                if (summary != null) {
                    attendanceRate = summary.getAttendanceRate();
                }
            } catch (Exception e) {
                log.debug("Could not get attendance for employee {}: {}", employeeId, e.getMessage());
            }
            
            // Get reports count
            long reportsCount = 0;
            try {
                reportsCount = reportRepository.findByUserIdAndReportDateBetween(employeeId, startDate, endDate).size();
            } catch (Exception e) {
                log.debug("Could not get reports for employee {}: {}", employeeId, e.getMessage());
            }
            
            features.put("attendance_percentage", attendanceRate);
            features.put("monthly_hours_worked", productivity.getHoursWorked());
            features.put("daily_avg_hours", productivity.getHoursWorked() / 22.0);
            features.put("pending_tasks", productivity.getTotalTasksAssigned() - productivity.getTotalTasksCompleted());
            features.put("overdue_tasks", 0); // Would need additional query
            features.put("utilization_percentage", (productivity.getHoursWorked() / 176.0) * 100);
            features.put("consecutive_work_days", 5); // Default
            features.put("reports_submitted", reportsCount);
            features.put("expected_reports", 22);
            
        } catch (Exception e) {
            log.error("Error extracting burnout features: {}", e.getMessage());
            // Set default values
            features.put("attendance_percentage", 80.0);
            features.put("monthly_hours_worked", 160.0);
            features.put("daily_avg_hours", 7.3);
            features.put("pending_tasks", 0);
            features.put("overdue_tasks", 0);
            features.put("utilization_percentage", 75.0);
            features.put("consecutive_work_days", 5);
            features.put("reports_submitted", 10);
            features.put("expected_reports", 22);
        }
        
        return features;
    }
    
    /**
     * Build fallback response when AI service is unavailable.
     */
    private BurnoutResponse buildFallbackBurnoutResponse(Long employeeId, User employee) {
        double estimatedRisk = 35.0; // Default low risk
        
        return BurnoutResponse.builder()
                .employeeId(employeeId)
                .employeeName(employee != null ? employee.getFullName() : "Unknown")
                .burnoutRisk(estimatedRisk)
                .level("LOW")
                .reasons(List.of("AI service temporarily unavailable. Using default assessment."))
                .recommendations(List.of("Monitor normally", "Check back when AI service is online"))
                .timestamp(LocalDate.now().format(DateTimeFormatter.ISO_DATE))
                .aiServiceAvailable(false)
                .colorCode("green")
                .suggestedAction("Monitor normally")
                .build();
    }
    
    private String getColorCode(String level) {
        if ("HIGH".equals(level)) return "red";
        if ("MEDIUM".equals(level)) return "orange";
        return "green";
    }
    
    private String getSuggestedAction(String level) {
        if ("HIGH".equals(level)) return "Immediate intervention required";
        if ("MEDIUM".equals(level)) return "Schedule check-in meeting";
        return "Continue normal monitoring";
    }
}