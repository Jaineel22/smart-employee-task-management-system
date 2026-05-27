package com.ncode.smarttask.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamAnalyticsDTO {

    private String month;
    private int    year;

    // Aggregated team KPIs
    private double teamAvgProductivity;
    private double totalHoursLogged;
    private int    totalTasksCompleted;
    private int    totalTasksPending;

    // Best and lowest performers (can be null if no data)
    private String bestPerformerName;
    private double bestPerformerScore;
    private String lowestPerformerName;
    private double lowestPerformerScore;

    // Per-employee breakdown
    private List<ProductivityDTO> employees;
}