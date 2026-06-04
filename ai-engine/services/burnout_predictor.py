"""
AI-4A: Burnout Detection Engine
Matches the field names sent by burnout_routes.py (YOUR existing file):
  attendancePercentage, monthlyHoursWorked, dailyAverageHours,
  pendingTasks, overdueTasks, utilizationPercentage,
  consecutiveWorkDays, reportsTotal, reportsSubmitted
Also supports the snake_case aliases used in the GET query-param path.
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class BurnoutPredictor:
    """
    Stateless burnout risk calculator.
    Instantiate once (module-level) and call .predict(data) per request.

    Accepts both camelCase (from POST body via BurnoutRequest) and
    snake_case (from GET query params) field names so either call path works.
    """

    HIGH_THRESHOLD   = 70
    MEDIUM_THRESHOLD = 40

    # ── Normalise incoming dict to a consistent internal key set ─────────────
    def _normalise(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Maps camelCase keys (from BurnoutRequest.dict()) AND
        snake_case keys (legacy / GET path) to a single internal set.
        Always safe — missing keys fall back to sensible defaults.
        """
        def pick(*keys, default=0.0):
            for k in keys:
                v = data.get(k)
                if v is not None:
                    return v
            return default

        return {
            "employee_id":             pick("employeeId", "employee_id",          default=None),
            "attendance_pct":          pick("attendancePercentage",  "attendance_pct",          default=90.0),
            "monthly_hours":           pick("monthlyHoursWorked",    "monthly_hours",            default=176.0),
            "daily_avg_hours":         pick("dailyAverageHours",     "daily_avg_hours",          default=8.0),
            "pending_tasks":           pick("pendingTasks",          "pending_tasks",            default=0),
            "overdue_tasks":           pick("overdueTasks",          "overdue_tasks",            default=0),
            "utilization_pct":         pick("utilizationPercentage", "utilization_pct",          default=70.0),
            "consecutive_work_days":   pick("consecutiveWorkDays",   "consecutive_work_days",    default=5),
            "reports_submitted":       pick("reportsSubmitted",      "reports_submitted",        default=20),
            "total_reports_expected":  pick("reportsTotal",          "total_reports_expected",   default=20),
        }

    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Returns a dict that satisfies BurnoutResponse:
            employeeId   : int
            burnoutRisk  : int
            level        : str
            reasons      : List[str]
            factorScores : Dict[str, int]   ← required by your BurnoutResponse model
        """
        try:
            n   = self._normalise(data)
            score = 0.0
            reasons: List[str] = []

            # Individual component scores kept for factorScores
            hours_pts   = 0.0
            task_pts    = 0.0
            util_pts    = 0.0
            consec_pts  = 0.0
            att_pts     = 0.0
            report_pts  = 0.0

            # ── 1. Hours component (max 25 pts) ──────────────────────────────
            daily_avg     = self._f(n, "daily_avg_hours",  0)
            monthly_hours = self._f(n, "monthly_hours",    0)

            if daily_avg > 10:
                hours_pts += 25
                reasons.append("Daily working hours critically exceed safe limits (>10 hrs)")
            elif daily_avg > 9:
                hours_pts += 20
                reasons.append("Daily working hours significantly exceed safe limits (>9 hrs)")
            elif daily_avg > 8:
                hours_pts += 12
                reasons.append("Work hours exceed team average")
            elif daily_avg > 7:
                hours_pts += 5

            if monthly_hours > 220:
                hours_pts += 10
                reasons.append("Monthly hours critically high (>220 hrs)")
            elif monthly_hours > 190:
                hours_pts += 5
                reasons.append("Monthly hours above healthy threshold")

            # ── 2. Task pressure (max 25 pts) ────────────────────────────────
            overdue = self._i(n, "overdue_tasks", 0)
            pending = self._i(n, "pending_tasks", 0)

            if overdue >= 5:
                task_pts += 25
                reasons.append("Multiple overdue tasks creating significant pressure")
            elif overdue >= 3:
                task_pts += 18
                reasons.append("Several overdue tasks detected")
            elif overdue >= 1:
                task_pts += 8
                reasons.append("Overdue tasks present")

            if pending >= 10:
                task_pts += 10
                reasons.append("High workload — excessive pending tasks")
            elif pending >= 6:
                task_pts += 5
                reasons.append("Elevated pending task count")

            # ── 3. Utilization (max 20 pts) ───────────────────────────────────
            utilization = self._f(n, "utilization_pct", 0)

            if utilization > 95:
                util_pts += 20
                reasons.append("Utilization at critical level (>95%)")
            elif utilization > 85:
                util_pts += 14
                reasons.append("Very high utilization rate")
            elif utilization > 75:
                util_pts += 7
                reasons.append("Above-average utilization")

            # ── 4. Consecutive work days (max 15 pts) ─────────────────────────
            consec = self._i(n, "consecutive_work_days", 0)

            if consec >= 14:
                consec_pts += 15
                reasons.append("Working without rest for 2+ weeks continuously")
            elif consec >= 10:
                consec_pts += 10
                reasons.append("Extended work streak without adequate break")
            elif consec >= 7:
                consec_pts += 5
                reasons.append("Working entire week without rest")

            # ── 5. Attendance (max 10 pts) ────────────────────────────────────
            attendance = self._f(n, "attendance_pct", 100)

            if attendance < 60 and (overdue >= 2 or utilization > 70):
                att_pts += 10
                reasons.append("Low attendance combined with high workload pressure")
            elif attendance < 70:
                att_pts += 5
                reasons.append("Below-average attendance may indicate stress")

            # ── 6. Report consistency (max 5 pts) ────────────────────────────
            submitted = self._i(n, "reports_submitted",      0)
            expected  = self._i(n, "total_reports_expected", 1)   # never 0
            report_rate = (submitted / expected * 100) if expected > 0 else 100

            if report_rate < 40:
                report_pts += 5
                reasons.append("Very low report submission — possible disengagement")
            elif report_rate < 60:
                report_pts += 2

            # ── Totals ────────────────────────────────────────────────────────
            score = hours_pts + task_pts + util_pts + consec_pts + att_pts + report_pts
            final_score = int(min(100, max(0, round(score))))

            if final_score >= self.HIGH_THRESHOLD:
                level = "HIGH"
            elif final_score >= self.MEDIUM_THRESHOLD:
                level = "MEDIUM"
            else:
                level = "LOW"

            if not reasons:
                reasons.append("Work patterns are within healthy limits")

            # factorScores — each component capped to its own max, as int
            factor_scores: Dict[str, int] = {
                "hours":       int(min(35, hours_pts)),   # max possible = 25+10 = 35
                "tasks":       int(min(35, task_pts)),    # max possible = 25+10 = 35
                "utilization": int(min(20, util_pts)),
                "consecutive": int(min(15, consec_pts)),
                "attendance":  int(min(10, att_pts)),
                "reports":     int(min(5,  report_pts)),
            }

            result = {
                "employeeId":   data.get("employeeId", data.get("employee_id")),
                "burnoutRisk":  final_score,
                "level":        level,
                "reasons":      reasons[:5],
                "factorScores": factor_scores,
            }
            logger.info(
                "[BurnoutPredictor] employee=%s score=%d level=%s",
                result["employeeId"], final_score, level,
            )
            return result

        except Exception as e:
            logger.exception("[BurnoutPredictor] Unexpected error: %s", e)
            return {
                "employeeId":   data.get("employeeId", data.get("employee_id")),
                "burnoutRisk":  0,
                "level":        "LOW",
                "reasons":      ["Unable to calculate — insufficient data"],
                "factorScores": {
                    "hours": 0, "tasks": 0, "utilization": 0,
                    "consecutive": 0, "attendance": 0, "reports": 0,
                },
            }

    # ── Type-safe helpers ─────────────────────────────────────────────────────
    @staticmethod
    def _f(data: Dict, key: str, default: float) -> float:
        try:
            v = data.get(key, default)
            return float(v) if v is not None else float(default)
        except (TypeError, ValueError):
            return float(default)

    @staticmethod
    def _i(data: Dict, key: str, default: int) -> int:
        try:
            v = data.get(key, default)
            return int(float(v)) if v is not None else int(default)
        except (TypeError, ValueError):
            return int(default)


# ── Module-level backward-compat wrapper ─────────────────────────────────────
def calculate_burnout_risk(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Kept for any code that imports the old function name.
    The result includes factorScores so it is safe for BurnoutResponse.
    """
    return BurnoutPredictor().predict(data)