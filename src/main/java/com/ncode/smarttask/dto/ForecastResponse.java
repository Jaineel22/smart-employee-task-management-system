package com.ncode.smarttask.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/**
 * DTO for Growth Forecast Engine response from FastAPI.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ForecastResponse {

    private Integer     employeeId;
    private Integer     currentProductivity;
    private Integer     smoothedProductivity;
    private Integer     predictedProductivity1Month;
    private Integer     predictedProductivity3Months;
    private Integer     predictedProductivity6Months;
    private Integer     improvement3Months;
    private Integer     improvement6Months;
    private String      trendDirection;   // IMPROVING | STABLE | DECLINING
    private Double      trendPerMonth;
    private Integer     confidence;
    private Integer     dataPoints;
    private List<Integer> historicalData;

    public ForecastResponse() {}

    public static ForecastResponse fallback(Integer employeeId) {
        ForecastResponse r = new ForecastResponse();
        r.setEmployeeId(employeeId);
        r.setCurrentProductivity(0);
        r.setPredictedProductivity3Months(0);
        r.setImprovement3Months(0);
        r.setTrendDirection("UNAVAILABLE");
        r.setConfidence(0);
        return r;
    }

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Integer getEmployeeId()                                     { return employeeId; }
    public void    setEmployeeId(Integer id)                           { this.employeeId = id; }

    public Integer getCurrentProductivity()                            { return currentProductivity; }
    public void    setCurrentProductivity(Integer v)                   { this.currentProductivity = v; }

    public Integer getSmoothedProductivity()                           { return smoothedProductivity; }
    public void    setSmoothedProductivity(Integer v)                  { this.smoothedProductivity = v; }

    public Integer getPredictedProductivity1Month()                    { return predictedProductivity1Month; }
    public void    setPredictedProductivity1Month(Integer v)           { this.predictedProductivity1Month = v; }

    public Integer getPredictedProductivity3Months()                   { return predictedProductivity3Months; }
    public void    setPredictedProductivity3Months(Integer v)          { this.predictedProductivity3Months = v; }

    public Integer getPredictedProductivity6Months()                   { return predictedProductivity6Months; }
    public void    setPredictedProductivity6Months(Integer v)          { this.predictedProductivity6Months = v; }

    public Integer getImprovement3Months()                             { return improvement3Months; }
    public void    setImprovement3Months(Integer v)                    { this.improvement3Months = v; }

    public Integer getImprovement6Months()                             { return improvement6Months; }
    public void    setImprovement6Months(Integer v)                    { this.improvement6Months = v; }

    public String  getTrendDirection()                                 { return trendDirection; }
    public void    setTrendDirection(String v)                         { this.trendDirection = v; }

    public Double  getTrendPerMonth()                                  { return trendPerMonth; }
    public void    setTrendPerMonth(Double v)                          { this.trendPerMonth = v; }

    public Integer getConfidence()                                     { return confidence; }
    public void    setConfidence(Integer v)                            { this.confidence = v; }

    public Integer getDataPoints()                                     { return dataPoints; }
    public void    setDataPoints(Integer v)                            { this.dataPoints = v; }

    public List<Integer> getHistoricalData()                           { return historicalData; }
    public void          setHistoricalData(List<Integer> v)            { this.historicalData = v; }
}