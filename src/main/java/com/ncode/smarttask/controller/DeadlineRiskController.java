package com.ncode.smarttask.controller;

import com.ncode.smarttask.dto.EmployeeRiskResponse;
import com.ncode.smarttask.dto.RiskPredictionResponse;
import com.ncode.smarttask.dto.TeamRiskResponse;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.repository.UserRepository;
import com.ncode.smarttask.service.DeadlineRiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * AI-6: Deadline Risk Prediction Controller
 * ===========================================
 * Endpoints:
 *   GET /api/risk/task/{taskId}              Any role: single task risk
 *   GET /api/risk/employee/{employeeId}      Manager: employee risk summary
 *   GET /api/risk/project/{projectId}        Manager: project risk
 *   GET /api/risk/team                       Manager: full team risk
 *   GET /api/risk/critical                   Manager: all CRITICAL tasks
 *   GET /api/risk/me                         Employee: own task risks
 *
 * JWT auth inherited from SecurityConfig.
 * Never throws — all errors handled gracefully in the service layer.
 */
@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
public class DeadlineRiskController {

    private final DeadlineRiskService deadlineRiskService;
    private final UserRepository      userRepository;

    // ── Helpers ───────────────────────────────────────────────────────────────
    private User resolveUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    private int resolveMonth(int param) {
        return param > 0 ? param : LocalDate.now().getMonthValue();
    }

    private int resolveYear(int param) {
        return param > 0 ? param : LocalDate.now().getYear();
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * ANY ROLE — GET /api/risk/task/{taskId}
     *
     * Returns deadline risk prediction for a single task.
     * Employees can check their own tasks; managers can check any task.
     */
    @GetMapping("/task/{taskId}")
    public ResponseEntity<RiskPredictionResponse> getTaskRisk(@PathVariable Long taskId) {
        return ResponseEntity.ok(deadlineRiskService.getTaskRisk(taskId));
    }

    /**
     * EMPLOYEE — GET /api/risk/me
     *
     * Returns risk summary for all the authenticated employee's active tasks.
     */
    @GetMapping("/me")
    public ResponseEntity<EmployeeRiskResponse> getMyRisk(Authentication authentication) {
        User user = resolveUser(authentication);
        return ResponseEntity.ok(deadlineRiskService.getEmployeeRisk(user.getId()));
    }

    /**
     * MANAGER — GET /api/risk/employee/{employeeId}
     *
     * Returns full risk breakdown for a specific employee.
     */
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<EmployeeRiskResponse> getEmployeeRisk(
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(deadlineRiskService.getEmployeeRisk(employeeId));
    }

    /**
     * MANAGER — GET /api/risk/project/{projectId}
     *
     * Returns deadline risk for all active tasks in a project.
     * Sorted by riskScore descending.
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<RiskPredictionResponse>> getProjectRisk(
            @PathVariable Long projectId) {
        return ResponseEntity.ok(deadlineRiskService.getProjectRisk(projectId));
    }

    /**
     * MANAGER — GET /api/risk/team?month=5&year=2026
     *
     * Returns team-wide risk summary including per-employee breakdowns
     * and a list of all CRITICAL tasks.
     */
    @GetMapping("/team")
    public ResponseEntity<TeamRiskResponse> getTeamRisk(
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        return ResponseEntity.ok(
                deadlineRiskService.getTeamRisk(resolveMonth(month), resolveYear(year))
        );
    }

    /**
     * MANAGER — GET /api/risk/critical
     *
     * Returns all CRITICAL tasks (riskScore >= 81) across the entire team.
     * Used by the "Critical Alerts" widget on the manager dashboard.
     */
    @GetMapping("/critical")
    public ResponseEntity<List<RiskPredictionResponse>> getCriticalTasks() {
        return ResponseEntity.ok(deadlineRiskService.getCriticalTasks());
    }
}