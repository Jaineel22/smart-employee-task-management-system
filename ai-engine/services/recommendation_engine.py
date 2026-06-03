"""
Recommendation Engine
Generates dynamic, context-aware AI recommendations for each employee.
All recommendations are data-driven — no hardcoded responses.
"""

import logging
import random
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    Generates prioritized, actionable recommendations based on:
    - Productivity score
    - Burnout risk
    - Attrition risk
    - Attendance patterns
    - Utilization rate
    - Task backlog (pending + overdue)
    """

    def generate(self, employee_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate personalized recommendations for an employee.

        Args:
            employee_data: Aggregated employee metrics dict.

        Returns:
            Dict with recommendations list and expected improvement %.
        """
        try:
            employee_id = employee_data.get("employeeId", 0)
            logger.info(f"[Recommendation] Generating for employeeId={employee_id}")

            # ── Extract Inputs ─────────────────────────────────────────────────
            productivity    = float(employee_data.get("productivityScore", 70.0))
            burnout_risk    = float(employee_data.get("burnoutRisk", 30.0))
            attrition_risk  = float(employee_data.get("attritionRisk", 20.0))
            attendance      = float(employee_data.get("attendancePercentage", 90.0))
            utilization     = float(employee_data.get("utilizationPercentage", 70.0))
            pending_tasks   = int(employee_data.get("pendingTasks", 0))
            overdue_tasks   = int(employee_data.get("overdueTasks", 0))
            report_consist  = float(employee_data.get("reportConsistency", 1.0))
            completion_rate = float(employee_data.get("completionRate", 85.0))

            # ── Generate Prioritized Recommendations ───────────────────────────
            recs: List[Tuple[int, str]] = []  # (priority, message)

            # ── Burnout Interventions ──────────────────────────────────────────
            if burnout_risk >= 70:
                recs.append((1, "Schedule immediate workload review with manager to prevent burnout"))
                recs.append((1, f"Reduce daily working hours — currently exceeding healthy limits"))
                recs.append((2, "Take at least one full recovery day this week"))

            elif burnout_risk >= 40:
                recs.append((2, "Monitor your work-life balance — burnout indicators are rising"))
                recs.append((2, "Consider delegating lower-priority tasks to reduce pressure"))

            # ── Attrition Interventions ────────────────────────────────────────
            if attrition_risk >= 70:
                recs.append((1, "Schedule a career growth conversation with your manager"))
                recs.append((2, "Engage with team collaboration activities to rebuild connection"))

            elif attrition_risk >= 40:
                recs.append((3, "Share any workplace concerns with HR or management proactively"))

            # ── Task Management ────────────────────────────────────────────────
            if overdue_tasks >= 4:
                recs.append((1, f"Urgently address {overdue_tasks} overdue tasks — prioritize by deadline impact"))
            elif overdue_tasks >= 2:
                recs.append((2, f"Clear {overdue_tasks} overdue tasks before accepting new assignments"))
            elif overdue_tasks == 1:
                recs.append((3, "Resolve the overdue task to maintain delivery consistency"))

            if pending_tasks >= 7:
                recs.append((2, f"Pending task backlog ({pending_tasks} tasks) needs structured planning"))
            elif pending_tasks >= 4:
                recs.append((3, f"Break down pending tasks into daily actionable chunks"))

            # ── Productivity Improvements ──────────────────────────────────────
            if productivity < 50:
                recs.append((1, "Productivity is critically low — identify and remove key blockers"))
                recs.append((2, "Set daily micro-goals to rebuild momentum and output consistency"))
            elif productivity < 65:
                recs.append((2, "Use time-blocking techniques to improve daily output"))
                recs.append((3, "Review task prioritization strategy — focus on high-impact items"))
            elif productivity < 80:
                recs.append((3, "Slight productivity improvement possible — minimize context-switching"))

            # ── Attendance ─────────────────────────────────────────────────────
            if attendance < 70:
                recs.append((1, f"Attendance at {attendance:.0f}% is critically low — address immediately"))
            elif attendance < 80:
                recs.append((2, f"Improve attendance consistency — currently at {attendance:.0f}%"))
            elif attendance < 88:
                recs.append((3, f"Attendance at {attendance:.0f}% — small improvements will boost reliability"))

            # ── Utilization ────────────────────────────────────────────────────
            if utilization < 50:
                recs.append((3, "Low utilization detected — engage with manager on capacity allocation"))
            elif utilization > 95:
                recs.append((2, "Utilization critically high — request workload rebalancing"))
            elif utilization > 85:
                recs.append((3, "High utilization rate — ensure recovery time is built into schedule"))

            # ── Report Submission ──────────────────────────────────────────────
            if report_consist < 0.5:
                recs.append((1, "Improve report submission rate — currently below 50%"))
            elif report_consist < 0.75:
                recs.append((2, "Submit daily/weekly reports consistently to demonstrate engagement"))

            # ── Completion Rate ────────────────────────────────────────────────
            if completion_rate < 60:
                recs.append((2, f"Task completion rate ({completion_rate:.0f}%) needs significant improvement"))
            elif completion_rate < 75:
                recs.append((3, f"Aim to complete at least 80% of assigned tasks per sprint"))

            # ── Default Positive Recommendation ───────────────────────────────
            if not recs or all(p >= 3 for p, _ in recs):
                recs.append((4, "Maintain current performance — you are on a strong trajectory"))

            # ── Sort by Priority & Deduplicate ────────────────────────────────
            recs.sort(key=lambda x: x[0])
            seen = set()
            unique_recs: List[str] = []
            for _, msg in recs:
                if msg not in seen:
                    seen.add(msg)
                    unique_recs.append(msg)
                if len(unique_recs) >= 6:
                    break

            # ── Expected Improvement ───────────────────────────────────────────
            expected_improvement = self._estimate_improvement(
                productivity, burnout_risk, attrition_risk, attendance, len(unique_recs)
            )

            result = {
                "employeeId":          employee_id,
                "recommendations":     unique_recs,
                "expectedImprovement": expected_improvement,
                "priority":            "HIGH" if any(p == 1 for p, _ in recs) else
                                       "MEDIUM" if any(p == 2 for p, _ in recs) else "LOW",
                "recommendationCount": len(unique_recs),
            }

            logger.info(
                f"[Recommendation] employeeId={employee_id} → "
                f"{len(unique_recs)} recommendations, "
                f"expectedImprovement={expected_improvement}%"
            )
            return result

        except Exception as e:
            logger.exception(f"[Recommendation] Generation failed: {e}")
            raise

    @staticmethod
    def _estimate_improvement(
        productivity: float,
        burnout: float,
        attrition: float,
        attendance: float,
        rec_count: int,
    ) -> int:
        """
        Estimate % productivity improvement if all recommendations are followed.
        Based on current gaps from ideal state.
        """
        # Gap from ideal
        prod_gap        = max(0, 90 - productivity)
        burnout_penalty = burnout * 0.05       # burnout suppresses recovery
        attend_gap      = max(0, 90 - attendance) * 0.3

        potential = (prod_gap * 0.35) + (attend_gap) - (burnout_penalty * 0.1)
        potential = max(2, min(potential, 25))  # clamp between 2–25%

        # More targeted recommendations → slightly higher estimated benefit
        potential += rec_count * 0.3
        return round(min(potential, 25))