package com.ncode.smarttask.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * BurnoutResponse.java
 * ====================
 * DTO for employee burnout risk assessment.
 * 
 * Used by WorkforceIntelligenceController to return burnout predictions
 * to the frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BurnoutResponse {
    
    /** Employee identifier */
    private Long employeeId;
    
    /** Employee full name */
    private String employeeName;
    
    /** Burnout risk score (0-100) */
    private Double burnoutRisk;
    
    /** Risk level: LOW, MEDIUM, HIGH */
    private String level;
    
    /** Human-readable reasons for the risk assessment */
    private List<String> reasons;
    
    /** Actionable recommendations */
    private List<String> recommendations;
    
    /** Timestamp of the assessment */
    private String timestamp;
    
    /** Whether AI service was available (false = fallback values) */
    private Boolean aiServiceAvailable;
    
    /** Color code for UI (green, orange, red) */
    private String colorCode;
    
    /** Action message for managers */
    private String suggestedAction;
}