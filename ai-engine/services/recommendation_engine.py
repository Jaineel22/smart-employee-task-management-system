"""
AI-4D: Recommendation Engine
Dynamic, context-aware recommendations.
Result does NOT contain employeeId — route injects it.
"""

import logging
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)

# Each rule: (condition_fn, recommendation_text, improvement_points)
_RULES: List[Tuple] = [
    # Attendance
    (lambda d: d.get("attendance_pct", 100) < 65,
     "Improve attendance consistency — aim for at least 80% monthly attendance", 6),
    (lambda d: 65 <= d.get("attendance_pct", 100) < 75,
     "Increase attendance rate to above 80% for better productivity scores", 4),

    # Overdue / pending tasks
    (lambda d: d.get("overdue_tasks", 0) >= 5,
     "Prioritize clearing overdue tasks — set aside focused time blocks daily", 8),
    (lambda d: 2 <= d.get("overdue_tasks", 0) < 5,
     "Reduce overdue tasks by 50% in the next two weeks", 5),
    (lambda d: d.get("pending_tasks", 0) >= 10,
     "Break large pending task backlog into daily achievable sub-goals", 6),

    # Utilization
    (lambda d: d.get("utilization_pct", 70) > 90,
     "Utilization is critically high — request workload redistribution from manager", 7),
    (lambda d: d.get("utilization_pct", 70) < 50,
     "Utilization is low — take on additional tasks to improve contribution scores", 5),

    # Burnout
    (lambda d: d.get("burnout_score", 0) >= 70,
     "High burnout detected — schedule a recovery plan with mandatory rest days", 9),
    (lambda d: 40 <= d.get("burnout_score", 0) < 70,
     "Moderate burnout risk — limit overtime and focus on work-life balance", 5),

    # Attrition
    (lambda d: d.get("attrition_score", 0) >= 70,
     "Significant disengagement signals — discuss career goals with your manager", 8),
    (lambda d: 40 <= d.get("attrition_score", 0) < 70,
     "Engagement slightly declining — set clear short-term objectives to regain focus", 4),

    # Productivity
    (lambda d: d.get("productivity_pct", 70) < 50,
     "Productivity critically low — identify and eliminate top 3 time-wasting activities", 10),
    (lambda d: 50 <= d.get("productivity_pct", 70) < 65,
     "Use time-blocking techniques to improve daily productivity output", 6),
    (lambda d: d.get("productivity_pct", 70) >= 85,
     "Excellent productivity — consider mentoring teammates to sustain team performance", 3),

    # Daily hours
    (lambda d: d.get("daily_avg_hours", 8) > 9,
     "Reduce daily working hours — sustained overwork degrades long-term output quality", 7),

    # Report consistency
    (lambda d: d.get("report_consistency", 80) < 50,
     "Submit daily work reports consistently — this directly impacts efficiency scores", 5),
    (lambda d: 50 <= d.get("report_consistency", 80) < 70,
     "Improve report submission rate to above 80% for accurate productivity tracking", 3),

    # Consecutive days
    (lambda d: d.get("consecutive_work_days", 0) >= 10,
     "Take a planned day off — continuous work streaks reduce cognitive performance", 6),
]


class RecommendationEngine:
    """Generates personalised recommendations from employee metrics."""

    def generate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Returns:
            recommendations    List[str]
            expectedImprovement int
        NOTE: employeeId is NOT in the result — route injects it.
        """
        try:
            matched: List[Tuple[str, int]] = []

            for condition, text, pts in _RULES:
                try:
                    if condition(data):
                        matched.append((text, pts))
                except Exception:
                    continue

            # Sort by impact descending, cap at 6
            matched.sort(key=lambda x: x[1], reverse=True)
            top = matched[:6]

            recommendations = [r for r, _ in top]
            total_pts = sum(p for _, p in top)
            expected_improvement = int(min(25, max(2, round(total_pts * 0.6))))

            if not recommendations:
                recommendations = [
                    "Continue current work patterns — performance is healthy",
                    "Focus on consistent daily reporting for accurate analytics",
                    "Collaborate with teammates to share knowledge and boost team scores",
                ]
                expected_improvement = 3

            result = {
                "recommendations":    recommendations,
                "expectedImprovement": expected_improvement,
            }
            logger.info(
                "[RecommendationEngine] %d recommendations, expectedImprovement=%d",
                len(recommendations), expected_improvement,
            )
            return result

        except Exception as e:
            logger.exception("[RecommendationEngine] error: %s", e)
            return {
                "recommendations":    ["Focus on maintaining consistent work patterns"],
                "expectedImprovement": 2,
            }


# ── backward-compat function ──────────────────────────────────────────────────
def generate_recommendations(data: Dict[str, Any]) -> Dict[str, Any]:
    """Result does NOT contain employeeId — route injects it."""
    return RecommendationEngine().generate(data)