package com.ncode.smarttask.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

/**
 * DTO for Team Health Engine response from FastAPI.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class TeamHealthResponse {

    private Integer managerId;
    private Integer teamSize;
    private Integer teamHealth;
    private String  category;          // Excellent | Good | Average | Needs Attention
    private Integer attendanceScore;
    private Integer productivityScore;
    private Integer utilizationScore;
    private Integer completionScore;
    private Integer engagementScore;
    private Integer averageBurnout;
    private Integer highRiskCount;
    private List<Map<String, Object>> topPerformers;
    private List<Map<String, Object>> bottomPerformers;
    private List<Map<String, Object>> highRiskEmployees;
    private List<String>              insights;

    public TeamHealthResponse() {}

    public static TeamHealthResponse fallback(Integer managerId) {
        TeamHealthResponse r = new TeamHealthResponse();
        r.setManagerId(managerId);
        r.setTeamHealth(0);
        r.setCategory("UNAVAILABLE");
        r.setInsights(List.of("AI service temporarily unavailable"));
        return r;
    }

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Integer getManagerId()                                      { return managerId; }
    public void    setManagerId(Integer v)                             { this.managerId = v; }

    public Integer getTeamSize()                                       { return teamSize; }
    public void    setTeamSize(Integer v)                              { this.teamSize = v; }

    public Integer getTeamHealth()                                     { return teamHealth; }
    public void    setTeamHealth(Integer v)                            { this.teamHealth = v; }

    public String  getCategory()                                       { return category; }
    public void    setCategory(String v)                               { this.category = v; }

    public Integer getAttendanceScore()                                { return attendanceScore; }
    public void    setAttendanceScore(Integer v)                       { this.attendanceScore = v; }

    public Integer getProductivityScore()                              { return productivityScore; }
    public void    setProductivityScore(Integer v)                     { this.productivityScore = v; }

    public Integer getUtilizationScore()                               { return utilizationScore; }
    public void    setUtilizationScore(Integer v)                      { this.utilizationScore = v; }

    public Integer getCompletionScore()                                { return completionScore; }
    public void    setCompletionScore(Integer v)                       { this.completionScore = v; }

    public Integer getEngagementScore()                                { return engagementScore; }
    public void    setEngagementScore(Integer v)                       { this.engagementScore = v; }

    public Integer getAverageBurnout()                                 { return averageBurnout; }
    public void    setAverageBurnout(Integer v)                        { this.averageBurnout = v; }

    public Integer getHighRiskCount()                                  { return highRiskCount; }
    public void    setHighRiskCount(Integer v)                         { this.highRiskCount = v; }

    public List<Map<String, Object>> getTopPerformers()               { return topPerformers; }
    public void setTopPerformers(List<Map<String, Object>> v)         { this.topPerformers = v; }

    public List<Map<String, Object>> getBottomPerformers()            { return bottomPerformers; }
    public void setBottomPerformers(List<Map<String, Object>> v)      { this.bottomPerformers = v; }

    public List<Map<String, Object>> getHighRiskEmployees()           { return highRiskEmployees; }
    public void setHighRiskEmployees(List<Map<String, Object>> v)     { this.highRiskEmployees = v; }

    public List<String> getInsights()                                  { return insights; }
    public void         setInsights(List<String> v)                    { this.insights = v; }
}