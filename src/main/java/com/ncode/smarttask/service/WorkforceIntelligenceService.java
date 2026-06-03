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
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
    public BurnoutResponse getBurnoutRisk(Long employeeId, int month, int year) {
        User employee = userRepository.findById(employeeId).orElse(null);
        
        try {
            // Prepare features from existing data
            Map<String, Object> features = extractBurnoutFeatures(employeeId, month, year);
            features.put("employeeId", employeeId);
            
            // Call Python FastAPI service
            String url = aiEngineUrl + "/burnout/";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(features, headers);
            
            log.info("Calling burnout API for employeeId={} at URL: {}", employeeId, url);
            
            // Since BurnoutResponse has Integer fields, we need to map properly
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            
            if (response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                
                BurnoutResponse burnoutResponse = new BurnoutResponse();
                burnoutResponse.setEmployeeId(employeeId.intValue());
                
                // Handle burnoutRisk - could be Integer or Double
                Object riskObj = responseBody.get("burnoutRisk");
                if (riskObj instanceof Integer) {
                    burnoutResponse.setBurnoutRisk((Integer) riskObj);
                } else if (riskObj instanceof Double) {
                    burnoutResponse.setBurnoutRisk(((Double) riskObj).intValue());
                } else {
                    burnoutResponse.setBurnoutRisk(35);
                }
                
                burnoutResponse.setLevel((String) responseBody.getOrDefault("level", "LOW"));
                burnoutResponse.setReasons((List<String>) responseBody.getOrDefault("reasons", List.of()));
                burnoutResponse.setFactorScores((Map<String, Integer>) responseBody.getOrDefault("factorScores", Map.of()));
                
                log.info("Burnout response: employeeId={}, risk={}, level={}", 
                    employeeId, burnoutResponse.getBurnoutRisk(), burnoutResponse.getLevel());
                
                return burnoutResponse;
            }
            
        } catch (Exception e) {
            log.warn("Burnout prediction service unavailable: {}", e.getMessage());
            
            // Try alternative URL pattern
            try {
                String altUrl = aiEngineUrl + "/api/v1/burnout/";
                Map<String, Object> features = extractBurnoutFeatures(employeeId, month, year);
                features.put("employeeId", employeeId);
                
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(features, headers);
                
                ResponseEntity<Map> response = restTemplate.postForEntity(altUrl, entity, Map.class);
                
                if (response.getBody() != null) {
                    Map<String, Object> responseBody = response.getBody();
                    
                    BurnoutResponse burnoutResponse = new BurnoutResponse();
                    burnoutResponse.setEmployeeId(employeeId.intValue());
                    
                    Object riskObj = responseBody.get("burnoutRisk");
                    if (riskObj instanceof Integer) {
                        burnoutResponse.setBurnoutRisk((Integer) riskObj);
                    } else if (riskObj instanceof Double) {
                        burnoutResponse.setBurnoutRisk(((Double) riskObj).intValue());
                    } else {
                        burnoutResponse.setBurnoutRisk(35);
                    }
                    
                    burnoutResponse.setLevel((String) responseBody.getOrDefault("level", "LOW"));
                    burnoutResponse.setReasons((List<String>) responseBody.getOrDefault("reasons", List.of()));
                    burnoutResponse.setFactorScores((Map<String, Integer>) responseBody.getOrDefault("factorScores", Map.of()));
                    
                    return burnoutResponse;
                }
            } catch (Exception e2) {
                log.warn("Alternative burnout URL also failed: {}", e2.getMessage());
            }
        }
        
        // Fallback response when AI service is unavailable
        return BurnoutResponse.fallback(employeeId.intValue());
    }
    
    /**
     * Extract features for burnout prediction from existing data.
     */

    /**
 * Extract features for burnout prediction from existing data.
 */

    
    private Map<String, Object> extractBurnoutFeatures(Long employeeId, int month, int year) {
        Map<String, Object> features = new HashMap<>();
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        try {
            // Get productivity data
            ProductivityDTO productivity =
                    productivityService.getEmployeeProductivity(employeeId, month, year);

            log.info(
                    "📊 Productivity data for employee {}: hours={}, totalTasks={}, completedTasks={}, progress={}%",
                    employeeId,
                    productivity.getHoursWorked(),
                    productivity.getTotalTasksAssigned(),
                    productivity.getTotalTasksCompleted(),
                    productivity.getAvgTaskProgress()
            );

            // Get attendance rate
            double attendanceRate = 80.0;
            try {
                var summary = attendanceService.getMySummary(employeeId, month, year);

                if (summary != null) {
                    attendanceRate = summary.getAttendanceRate();

                    log.info(
                            "📊 Attendance for employee {}: {}%",
                            employeeId,
                            attendanceRate
                    );
                } else {
                    log.warn("No attendance summary for employee {}", employeeId);
                }

            } catch (Exception e) {
                log.warn(
                        "Could not get attendance for employee {}: {}",
                        employeeId,
                        e.getMessage()
                );
            }

            // Get reports count
            long reportsCount = 0;

            try {
                var reports = reportRepository.findByUserIdAndReportDateBetween(
                        employeeId,
                        startDate,
                        endDate
                );

                reportsCount = reports.size();

                log.info(
                        "📊 Reports for employee {} in {}/{}: {} reports",
                        employeeId,
                        month,
                        year,
                        reportsCount
                );

            } catch (Exception e) {
                log.warn(
                        "Could not get reports for employee {}: {}",
                        employeeId,
                        e.getMessage()
                );
            }

            // Calculate derived metrics
            double monthlyHours = productivity.getHoursWorked();
            double dailyAvgHours = monthlyHours / 22.0;

            long pendingTasks = Math.max(
                    0,
                    productivity.getTotalTasksAssigned()
                            - productivity.getTotalTasksCompleted()
            );

            double utilizationPct = (monthlyHours / 176.0) * 100;

            log.info(
                    "📊 Calculated metrics: monthlyHours={}, dailyAvgHours={}, pendingTasks={}, utilization={}% ",
                    monthlyHours,
                    dailyAvgHours,
                    pendingTasks,
                    utilizationPct
            );

            features.put("attendancePercentage", attendanceRate);
            features.put("monthlyHoursWorked", monthlyHours);
            features.put("dailyAverageHours", dailyAvgHours);
            features.put("pendingTasks", (int) pendingTasks);
            features.put("overdueTasks", 0);
            features.put("utilizationPercentage", utilizationPct);
            features.put("consecutiveWorkDays", 5);
            features.put("reportsTotal", 22);
            features.put("reportsSubmitted", (int) reportsCount);

            log.info(
                    "✅ Final features for employee {}: {}",
                    employeeId,
                    features
            );

        } catch (Exception e) {

            log.error(
                    "Error extracting burnout features for employee {}: {}",
                    employeeId,
                    e.getMessage(),
                    e
            );

            // Set default values
            features.put("attendancePercentage", 80.0);
            features.put("monthlyHoursWorked", 160.0);
            features.put("dailyAverageHours", 7.3);
            features.put("pendingTasks", 0);
            features.put("overdueTasks", 0);
            features.put("utilizationPercentage", 75.0);
            features.put("consecutiveWorkDays", 5);
            features.put("reportsTotal", 22);
            features.put("reportsSubmitted", 10);
        }

        return features;
    }
    
}