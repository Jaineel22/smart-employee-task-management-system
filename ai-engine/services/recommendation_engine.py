"""
recommendation_engine.py
========================
AI-5: Extended Recommendation Engine
Extends the existing AI-4D engine with:
  - Structured output (category, priority, impactScore, confidence)
  - Uses recommendation_rules.py for rule separation
  - Backward-compatible: generate_recommendations() still works as before
  - New method: generate_structured() for AI-5 API

AI-4D backward compat is fully preserved.
"""

import logging
from typing import Dict, Any, List, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)

# ── AI-4D backward-compat rules (unchanged) ──────────────────────────────────
_LEGACY_RULES: List[Tuple] = [
    (lambda d: d.get("attendance_pct", 100) < 65,
     "Improve attendance consistency — aim for at least 80% monthly attendance", 6),
    (lambda d: 65 <= d.get("attendance_pct", 100) < 75,
     "Increase attendance rate to above 80% for better productivity scores", 4),
    (lambda d: d.get("overdue_tasks", 0) >= 5,
     "Prioritize clearing overdue tasks — set aside focused time blocks daily", 8),
    (lambda d: 2 <= d.get("overdue_tasks", 0) < 5,
     "Reduce overdue tasks by 50% in the next two weeks", 5),
    (lambda d: d.get("pending_tasks", 0) >= 10,
     "Break large pending task backlog into daily achievable sub-goals", 6),
    (lambda d: d.get("utilization_pct", 70) > 90,
     "Utilization is critically high — request workload redistribution from manager", 7),
    (lambda d: d.get("utilization_pct", 70) < 50,
     "Utilization is low — take on additional tasks to improve contribution scores", 5),
    (lambda d: d.get("burnout_score", 0) >= 70,
     "High burnout detected — schedule a recovery plan with mandatory rest days", 9),
    (lambda d: 40 <= d.get("burnout_score", 0) < 70,
     "Moderate burnout risk — limit overtime and focus on work-life balance", 5),
    (lambda d: d.get("attrition_score", 0) >= 70,
     "Significant disengagement signals — discuss career goals with your manager", 8),
    (lambda d: 40 <= d.get("attrition_score", 0) < 70,
     "Engagement slightly declining — set clear short-term objectives to regain focus", 4),
    (lambda d: d.get("productivity_pct", 70) < 50,
     "Productivity critically low — identify and eliminate top 3 time-wasting activities", 10),
    (lambda d: 50 <= d.get("productivity_pct", 70) < 65,
     "Use time-blocking techniques to improve daily productivity output", 6),
    (lambda d: d.get("productivity_pct", 70) >= 85,
     "Excellent productivity — consider mentoring teammates to sustain team performance", 3),
    (lambda d: d.get("daily_avg_hours", 8) > 9,
     "Reduce daily working hours — sustained overwork degrades long-term output quality", 7),
    (lambda d: d.get("report_consistency", 80) < 50,
     "Submit daily work reports consistently — this directly impacts efficiency scores", 5),
    (lambda d: 50 <= d.get("report_consistency", 80) < 70,
     "Improve report submission rate to above 80% for accurate productivity tracking", 3),
    (lambda d: d.get("consecutive_work_days", 0) >= 10,
     "Take a planned day off — continuous work streaks reduce cognitive performance", 6),
]


class RecommendationEngine:
    """
    AI-5 Extended Recommendation Engine.
    Backward-compatible with AI-4D — generate() still works unchanged.
    New method generate_structured() produces full AI-5 schema.
    """

    # ── AI-4D: backward-compat method (unchanged) ─────────────────────────────
    def generate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Returns:
            recommendations    List[str]
            expectedImprovement int
        NOTE: employeeId is NOT in the result — route injects it.
        """
        try:
            matched: List[Tuple[str, int]] = []
            for condition, text, pts in _LEGACY_RULES:
                try:
                    if condition(data):
                        matched.append((text, pts))
                except Exception:
                    continue

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
                "recommendations":     recommendations,
                "expectedImprovement": expected_improvement,
            }
            logger.info("[RecommendationEngine] %d recommendations, expectedImprovement=%d",
                        len(recommendations), expected_improvement)
            return result

        except Exception as e:
            logger.exception("[RecommendationEngine] error: %s", e)
            return {
                "recommendations":     ["Focus on maintaining consistent work patterns"],
                "expectedImprovement": 2,
            }

    # ── AI-5: structured recommendations ─────────────────────────────────────
    def generate_structured(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        AI-5 enhanced output:
            recommendations  List[{message, category, priority, impactScore, confidence}]
            overallPriority  str
            totalCount       int

        employeeId is NOT in result — route injects it.
        """
        try:
            structured = []

            # Define AI-5 structured rules
            structured_rules = self._get_structured_rules()

            for condition, message_fn, category, priority_fn, impact, confidence in structured_rules:
                try:
                    if condition(data):
                        structured.append({
                            "message":     message_fn(data),
                            "category":    category,
                            "priority":    priority_fn(data),
                            "impactScore": impact,
                            "confidence":  confidence,
                            "generatedAt": datetime.now().isoformat(),
                        })
                except Exception:
                    continue

            # Sort: HIGH first, then by impact desc
            priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
            structured.sort(key=lambda r: (
                priority_order.get(r["priority"], 2),
                -(r["impactScore"] or 0),
            ))
            structured = structured[:8]  # cap at 8

            overall = "LOW"
            if any(r["priority"] == "HIGH" for r in structured):
                overall = "HIGH"
            elif any(r["priority"] == "MEDIUM" for r in structured):
                overall = "MEDIUM"

            if not structured:
                structured = [{
                    "message":     "Continue current work patterns — performance is healthy",
                    "category":    "CONSISTENCY",
                    "priority":    "LOW",
                    "impactScore": 30,
                    "confidence":  70,
                    "generatedAt": datetime.now().isoformat(),
                }]

            logger.info("[RecommendationEngine] structured=%d overall=%s",
                        len(structured), overall)

            return {
                "recommendations": structured,
                "overallPriority": overall,
                "totalCount":      len(structured),
            }

        except Exception as e:
            logger.exception("[RecommendationEngine] structured error: %s", e)
            return {
                "recommendations": [],
                "overallPriority": "LOW",
                "totalCount":      0,
            }

    def _get_structured_rules(self) -> List[Tuple]:
        """
        Returns AI-5 structured recommendation rules.
        Each rule: (condition, message_fn, category, priority_fn, impactScore, confidence)
        """
        return [
            # Attendance rules
            (
                lambda d: d.get("attendance_pct", 100) < 65,
                lambda d: f"Your attendance is critically low ({d.get('attendance_pct', 0):.0f}%) — aim for at least 80% monthly attendance",
                "ATTENDANCE",
                lambda d: "HIGH",
                90, 88
            ),
            (
                lambda d: 65 <= d.get("attendance_pct", 100) < 75,
                lambda d: f"Attendance dropped to {d.get('attendance_pct', 0):.0f}% this month — increase consistency to above 80%",
                "ATTENDANCE",
                lambda d: "MEDIUM",
                70, 82
            ),
            (
                lambda d: 75 <= d.get("attendance_pct", 100) < 85,
                lambda d: f"Good attendance ({d.get('attendance_pct', 0):.0f}%) — maintain this to maximise your productivity score",
                "CONSISTENCY",
                lambda d: "LOW",
                40, 75
            ),

            # Productivity rules
            (
                lambda d: d.get("productivity_pct", 70) < 45,
                lambda d: f"Productivity critically low ({d.get('productivity_pct', 0):.0f}%) — identify and eliminate top 3 time-wasting activities",
                "PRODUCTIVITY_IMPROVEMENT",
                lambda d: "HIGH",
                95, 90
            ),
            (
                lambda d: 45 <= d.get("productivity_pct", 70) < 60,
                lambda d: "Use time-blocking techniques — allocate dedicated 2-hour focus blocks for your highest-priority tasks daily",
                "TIME_MANAGEMENT",
                lambda d: "HIGH",
                80, 85
            ),
            (
                lambda d: 60 <= d.get("productivity_pct", 70) < 72,
                lambda d: f"Productivity at {d.get('productivity_pct', 0):.0f}% — completing pending tasks before accepting new ones will push this above 75%",
                "FOCUS",
                lambda d: "MEDIUM",
                60, 78
            ),
            (
                lambda d: d.get("productivity_pct", 70) >= 85,
                lambda d: f"Excellent productivity ({d.get('productivity_pct', 0):.0f}%) — consider mentoring teammates to sustain team performance",
                "SKILL_IMPROVEMENT",
                lambda d: "LOW",
                35, 72
            ),

            # Overdue tasks rules
            (
                lambda d: d.get("overdue_tasks", 0) >= 5,
                lambda d: f"{d.get('overdue_tasks', 0)} overdue tasks detected — set aside 2 dedicated hours daily to clear the backlog",
                "TASK_PRIORITIZATION",
                lambda d: "HIGH",
                92, 91
            ),
            (
                lambda d: 2 <= d.get("overdue_tasks", 0) < 5,
                lambda d: f"Reduce overdue tasks ({d.get('overdue_tasks', 0)} overdue) by 50% this week — focus on oldest deadlines first",
                "DEADLINE_MANAGEMENT",
                lambda d: "HIGH",
                85, 87
            ),
            (
                lambda d: d.get("overdue_tasks", 0) == 1,
                lambda d: "1 overdue task — clear it today before working on in-progress items",
                "DEADLINE_MANAGEMENT",
                lambda d: "MEDIUM",
                70, 82
            ),

            # Pending tasks / workload rules
            (
                lambda d: d.get("pending_tasks", 0) >= 10,
                lambda d: f"Heavy backlog: {d.get('pending_tasks', 0)} pending tasks — break them into daily achievable sub-goals",
                "WORKLOAD_BALANCING",
                lambda d: "HIGH",
                88, 84
            ),
            (
                lambda d: 6 <= d.get("pending_tasks", 0) < 10,
                lambda d: f"Elevated pending task count ({d.get('pending_tasks', 0)}) — complete current assignments before taking on new ones",
                "FOCUS",
                lambda d: "MEDIUM",
                65, 79
            ),

            # Utilization rules
            (
                lambda d: d.get("utilization_pct", 70) > 95,
                lambda d: f"Utilization critically high ({d.get('utilization_pct', 0):.0f}%) — speak with your manager about redistributing some tasks",
                "WORKLOAD_BALANCING",
                lambda d: "HIGH",
                87, 83
            ),
            (
                lambda d: d.get("utilization_pct", 70) < 45,
                lambda d: f"Utilization is low ({d.get('utilization_pct', 0):.0f}%) — take on additional tasks to improve your contribution score",
                "PRODUCTIVITY_IMPROVEMENT",
                lambda d: "MEDIUM",
                60, 76
            ),

            # Burnout rules
            (
                lambda d: d.get("burnout_score", 0) >= 70,
                lambda d: "High burnout detected — schedule a recovery plan with mandatory rest days",
                "WORK_LIFE_BALANCE",
                lambda d: "HIGH",
                95, 92
            ),
            (
                lambda d: 40 <= d.get("burnout_score", 0) < 70,
                lambda d: "Moderate burnout risk — limit overtime and focus on work-life balance",
                "WORK_LIFE_BALANCE",
                lambda d: "MEDIUM",
                70, 85
            ),

            # Attrition rules
            (
                lambda d: d.get("attrition_score", 0) >= 70,
                lambda d: "Significant disengagement signals — discuss career goals with your manager",
                "CAREER_DEVELOPMENT",
                lambda d: "HIGH",
                85, 88
            ),
            (
                lambda d: 40 <= d.get("attrition_score", 0) < 70,
                lambda d: "Engagement slightly declining — set clear short-term objectives to regain focus",
                "CAREER_DEVELOPMENT",
                lambda d: "MEDIUM",
                65, 80
            ),

            # Report consistency rules
            (
                lambda d: d.get("report_consistency", 80) < 50,
                lambda d: f"Daily work report submission rate is very low ({d.get('report_consistency', 0):.0f}%) — reports directly impact your efficiency calculation",
                "CONSISTENCY",
                lambda d: "HIGH",
                80, 86
            ),
            (
                lambda d: 50 <= d.get("report_consistency", 80) < 70,
                lambda d: "Improve report submission rate to above 80% for accurate productivity tracking",
                "CONSISTENCY",
                lambda d: "MEDIUM",
                55, 78
            ),

            # Daily hours rules
            (
                lambda d: d.get("daily_avg_hours", 8) > 10,
                lambda d: f"Working {d.get('daily_avg_hours', 0):.0f} hours/day — sustained overwork degrades long-term output quality",
                "WORK_LIFE_BALANCE",
                lambda d: "HIGH",
                85, 88
            ),
            (
                lambda d: 9 < d.get("daily_avg_hours", 8) <= 10,
                lambda d: f"Daily hours ({d.get('daily_avg_hours', 0):.0f}h) above healthy range — consider reducing for better sustainability",
                "WORK_LIFE_BALANCE",
                lambda d: "MEDIUM",
                65, 80
            ),

            # Consecutive work days rules
            (
                lambda d: d.get("consecutive_work_days", 0) >= 10,
                lambda d: f"Worked {d.get('consecutive_work_days', 0)} days without break — take a planned day off",
                "WORK_LIFE_BALANCE",
                lambda d: "HIGH",
                75, 85
            ),
        ]


# ── Backward-compat function (AI-4D unchanged) ────────────────────────────────
def generate_recommendations(data: Dict[str, Any]) -> Dict[str, Any]:
    """AI-4D backward-compat — result does NOT contain employeeId."""
    return RecommendationEngine().generate(data)


# ── AI-5 new function ─────────────────────────────────────────────────────────
def generate_structured_recommendations(data: Dict[str, Any]) -> Dict[str, Any]:
    """AI-5 structured output — result does NOT contain employeeId."""
    return RecommendationEngine().generate_structured(data)