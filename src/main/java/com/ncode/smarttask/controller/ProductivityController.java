package com.ncode.smarttask.controller;

import com.ncode.smarttask.dto.ProductivityDTO;
import com.ncode.smarttask.dto.TeamAnalyticsDTO;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.repository.UserRepository;
import com.ncode.smarttask.service.ProductivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/productivity")
@RequiredArgsConstructor
public class ProductivityController {

    private final ProductivityService productivityService;
    private final UserRepository      userRepository;

    /**
     * EMPLOYEE — GET /api/productivity/me?month=5&year=2026
     * Returns the productivity score of the currently authenticated employee.
     * Accessible by any authenticated user for their own data.
     */
    @GetMapping("/me")
    public ResponseEntity<ProductivityDTO> getMyProductivity(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        // Default to current month/year if not provided
        LocalDate now = LocalDate.now();
        int resolvedMonth = month > 0 ? month : now.getMonthValue();
        int resolvedYear  = year  > 0 ? year  : now.getYear();

        // Load user from security context by email
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        return ResponseEntity.ok(
                productivityService.getEmployeeProductivity(user.getId(), resolvedMonth, resolvedYear)
        );
    }

    /**
     * MANAGER — GET /api/productivity/team?month=5&year=2026
     * Returns aggregated analytics for the entire team.
     * Manager/Admin only.
     */
    @GetMapping("/team")
    public ResponseEntity<TeamAnalyticsDTO> getTeamAnalytics(
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        LocalDate now = LocalDate.now();
        int resolvedMonth = month > 0 ? month : now.getMonthValue();
        int resolvedYear  = year  > 0 ? year  : now.getYear();

        return ResponseEntity.ok(
                productivityService.getTeamAnalytics(resolvedMonth, resolvedYear)
        );
    }

    /**
     * MANAGER — GET /api/productivity/employee/{id}?month=5&year=2026
     * Returns detailed productivity of a specific employee.
     * Manager/Admin only.
     */
    @GetMapping("/employee/{id}")
    public ResponseEntity<ProductivityDTO> getEmployeeProductivity(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        LocalDate now = LocalDate.now();
        int resolvedMonth = month > 0 ? month : now.getMonthValue();
        int resolvedYear  = year  > 0 ? year  : now.getYear();

        return ResponseEntity.ok(
                productivityService.getEmployeeProductivity(id, resolvedMonth, resolvedYear)
        );
    }
}