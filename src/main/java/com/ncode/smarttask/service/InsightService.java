package com.ncode.smarttask.service;

import com.ncode.smarttask.dto.ProductivityDTO;
import com.ncode.smarttask.dto.TeamAnalyticsDTO;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.enums.Role;
import com.ncode.smarttask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InsightService {

    private final ProductivityService productivityService;
    private final UserRepository      userRepository;

    /* ══════════════════════════════════════════════════════
       EMPLOYEE INSIGHTS — rule-based, data-driven
    ══════════════════════════════════════════════════════ */
    public List<String> generateEmployeeInsights(Long userId) {
        LocalDate now   = LocalDate.now();
        int month       = now.getMonthValue();
        int year        = now.getYear();

        ProductivityDTO current = null;
        try {
            current = productivityService.getEmployeeProductivity(userId, month, year);
        } catch (Exception e) {
            return List.of("Productivity data is being calculated. Check back shortly.");
        }

        List<String> insights = new ArrayList<>();

        // ── 1. Overall productivity score ────────────────
        double score = current.getProductivityScore();
        if (score >= 90) {
            insights.add("🏆 Outstanding performance this month with a " + fmt(score) + "% productivity score.");
        } else if (score >= 75) {
            insights.add("⭐ Excellent work this month — productivity score at " + fmt(score) + "%.");
        } else if (score >= 60) {
            insights.add("✅ Good performance this month. Productivity score: " + fmt(score) + "%.");
        } else if (score >= 40) {
            insights.add("⚠️ Productivity score of " + fmt(score) + "% suggests room for improvement this month.");
        } else {
            insights.add("🔴 Low productivity score of " + fmt(score) + "% detected. Consider reaching out to your manager.");
        }

        // ── 2. Task completion ───────────────────────────
        int assigned  = current.getTotalTasksAssigned();
        int completed = current.getTotalTasksCompleted();
        if (assigned > 0) {
            double pct = (completed / (double) assigned) * 100;
            if (pct == 100) {
                insights.add("🎯 You completed 100% of your assigned tasks this month. Excellent!");
            } else if (pct >= 80) {
                insights.add("📋 You completed " + completed + " out of " + assigned + " tasks (" + fmt(pct) + "% completion rate).");
            } else if (pct >= 50) {
                insights.add("📋 " + (assigned - completed) + " tasks still pending. Consider prioritizing them.");
            } else {
                insights.add("⚠️ Only " + completed + " of " + assigned + " assigned tasks completed (" + fmt(pct) + "%). Focus on task completion.");
            }
        } else {
            insights.add("📋 No tasks assigned this month yet.");
        }

        // ── 3. Hours worked ──────────────────────────────
        double hours    = current.getHoursWorked();
        double expected = current.getExpectedHours();
        double hoursPct = expected > 0 ? (hours / expected) * 100 : 0;
        if (hoursPct >= 95) {
            insights.add("⏱️ Excellent time commitment — logged " + fmt(hours) + "h out of " + fmt(expected) + "h expected.");
        } else if (hoursPct >= 70) {
            insights.add("⏱️ Logged " + fmt(hours) + "h out of " + fmt(expected) + "h expected (" + fmt(hoursPct) + "%).");
        } else if (hours > 0) {
            insights.add("⏱️ Only " + fmt(hours) + "h logged this month. Submitting daily reports helps track progress accurately.");
        } else {
            insights.add("⏱️ No hours logged this month. Remember to submit daily work reports.");
        }

        // ── 4. Deadline discipline ───────────────────────
        double deadline = current.getDeadlineDisciplineScore();
        if (deadline >= 90) {
            insights.add("🕐 Excellent deadline discipline (" + fmt(deadline) + "%). Tasks consistently completed on time.");
        } else if (deadline >= 70) {
            insights.add("🕐 Most tasks completed on time (" + fmt(deadline) + "% deadline discipline).");
        } else if (current.getTotalTasksCompleted() > 0) {
            insights.add("🕐 Deadline discipline at " + fmt(deadline) + "%. " + "Consider prioritizing tasks closer to their due dates.");
        }

        // ── 5. Trend comparison ──────────────────────────
        Double trend = current.getTrendDelta();
        if (trend != null) {
            if (trend >= 10) {
                insights.add("📈 Productivity improved significantly by " + fmt(Math.abs(trend)) + "% compared to last month. Great work!");
            } else if (trend >= 3) {
                insights.add("📈 Productivity is up " + fmt(Math.abs(trend)) + "% from last month. Keep it going!");
            } else if (trend <= -10) {
                insights.add("📉 Productivity dropped by " + fmt(Math.abs(trend)) + "% compared to last month. Let's get back on track.");
            } else if (trend <= -3) {
                insights.add("📉 Slight dip of " + fmt(Math.abs(trend)) + "% from last month. Consider reviewing your task load.");
            }
        }

        // ── 6. Average progress ──────────────────────────
        double avgProg = current.getAvgTaskProgress();
        if (assigned > 0 && completed < assigned) {
            if (avgProg >= 75) {
                insights.add("🔄 In-progress tasks are well underway — average progress at " + fmt(avgProg) + "%.");
            } else if (avgProg < 40 && assigned - completed > 2) {
                insights.add("🔄 Several tasks have low progress. Updating task progress helps managers track team workload.");
            }
        }

        // ── 7. Rank insight (compared to team) ───────────
        try {
            TeamAnalyticsDTO team = productivityService.getTeamAnalytics(month, year);
            if (team.getEmployees() != null && team.getEmployees().size() > 1) {
                long totalEmp   = team.getEmployees().size();
                long betterThan = team.getEmployees().stream()
                        .filter(e -> !e.getEmployeeId().equals(userId))
                        .filter(e -> e.getProductivityScore() < score)
                        .count();
                double rankPct = (betterThan / (double)(totalEmp - 1)) * 100;
                if (rankPct >= 80) {
                    insights.add("🥇 You are among the top 20% performers in your team this month.");
                } else if (rankPct >= 60) {
                    insights.add("🏅 You are performing above average in your team this month.");
                }
                if (score >= team.getTeamAvgProductivity() + 10) {
                    insights.add("🌟 Your score is " + fmt(score - team.getTeamAvgProductivity()) + "% above team average.");
                }
            }
        } catch (Exception ignored) { /* team data unavailable — skip rank insight */ }

        // Cap at 6 insights to avoid overwhelming the card
        return insights.stream().limit(6).collect(Collectors.toList());
    }

    /* ══════════════════════════════════════════════════════
       MANAGER TEAM INSIGHTS — rule-based intelligence
    ══════════════════════════════════════════════════════ */
    public List<String> generateManagerInsights() {
        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year  = now.getYear();

        TeamAnalyticsDTO team = null;
        try {
            team = productivityService.getTeamAnalytics(month, year);
        } catch (Exception e) {
            return List.of("Team analytics are being compiled. Check back shortly.");
        }

        List<String> insights = new ArrayList<>();
        List<ProductivityDTO> employees = team.getEmployees();

        if (employees == null || employees.isEmpty()) {
            return List.of("No employee data available for this month yet.");
        }

        double teamAvg = team.getTeamAvgProductivity();

        // ── 1. Team average ──────────────────────────────
        if (teamAvg >= 80) {
            insights.add("🏆 Team productivity is excellent this month — averaging " + fmt(teamAvg) + "%.");
        } else if (teamAvg >= 65) {
            insights.add("✅ Team productivity at " + fmt(teamAvg) + "% — performing well overall.");
        } else if (teamAvg >= 50) {
            insights.add("⚠️ Team average at " + fmt(teamAvg) + "%. Several employees may need support.");
        } else {
            insights.add("🔴 Team productivity is at " + fmt(teamAvg) + "% — review workloads and blockers.");
        }

        // ── 2. Best performer ────────────────────────────
        if (team.getBestPerformerName() != null) {
            insights.add("🥇 Top performer this month: " + team.getBestPerformerName()
                    + " (" + fmt(team.getBestPerformerScore()) + "%).");
        }

        // ── 3. Employees needing attention ───────────────
        List<ProductivityDTO> struggling = employees.stream()
                .filter(e -> e.getProductivityScore() < 50)
                .collect(Collectors.toList());
        if (!struggling.isEmpty()) {
            String names = struggling.stream()
                    .map(ProductivityDTO::getEmployeeName)
                    .collect(Collectors.joining(", "));
            insights.add("🔴 " + struggling.size() + " employee(s) may need attention: " + names + ".");
        }

        // ── 4. Most improved ─────────────────────────────
        Optional<ProductivityDTO> mostImproved = employees.stream()
                .filter(e -> e.getTrendDelta() != null && e.getTrendDelta() > 5)
                .max(Comparator.comparingDouble(ProductivityDTO::getTrendDelta));
        mostImproved.ifPresent(e ->
            insights.add("📈 Most improved this month: " + e.getEmployeeName()
                    + " (" + (e.getTrendDelta() > 0 ? "+" : "") + fmt(e.getTrendDelta()) + "% vs last month).")
        );

        // ── 5. Declining employees ───────────────────────
        List<ProductivityDTO> declining = employees.stream()
                .filter(e -> e.getTrendDelta() != null && e.getTrendDelta() < -8)
                .collect(Collectors.toList());
        if (!declining.isEmpty()) {
            declining.forEach(e ->
                insights.add("📉 " + e.getEmployeeName() + " productivity dropped by "
                        + fmt(Math.abs(e.getTrendDelta())) + "% this month.")
            );
        }

        // ── 6. Low deadline discipline ───────────────────
        List<ProductivityDTO> lateWorkers = employees.stream()
                .filter(e -> e.getDeadlineDisciplineScore() < 60 && e.getTotalTasksCompleted() > 0)
                .collect(Collectors.toList());
        if (!lateWorkers.isEmpty()) {
            insights.add("🕐 " + lateWorkers.size() + " employee(s) have low deadline discipline — review task deadlines.");
        }

        // ── 7. Workload distribution ─────────────────────
        OptionalDouble maxTasks = employees.stream()
                .mapToDouble(ProductivityDTO::getTotalTasksAssigned)
                .max();
        OptionalDouble minTasks = employees.stream()
                .mapToDouble(ProductivityDTO::getTotalTasksAssigned)
                .min();
        if (maxTasks.isPresent() && minTasks.isPresent()
                && (maxTasks.getAsDouble() - minTasks.getAsDouble()) > 5) {
            insights.add("⚖️ Uneven workload distribution detected. Some employees have significantly more tasks than others.");
        }

        // ── 8. Hours logged ──────────────────────────────
        double totalHours = team.getTotalHoursLogged();
        double expectedTeam = employees.size() * 176.0;
        double hoursPct = expectedTeam > 0 ? (totalHours / expectedTeam) * 100 : 0;
        if (hoursPct < 50) {
            insights.add("⏱️ Team has logged only " + fmt(hoursPct) + "% of expected hours. Encourage daily report submission.");
        }

        return insights.stream().limit(7).collect(Collectors.toList());
    }

    /* ── Helpers ──────────────────────────────────────────── */
    private String fmt(double val) {
        return String.format("%.1f", val);
    }
}