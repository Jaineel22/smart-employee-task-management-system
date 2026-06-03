package com.ncode.smarttask.controller;

import com.ncode.smarttask.dto.PredictionRequest;
import com.ncode.smarttask.dto.PredictionResponse;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.repository.UserRepository;
import com.ncode.smarttask.service.PredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * PredictionController.java
 * =========================
 * Exposes AI prediction endpoints — all additive, zero impact on existing APIs.
 *
 * Endpoint summary:
 *   GET /api/predictions/me                     — Employee: own prediction
 *   GET /api/predictions/employee/{id}          — Manager: specific employee
 *   GET /api/predictions/team                   — Manager: all employees
 *   GET /api/predictions/health                 — Both: AI service status
 *
 * JWT auth is inherited from SecurityConfig — no additional config needed.
 * All endpoints return gracefully even when the Python AI service is offline.
 */
@RestController
@RequestMapping("/api/predictions")
@RequiredArgsConstructor
public class PredictionController {

    private final PredictionService predictionService;
    private final UserRepository    userRepository;

    // ── Helper: resolve authenticated user from JWT ─────────────────────
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

    /**
     * EMPLOYEE — GET /api/predictions/me?month=5&year=2026
     *
     * Returns the AI productivity prediction for the currently
     * authenticated employee. Any role can call this for their own data.
     *
     * Response: PredictionResponse with employeeId, employeeName,
     *           currentProductivity, predictedProductivity, confidence, trend...
     */
    @GetMapping("/me")
    public ResponseEntity<PredictionResponse> getMyPrediction(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        User user = resolveUser(authentication);
        return ResponseEntity.ok(
                predictionService.getPrediction(
                        user.getId(), resolveMonth(month), resolveYear(year)
                )
        );
    }

    /**
     * MANAGER — GET /api/predictions/employee/{id}?month=5&year=2026
     *
     * Returns the AI prediction for a specific employee.
     * Intended for MANAGER / ADMIN access (enforced via RoleProtectedRoute
     * on the frontend; backend trusts JWT authentication).
     */
    @GetMapping("/employee/{id}")
    public ResponseEntity<PredictionResponse> getEmployeePrediction(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        return ResponseEntity.ok(
                predictionService.getPrediction(id, resolveMonth(month), resolveYear(year))
        );
    }

    /**
     * MANAGER — GET /api/predictions/team?month=5&year=2026
     *
     * Returns predictions for ALL employees in the system.
     * Used by PredictionPage.jsx manager view.
     * Never throws — individual failed predictions are gracefully skipped.
     */
    @GetMapping("/team")
    public ResponseEntity<List<PredictionResponse>> getTeamPredictions(
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        return ResponseEntity.ok(
                predictionService.getTeamPredictions(resolveMonth(month), resolveYear(year))
        );
    }
    /**
     * GET /api/predictions/health
     *
     * Checks whether the Python FastAPI AI engine is reachable.
     * Frontend uses this on mount to show/hide the prediction UI gracefully.
     * Returns 200 always — the aiServiceReachable field carries the status.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkAiHealth() {
        boolean reachable = predictionService.isAiServiceReachable();
        return ResponseEntity.ok(Map.of(
                "aiServiceReachable", reachable,
                "message", reachable
                        ? "AI prediction service is online and model is loaded."
                        : "AI prediction service is offline. " +
                          "Start: cd ai-engine && uvicorn app:app --host 0.0.0.0 --port 8000"
        ));
    }
}