package com.ncode.smarttask.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

/**
 * DTO for Burnout Detection Engine response from FastAPI.
 * Maps to POST /burnout/ response payload.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class BurnoutResponse {

    private Integer employeeId;
    private Integer burnoutRisk;
    private String  level;           // LOW | MEDIUM | HIGH
    private List<String>       reasons;
    private Map<String, Integer> factorScores;

    // ── Constructors ───────────────────────────────────────────────────────────

    public BurnoutResponse() {}

    /** Fallback constructor when AI service is unavailable. */
    public static BurnoutResponse fallback(Integer employeeId) {
        BurnoutResponse r = new BurnoutResponse();
        r.setEmployeeId(employeeId);
        r.setBurnoutRisk(0);
        r.setLevel("UNAVAILABLE");
        r.setReasons(List.of("AI service temporarily unavailable"));
        return r;
    }

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Integer getEmployeeId()                    { return employeeId; }
    public void setEmployeeId(Integer employeeId)     { this.employeeId = employeeId; }

    public Integer getBurnoutRisk()                   { return burnoutRisk; }
    public void setBurnoutRisk(Integer burnoutRisk)   { this.burnoutRisk = burnoutRisk; }

    public String getLevel()                          { return level; }
    public void setLevel(String level)                { this.level = level; }

    public List<String> getReasons()                  { return reasons; }
    public void setReasons(List<String> reasons)      { this.reasons = reasons; }

    public Map<String, Integer> getFactorScores()              { return factorScores; }
    public void setFactorScores(Map<String, Integer> factorScores) { this.factorScores = factorScores; }
}