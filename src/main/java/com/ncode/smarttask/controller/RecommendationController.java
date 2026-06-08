package com.ncode.smarttask.controller;

import com.ncode.smarttask.dto.EmployeeRecommendationResponse;
import com.ncode.smarttask.dto.Teamrecommendationresponse;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.repository.UserRepository;
import com.ncode.smarttask.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * AI-5: Recommendation Engine Controller
 * ========================================
 * Endpoints:
 *   GET /api/recommendations/me                   Employee: own recommendations
 *   GET /api/recommendations/employee/{id}        Manager: employee's recommendations
 *   GET /api/recommendations/team                 Manager: full team
 *   GET /api/recommendations/project/{projectId}  Manager: project team
 *
 * JWT auth is inherited from SecurityConfig — no extra config needed.
 * All endpoints handle AI service errors gracefully.
 */
@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserRepository        userRepository;

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
     * EMPLOYEE — GET /api/recommendations/me?month=5&year=2026
     *
     * Returns prioritised AI recommendations for the currently
     * authenticated employee based on their own metrics.
     */
    @GetMapping("/me")
    public ResponseEntity<EmployeeRecommendationResponse> getMyRecommendations(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        User user = resolveUser(authentication);
        return ResponseEntity.ok(
                recommendationService.getMyRecommendations(
                        user.getId(), resolveMonth(month), resolveYear(year))
        );
    }

    /**
     * MANAGER — GET /api/recommendations/employee/{id}?month=5&year=2026
     *
     * Returns AI recommendations for a specific employee.
     * Intended for MANAGER / ADMIN access.
     */
    @GetMapping("/employee/{id}")
    public ResponseEntity<EmployeeRecommendationResponse> getEmployeeRecommendations(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        return ResponseEntity.ok(
                recommendationService.getEmployeeRecommendations(
                        id, resolveMonth(month), resolveYear(year))
        );
    }

    /**
     * MANAGER — GET /api/recommendations/team?month=5&year=2026
     *
     * Returns team-wide recommendations + per-employee breakdown.
     * Sorted by productivity ascending (worst performers first).
     */
    @GetMapping("/team")
    public ResponseEntity<Teamrecommendationresponse> getTeamRecommendations(
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        return ResponseEntity.ok(
                recommendationService.getTeamRecommendations(
                        resolveMonth(month), resolveYear(year))
        );
    }

    /**
     * MANAGER — GET /api/recommendations/project/{projectId}?month=5&year=2026
     *
     * Returns recommendations for all employees assigned to a project.
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<EmployeeRecommendationResponse>> getProjectRecommendations(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        return ResponseEntity.ok(
                recommendationService.getProjectRecommendations(
                        projectId, resolveMonth(month), resolveYear(year))
        );
    }
}