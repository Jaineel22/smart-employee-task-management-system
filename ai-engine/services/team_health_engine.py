"""
Team Health Engine
Aggregates per-employee metrics to compute an overall team health score.
Provides dimension-level breakdowns: attendance, productivity, completion, engagement.
"""

import logging
import statistics
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class TeamHealthEngine:
    """
    Computes team health score from aggregated employee metrics.

    Categories:
        90+   → Excellent
        75–89 → Good
        60–74 → Average
        <60   → Needs Attention
    """

    # ─── Benchmark Values (ideal team) ────────────────────────────────────────
    IDEAL_ATTENDANCE    = 95.0
    IDEAL_PRODUCTIVITY  = 90.0
    IDEAL_UTILIZATION   = 80.0
    IDEAL_COMPLETION    = 92.0
    IDEAL_ENGAGEMENT    = 85.0

    # ─── Dimension Weights (must sum to 100) ──────────────────────────────────
    WEIGHTS = {
        "attendance":   25,
        "productivity": 30,
        "completion":   25,
        "engagement":   20,
    }

    def compute(self, team_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compute team health from a list of employee records.

        Args:
            team_data: Dict containing managerId and list of employee metrics.

        Returns:
            Full team health report with scores and insights.
        """
        try:
            manager_id = team_data.get("managerId", 0)
            employees  = team_data.get("employees", [])

            logger.info(
                f"[TeamHealth] Computing for managerId={manager_id}, "
                f"team_size={len(employees)}"
            )

            if not employees:
                return self._empty_response(manager_id)

            # ── Aggregate Per-Dimension ────────────────────────────────────────
            attendance_vals   = [float(e.get("attendancePercentage", 0)) for e in employees]
            productivity_vals = [float(e.get("productivityScore", 0))    for e in employees]
            utilization_vals  = [float(e.get("utilizationPercentage", 0)) for e in employees]
            completion_vals   = [float(e.get("completionRate", 0))        for e in employees]
            burnout_vals      = [float(e.get("burnoutRisk", 0))           for e in employees]

            # ── Dimension Scores (0–100) ───────────────────────────────────────
            attendance_score   = self._normalize_score(
                statistics.mean(attendance_vals), 0, self.IDEAL_ATTENDANCE
            )
            productivity_score = self._normalize_score(
                statistics.mean(productivity_vals), 0, self.IDEAL_PRODUCTIVITY
            )
            utilization_score  = self._normalize_score(
                statistics.mean(utilization_vals), 0, self.IDEAL_UTILIZATION
            )
            completion_score   = self._normalize_score(
                statistics.mean(completion_vals), 0, self.IDEAL_COMPLETION
            )
            # Engagement inversely influenced by burnout
            avg_burnout     = statistics.mean(burnout_vals) if burnout_vals else 0
            engagement_score = max(0, min(100, 100 - avg_burnout))

            # ── Weighted Team Health ───────────────────────────────────────────
            team_health = (
                attendance_score   * (self.WEIGHTS["attendance"] / 100.0) +
                productivity_score * (self.WEIGHTS["productivity"] / 100.0) +
                completion_score   * (self.WEIGHTS["completion"] / 100.0) +
                engagement_score   * (self.WEIGHTS["engagement"] / 100.0)
            )
            team_health = round(min(max(team_health, 0), 100))

            # ── Identify Top / Bottom Performers ──────────────────────────────
            ranked_employees = sorted(
                employees,
                key=lambda e: float(e.get("productivityScore", 0)),
                reverse=True,
            )
            top_performers    = ranked_employees[:3]
            bottom_performers = ranked_employees[-3:][::-1]

            # ── High-Risk Employees ────────────────────────────────────────────
            high_risk = [
                e for e in employees
                if float(e.get("burnoutRisk", 0)) >= 70
                or float(e.get("attritionRisk", 0)) >= 70
            ]

            # ── Category ──────────────────────────────────────────────────────
            category = self._classify_category(team_health)

            # ── Insights ──────────────────────────────────────────────────────
            insights = self._generate_insights(
                team_health, attendance_score, productivity_score,
                completion_score, engagement_score, len(high_risk), len(employees)
            )

            result = {
                "managerId":         manager_id,
                "teamSize":          len(employees),
                "teamHealth":        team_health,
                "category":          category,
                "attendanceScore":   round(attendance_score),
                "productivityScore": round(productivity_score),
                "utilizationScore":  round(utilization_score),
                "completionScore":   round(completion_score),
                "engagementScore":   round(engagement_score),
                "averageBurnout":    round(avg_burnout),
                "highRiskCount":     len(high_risk),
                "topPerformers":     [self._summary(e) for e in top_performers],
                "bottomPerformers":  [self._summary(e) for e in bottom_performers],
                "highRiskEmployees": [self._summary(e) for e in high_risk],
                "insights":          insights,
            }

            logger.info(
                f"[TeamHealth] managerId={manager_id} → "
                f"health={team_health}, category={category}"
            )
            return result

        except Exception as e:
            logger.exception(f"[TeamHealth] Computation failed: {e}")
            raise

    # ─── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _normalize_score(value: float, min_val: float, max_val: float) -> float:
        """Linear normalization to 0–100 clamped."""
        if max_val == min_val:
            return 100.0
        normalized = ((value - min_val) / (max_val - min_val)) * 100.0
        return max(0.0, min(100.0, normalized))

    @staticmethod
    def _classify_category(score: int) -> str:
        if score >= 90:
            return "Excellent"
        elif score >= 75:
            return "Good"
        elif score >= 60:
            return "Average"
        return "Needs Attention"

    @staticmethod
    def _summary(employee: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "employeeId":        employee.get("employeeId"),
            "name":              employee.get("name", "N/A"),
            "productivityScore": round(float(employee.get("productivityScore", 0))),
            "attendancePercentage": round(float(employee.get("attendancePercentage", 0))),
            "burnoutRisk":       round(float(employee.get("burnoutRisk", 0))),
        }

    @staticmethod
    def _generate_insights(
        health: int, attendance: float, productivity: float,
        completion: float, engagement: float,
        high_risk_count: int, team_size: int,
    ) -> List[str]:
        insights = []
        if health >= 90:
            insights.append("Team is performing at an excellent level across all dimensions")
        elif health >= 75:
            insights.append("Team health is good — minor improvements possible")
        elif health >= 60:
            insights.append("Team health is average — focused intervention recommended")
        else:
            insights.append("Team health needs immediate attention from management")

        if attendance < 70:
            insights.append("Attendance is critically low — investigate root causes")
        elif attendance < 80:
            insights.append("Attendance below target — monitor closely")

        if productivity < 60:
            insights.append("Productivity below benchmark — consider workload rebalancing")

        if completion < 70:
            insights.append("Task completion rate needs improvement — review deadlines")

        if engagement < 60:
            insights.append("Low team engagement — burnout risk across team is elevated")

        risk_pct = (high_risk_count / team_size * 100) if team_size > 0 else 0
        if risk_pct >= 30:
            insights.append(
                f"{high_risk_count} employees ({risk_pct:.0f}%) flagged as high risk"
            )
        elif high_risk_count > 0:
            insights.append(f"{high_risk_count} employee(s) require individual attention")

        return insights[:5]

    @staticmethod
    def _empty_response(manager_id: int) -> Dict[str, Any]:
        return {
            "managerId":         manager_id,
            "teamSize":          0,
            "teamHealth":        0,
            "category":          "No Data",
            "attendanceScore":   0,
            "productivityScore": 0,
            "utilizationScore":  0,
            "completionScore":   0,
            "engagementScore":   0,
            "averageBurnout":    0,
            "highRiskCount":     0,
            "topPerformers":     [],
            "bottomPerformers":  [],
            "highRiskEmployees": [],
            "insights":          ["No team data available"],
        }