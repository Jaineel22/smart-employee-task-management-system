"""
AI-4C: Team Health Engine
Bug fixed:
  - topPerformers / bottomPerformers / highRiskEmployees now correctly
    read the "employeeId" key that EmployeeMetric.dict() produces
    (Pydantic camelCase field → dict key is "employeeId", not "employee_id")
  - calculate() result does NOT contain managerId — route injects it
"""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class TeamHealthEngine:
    """
    Aggregate health scorer.
    Call .calculate(employees) — result dict does NOT contain managerId.
    The route injects it: TeamHealthResponse(managerId=X, **result)
    """

    def calculate(self, employees: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        employees: list of dicts from EmployeeMetric.dict(), keys are camelCase:
            employeeId          int
            attendance_pct      float  (Pydantic field alias kept as-is)
            productivity_pct    float
            utilization_pct     float
            task_completion     float
            report_consistency  float
            burnout_score       float
            attrition_score     float
        """
        if not employees:
            return self._empty()

        try:
            n = len(employees)

            def avg(key: str, default: float = 75.0) -> float:
                vals = [self._f(e, key, default) for e in employees]
                return round(sum(vals) / len(vals), 1)

            attendance_score   = avg("attendance_pct",    80.0)
            productivity_score = avg("productivity_pct",  70.0)
            utilization_score  = avg("utilization_pct",   70.0)
            completion_score   = avg("task_completion",   75.0)
            report_score       = avg("report_consistency", 70.0)

            # Engagement: weighted composite minus low-engagement penalty
            low_eng = sum(
                1 for e in employees
                if self._f(e, "report_consistency", 70) < 50
                or self._f(e, "attendance_pct", 80) < 65
            )
            engagement_penalty = (low_eng / n) * 20
            engagement_score = max(0.0, round(
                report_score       * 0.5
                + attendance_score * 0.3
                + productivity_score * 0.2
                - engagement_penalty,
                1,
            ))

            # Burnout penalty
            high_burnout_count = sum(
                1 for e in employees
                if self._f(e, "burnout_score", 0) >= 70
            )
            burnout_penalty = (high_burnout_count / n) * 10

            # Weighted team health
            team_health = round(
                attendance_score   * 0.25
                + productivity_score * 0.25
                + completion_score   * 0.20
                + engagement_score   * 0.20
                + utilization_score  * 0.10
                - burnout_penalty,
                1,
            )
            team_health = min(100.0, max(0.0, team_health))

            if team_health >= 90:
                category = "Excellent"
            elif team_health >= 75:
                category = "Good"
            elif team_health >= 60:
                category = "Average"
            else:
                category = "Needs Attention"

            # ── Employee ID resolution ────────────────────────────────────────
            # EmployeeMetric.dict() uses the Pydantic field name "employeeId"
            # Support both just in case
            def get_emp_id(e: Dict) -> Optional[int]:
                v = e.get("employeeId", e.get("employee_id"))
                return int(v) if v is not None else None

            # Performance composite score
            def perf(e: Dict) -> float:
                return (
                    self._f(e, "productivity_pct", 70) * 0.4
                    + self._f(e, "task_completion",   75) * 0.3
                    + self._f(e, "attendance_pct",    80) * 0.3
                )

            sorted_emps       = sorted(employees, key=perf, reverse=True)
            top_performers    = [get_emp_id(e) for e in sorted_emps[:3]]
            bottom_performers = [get_emp_id(e) for e in sorted_emps[-3:]]

            high_risk = [
                get_emp_id(e) for e in employees
                if self._f(e, "burnout_score",   0) >= 70
                or self._f(e, "attrition_score", 0) >= 70
            ]

            # Strip None values (employees with missing IDs)
            result = {
                "teamHealth":        team_health,
                "category":          category,
                "attendanceScore":   attendance_score,
                "productivityScore": productivity_score,
                "completionScore":   completion_score,
                "engagementScore":   engagement_score,
                "utilizationScore":  utilization_score,
                "teamSize":          n,
                "highRiskEmployees": [x for x in high_risk       if x is not None],
                "topPerformers":     [x for x in top_performers    if x is not None],
                "bottomPerformers":  [x for x in bottom_performers if x is not None],
            }
            logger.info(
                "[TeamHealthEngine] teamHealth=%.1f category=%s n=%d highRisk=%d",
                team_health, category, n, len(result["highRiskEmployees"]),
            )
            return result

        except Exception as e:
            logger.exception("[TeamHealthEngine] error: %s", e)
            return self._empty()

    @staticmethod
    def _empty() -> Dict[str, Any]:
        return {
            "teamHealth": 0.0,        "category": "Needs Attention",
            "attendanceScore": 0.0,   "productivityScore": 0.0,
            "completionScore": 0.0,   "engagementScore": 0.0,
            "utilizationScore": 0.0,  "teamSize": 0,
            "highRiskEmployees": [],  "topPerformers": [],  "bottomPerformers": [],
        }

    @staticmethod
    def _f(data: Dict, key: str, default: float) -> float:
        try:
            v = data.get(key, default)
            return float(v) if v is not None else float(default)
        except (TypeError, ValueError):
            return float(default)


# ── backward-compat ───────────────────────────────────────────────────────────
def calculate_team_health(employees: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Result does NOT contain managerId — route injects it."""
    return TeamHealthEngine().calculate(employees)