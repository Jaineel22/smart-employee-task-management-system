package com.ncode.smarttask.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/**
 * DTO for Recommendation Engine response from FastAPI.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class RecommendationResponse {

    private Integer     employeeId;
    private List<String> recommendations;
    private Integer     expectedImprovement;
    private String      priority;           // HIGH | MEDIUM | LOW
    private Integer     recommendationCount;

    public RecommendationResponse() {}

    public static RecommendationResponse fallback(Integer employeeId) {
        RecommendationResponse r = new RecommendationResponse();
        r.setEmployeeId(employeeId);
        r.setRecommendations(List.of("AI recommendations temporarily unavailable"));
        r.setExpectedImprovement(0);
        r.setPriority("LOW");
        r.setRecommendationCount(1);
        return r;
    }

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Integer      getEmployeeId()                               { return employeeId; }
    public void         setEmployeeId(Integer employeeId)             { this.employeeId = employeeId; }

    public List<String> getRecommendations()                          { return recommendations; }
    public void         setRecommendations(List<String> recs)         { this.recommendations = recs; }

    public Integer      getExpectedImprovement()                      { return expectedImprovement; }
    public void         setExpectedImprovement(Integer exp)           { this.expectedImprovement = exp; }

    public String       getPriority()                                 { return priority; }
    public void         setPriority(String priority)                  { this.priority = priority; }

    public Integer      getRecommendationCount()                      { return recommendationCount; }
    public void         setRecommendationCount(Integer count)         { this.recommendationCount = count; }
}