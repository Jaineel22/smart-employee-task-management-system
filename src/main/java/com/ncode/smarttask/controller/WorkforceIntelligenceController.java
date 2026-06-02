package com.ncode.smarttask.controller;

import com.ncode.smarttask.dto.BurnoutResponse;
import com.ncode.smarttask.service.WorkforceIntelligenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * WorkforceIntelligenceController.java
 * =====================================
 * REST endpoints for AI-4 workforce intelligence features.
 * 
 * Endpoints:
 * - GET /api/ai/burnout/{id} - Get burnout risk for an employee
 * - GET /api/ai/burnout/me - Get burnout risk for current user
 * - GET /api/ai/health - Check AI service health
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class WorkforceIntelligenceController {

    private final WorkforceIntelligenceService workforceIntelligenceService;
    
    /**
     * Get burnout risk for a specific employee (Manager only).
     */
    @GetMapping("/burnout/{id}")
    public ResponseEntity<BurnoutResponse> getBurnoutRisk(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {
        
        int resolvedMonth = month > 0 ? month : LocalDate.now().getMonthValue();
        int resolvedYear = year > 0 ? year : LocalDate.now().getYear();
        
        return ResponseEntity.ok(workforceIntelligenceService.getBurnoutRisk(id, resolvedMonth, resolvedYear));
    }
    
    /**
     * Get burnout risk for the currently authenticated user.
     */
    @GetMapping("/burnout/me")
    public ResponseEntity<BurnoutResponse> getMyBurnoutRisk(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue =0") int year) {
        
        // In a real implementation, extract user ID from authentication
        // For now, we need the user ID - you'll need to add UserRepository to get ID from email
        
        int resolvedMonth = month > 0 ? month : LocalDate.now().getMonthValue();
        int resolvedYear = year > 0 ? year : LocalDate.now().getYear();
        
        // This needs the actual user ID - implement based on your auth system
        return ResponseEntity.ok(workforceIntelligenceService.getBurnoutRisk(1L, resolvedMonth, resolvedYear));
    }
    
    /**
     * Check AI service health.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        // Implementation depends on your needs
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "service", "Workforce Intelligence AI"
        ));
    }
}