"""
Burnout Detection Engine
Predicts employee burnout risk based on behavioral and workload metrics.
Fully deterministic — no external APIs required.
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class BurnoutPredictor:
    """
    Burnout Risk Scoring Engine.
    
    Uses a weighted multi-factor scoring model to estimate burnout risk.
    Score range: 0 (no risk) → 100 (extreme risk).
    """

    # ─── Thresholds ────────────────────────────────────────────────────────────
    NORMAL_DAILY_HOURS = 8.0          # Expected daily work hours
    MAX_HEALTHY_DAILY_HOURS = 9.0     # Above this → stress zone
    CRITICAL_DAILY_HOURS = 11.0       # Above this → danger zone

    NORMAL_MONTHLY_HOURS = 176.0      # 22 working days × 8 hrs
    CRITICAL_MONTHLY_HOURS = 220.0    # Sustained overwork threshold

    HEALTHY_ATTENDANCE = 90.0         # %
    LOW_ATTENDANCE = 75.0             # % — potential disengagement

    MAX_HEALTHY_PENDING = 3           # tasks
    CRITICAL_PENDING = 7              # tasks

    MAX_HEALTHY_OVERDUE = 1           # tasks
    CRITICAL_OVERDUE = 4              # tasks

    HEALTHY_UTILIZATION = 75.0        # %
    CRITICAL_UTILIZATION = 95.0       # %

    CRITICAL_CONSECUTIVE_DAYS = 10    # days without break
    REPORT_SUBMISSION_THRESHOLD = 0.7 # below 70% → inconsistency flag

    # ─── Weight Distribution (total = 100) ─────────────────────────────────────
    WEIGHTS = {
        "daily_hours":        25,
        "monthly_hours":      20,
        "pending_tasks":      18,
        "overdue_tasks":      17,
        "utilization":        10,
        "consecutive_days":   6,
        "attendance":         4,
    }

    def predict(self, employee_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compute burnout risk score and return structured response.

        Args:
            employee_data: Dict containing employee metrics.

        Returns:
            Dict with burnoutRisk, level, reasons, and factor breakdown.
        """
        try:
            employee_id = employee_data.get("employeeId", 0)
            logger.info(f"[Burnout] Computing risk for employeeId={employee_id}")

            # ── Extract & Sanitize Inputs ──────────────────────────────────────
            daily_hours      = float(employee_data.get("dailyAverageHours", 8.0))
            monthly_hours    = float(employee_data.get("monthlyHoursWorked", 176.0))
            attendance_pct   = float(employee_data.get("attendancePercentage", 100.0))
            pending_tasks    = int(employee_data.get("pendingTasks", 0))
            overdue_tasks    = int(employee_data.get("overdueTasks", 0))
            utilization_pct  = float(employee_data.get("utilizationPercentage", 70.0))
            consec_days      = int(employee_data.get("consecutiveWorkDays", 5))
            reports_total    = int(employee_data.get("reportsTotal", 20))
            reports_sub      = int(employee_data.get("reportsSubmitted", 20))

            # ── Individual Factor Scores (0–100 each) ─────────────────────────
            scores = {}
            reasons: List[str] = []

            # Factor 1: Daily Average Hours
            scores["daily_hours"] = self._score_daily_hours(daily_hours, reasons)

            # Factor 2: Monthly Hours
            scores["monthly_hours"] = self._score_monthly_hours(monthly_hours, reasons)

            # Factor 3: Pending Tasks
            scores["pending_tasks"] = self._score_pending_tasks(pending_tasks, reasons)

            # Factor 4: Overdue Tasks
            scores["overdue_tasks"] = self._score_overdue_tasks(overdue_tasks, reasons)

            # Factor 5: Utilization
            scores["utilization"] = self._score_utilization(utilization_pct, reasons)

            # Factor 6: Consecutive Work Days
            scores["consecutive_days"] = self._score_consecutive_days(consec_days, reasons)

            # Factor 7: Attendance (low attendance can be early burnout signal)
            scores["attendance"] = self._score_attendance(attendance_pct, reasons)

            # ── Weighted Final Score ───────────────────────────────────────────
            burnout_score = sum(
                scores[factor] * (self.WEIGHTS[factor] / 100.0)
                for factor in self.WEIGHTS
            )
            burnout_score = round(min(max(burnout_score, 0), 100))

            # ── Risk Level Classification ──────────────────────────────────────
            level = self._classify_level(burnout_score)

            # ── Deduplicate & Limit Reasons ────────────────────────────────────
            reasons = list(dict.fromkeys(reasons))[:5]
            if not reasons:
                reasons = ["No significant burnout indicators detected"]

            result = {
                "employeeId":    employee_id,
                "burnoutRisk":   burnout_score,
                "level":         level,
                "reasons":       reasons,
                "factorScores":  {k: round(v) for k, v in scores.items()},
            }

            logger.info(
                f"[Burnout] employeeId={employee_id} → score={burnout_score}, level={level}"
            )
            return result

        except Exception as e:
            logger.exception(f"[Burnout] Prediction failed: {e}")
            raise

    # ─── Factor Scoring Methods ────────────────────────────────────────────────

    def _score_daily_hours(self, daily_hours: float, reasons: List[str]) -> float:
        if daily_hours <= self.NORMAL_DAILY_HOURS:
            return 0.0
        elif daily_hours <= self.MAX_HEALTHY_DAILY_HOURS:
            reasons.append("Work hours slightly above normal range")
            return 30.0
        elif daily_hours <= self.CRITICAL_DAILY_HOURS:
            reasons.append("Work hours significantly exceed recommended limit")
            return 65.0
        else:
            reasons.append("Extreme daily work hours detected — critical overwork")
            return 100.0

    def _score_monthly_hours(self, monthly_hours: float, reasons: List[str]) -> float:
        if monthly_hours <= self.NORMAL_MONTHLY_HOURS:
            return 0.0
        elif monthly_hours <= 200:
            reasons.append("Monthly hours above standard workload")
            return 35.0
        elif monthly_hours <= self.CRITICAL_MONTHLY_HOURS:
            reasons.append("Sustained high monthly workload")
            return 70.0
        else:
            reasons.append("Monthly hours at burnout-critical level")
            return 100.0

    def _score_pending_tasks(self, pending: int, reasons: List[str]) -> float:
        if pending <= self.MAX_HEALTHY_PENDING:
            return 0.0
        elif pending <= 5:
            reasons.append("Elevated number of pending tasks")
            return 40.0
        elif pending <= self.CRITICAL_PENDING:
            reasons.append("High number of pending tasks increasing workload pressure")
            return 70.0
        else:
            reasons.append("Task backlog at critical level")
            return 100.0

    def _score_overdue_tasks(self, overdue: int, reasons: List[str]) -> float:
        if overdue == 0:
            return 0.0
        elif overdue <= self.MAX_HEALTHY_OVERDUE:
            reasons.append("Minor overdue task detected")
            return 25.0
        elif overdue <= 2:
            reasons.append("Multiple overdue tasks indicating workload strain")
            return 55.0
        elif overdue <= self.CRITICAL_OVERDUE:
            reasons.append("High overdue task count — sustained stress indicator")
            return 80.0
        else:
            reasons.append("Critical overdue task accumulation")
            return 100.0

    def _score_utilization(self, utilization: float, reasons: List[str]) -> float:
        if utilization <= self.HEALTHY_UTILIZATION:
            return 0.0
        elif utilization <= 85.0:
            reasons.append("Utilization approaching upper healthy limit")
            return 30.0
        elif utilization <= self.CRITICAL_UTILIZATION:
            reasons.append("High utilization rate — limited recovery bandwidth")
            return 65.0
        else:
            reasons.append("Utilization beyond sustainable capacity")
            return 100.0

    def _score_consecutive_days(self, days: int, reasons: List[str]) -> float:
        if days <= 5:
            return 0.0
        elif days <= 7:
            reasons.append("Working through weekends without adequate rest")
            return 40.0
        elif days <= self.CRITICAL_CONSECUTIVE_DAYS:
            reasons.append("Extended consecutive work stretch without break")
            return 70.0
        else:
            reasons.append("Critically long consecutive work streak — rest deficit")
            return 100.0

    def _score_attendance(self, attendance: float, reasons: List[str]) -> float:
        """
        Low attendance can be an early burnout manifestation (avoidance behavior).
        """
        if attendance >= self.HEALTHY_ATTENDANCE:
            return 0.0
        elif attendance >= self.LOW_ATTENDANCE:
            reasons.append("Attendance declining — possible early disengagement")
            return 45.0
        else:
            reasons.append("Significantly low attendance — may reflect burnout avoidance")
            return 80.0

    @staticmethod
    def _classify_level(score: int) -> str:
        if score >= 70:
            return "HIGH"
        elif score >= 40:
            return "MEDIUM"
        return "LOW"