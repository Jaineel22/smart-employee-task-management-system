package com.ncode.smarttask.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

/**
 * DTO for Attrition Risk Engine response from FastAPI.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class AttritionResponse {

    private Integer employeeId;
    private Integer attritionRisk;
    private String  level;         // LOW | MEDIUM | HIGH
    private Integer confidence;
    private List<String>         reasons;
    private Map<String, Integer> factorScores;

    public AttritionResponse() {}

    public static AttritionResponse fallback(Integer employeeId) {
        AttritionResponse r = new AttritionResponse();
        r.setEmployeeId(employeeId);
        r.setAttritionRisk(0);
        r.setLevel("UNAVAILABLE");
        r.setConfidence(0);
        r.setReasons(List.of("AI service temporarily unavailable"));
        return r;
    }

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Integer getEmployeeId()                             { return employeeId; }
    public void    setEmployeeId(Integer employeeId)           { this.employeeId = employeeId; }

    public Integer getAttritionRisk()                          { return attritionRisk; }
    public void    setAttritionRisk(Integer attritionRisk)     { this.attritionRisk = attritionRisk; }

    public String  getLevel()                                  { return level; }
    public void    setLevel(String level)                      { this.level = level; }

    public Integer getConfidence()                             { return confidence; }
    public void    setConfidence(Integer confidence)           { this.confidence = confidence; }

    public List<String> getReasons()                           { return reasons; }
    public void         setReasons(List<String> reasons)       { this.reasons = reasons; }

    public Map<String, Integer> getFactorScores()              { return factorScores; }
    public void setFactorScores(Map<String, Integer> fs)       { this.factorScores = fs; }
}