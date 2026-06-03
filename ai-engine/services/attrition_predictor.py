"""
Attrition Risk Engine
Estimates employee disengagement probability based on behavioral trends.
Fully explainable — no black-box responses.
"""

import logging
import math
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)


class AttritionPredictor:
    """
    Attrition Risk Scoring Engine.

    Analyzes trend-based signals to compute disengagement probability.
    Outputs risk score (0–100), level, confidence, and explainable reasons.
    """

    # ─── Trend Thresholds ─────────────────────────────────────────────────────
    ATTENDANCE_DROP_CRITICAL  = 15.0   # % drop considered critical
    ATTENDANCE_DROP_MODERATE  = 8.0    # % drop considered moderate

    PRODUCTIVITY_DROP_CRITICAL = 20.0  # % drop
    PRODUCTIVITY_DROP_MODERATE = 10.0  # % drop

    UTIL_DROP_CRITICAL  = 18.0         # % drop
    UTIL_DROP_MODERATE  = 9.0          # % drop

    COMPLETION_DROP_CRITICAL  = 20.0   # % drop
    COMPLETION_DROP_MODERATE  = 10.0   # % drop

    REPORT_INCONSISTENCY_HIGH   = 0.5  # below 50% consistency
    REPORT_INCONSISTENCY_MEDIUM = 0.7  # below 70% consistency

    # ─── Weight Distribution ───────────────────────────────────────────────────
    WEIGHTS = {
        "attendance_trend":    25,
        "productivity_trend":  25,
        "utilization_trend":   20,
        "completion_trend":    18,
        "report_consistency":  12,
    }

    def predict(self, employee_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compute attrition risk for a given employee.

        Args:
            employee_data: Dict with trend data and consistency metrics.

        Returns:
            Dict with attritionRisk, level, confidence, and reasons.
        """
        try:
            employee_id = employee_data.get("employeeId", 0)
            logger.info(f"[Attrition] Computing risk for employeeId={employee_id}")

            # ── Extract Inputs ─────────────────────────────────────────────────
            # Trend = difference (current period − previous period), as %
            attendance_trend   = float(employee_data.get("attendanceTrend", 0.0))
            productivity_trend = float(employee_data.get("productivityTrend", 0.0))
            util_trend         = float(employee_data.get("utilizationTrend", 0.0))
            completion_trend   = float(employee_data.get("completionTrend", 0.0))
            report_consistency = float(employee_data.get("reportConsistency", 1.0))

            # Current absolute values (used for confidence adjustment)
            current_productivity = float(employee_data.get("currentProductivity", 70.0))
            current_attendance   = float(employee_data.get("currentAttendance", 90.0))

            # ── Factor Scores & Reasons ────────────────────────────────────────
            factor_scores: Dict[str, float] = {}
            reasons: List[str] = []

            factor_scores["attendance_trend"] = self._score_attendance_trend(
                attendance_trend, reasons
            )
            factor_scores["productivity_trend"] = self._score_productivity_trend(
                productivity_trend, reasons
            )
            factor_scores["utilization_trend"] = self._score_utilization_trend(
                util_trend, reasons
            )
            factor_scores["completion_trend"] = self._score_completion_trend(
                completion_trend, reasons
            )
            factor_scores["report_consistency"] = self._score_report_consistency(
                report_consistency, reasons
            )

            # ── Weighted Score ─────────────────────────────────────────────────
            raw_score = sum(
                factor_scores[f] * (self.WEIGHTS[f] / 100.0)
                for f in self.WEIGHTS
            )
            attrition_risk = round(min(max(raw_score, 0), 100))

            # ── Confidence Calculation ─────────────────────────────────────────
            confidence = self._compute_confidence(
                attrition_risk, current_productivity, current_attendance
            )

            # ── Level Classification ───────────────────────────────────────────
            level = self._classify_level(attrition_risk)

            # ── Clean Reasons ──────────────────────────────────────────────────
            reasons = list(dict.fromkeys(reasons))[:5]
            if not reasons:
                reasons = ["No significant attrition indicators detected"]

            result = {
                "employeeId":    employee_id,
                "attritionRisk": attrition_risk,
                "level":         level,
                "confidence":    confidence,
                "reasons":       reasons,
                "factorScores":  {k: round(v) for k, v in factor_scores.items()},
            }

            logger.info(
                f"[Attrition] employeeId={employee_id} → "
                f"risk={attrition_risk}, level={level}, confidence={confidence}"
            )
            return result

        except Exception as e:
            logger.exception(f"[Attrition] Prediction failed: {e}")
            raise

    # ─── Factor Scorers ────────────────────────────────────────────────────────

    def _score_attendance_trend(self, trend: float, reasons: List[str]) -> float:
        """Negative trend (drop) increases attrition risk."""
        drop = -trend  # invert: drop is positive risk
        if drop <= 0:
            return 0.0
        elif drop < self.ATTENDANCE_DROP_MODERATE:
            reasons.append(f"Attendance dropped by {drop:.1f}%")
            return 30.0
        elif drop < self.ATTENDANCE_DROP_CRITICAL:
            reasons.append(f"Attendance declined significantly by {drop:.1f}%")
            return 65.0
        else:
            reasons.append(f"Severe attendance drop of {drop:.1f}% — strong disengagement signal")
            return 95.0

    def _score_productivity_trend(self, trend: float, reasons: List[str]) -> float:
        drop = -trend
        if drop <= 0:
            return 0.0
        elif drop < self.PRODUCTIVITY_DROP_MODERATE:
            reasons.append(f"Productivity dipped by {drop:.1f}% this period")
            return 30.0
        elif drop < self.PRODUCTIVITY_DROP_CRITICAL:
            reasons.append(f"Productivity decreased by {drop:.1f}% over past months")
            return 65.0
        else:
            reasons.append(f"Significant productivity decline of {drop:.1f}% — disengagement risk")
            return 95.0

    def _score_utilization_trend(self, trend: float, reasons: List[str]) -> float:
        drop = -trend
        if drop <= 0:
            return 0.0
        elif drop < self.UTIL_DROP_MODERATE:
            reasons.append(f"Utilization trending down by {drop:.1f}%")
            return 30.0
        elif drop < self.UTIL_DROP_CRITICAL:
            reasons.append(f"Utilization dropped {drop:.1f}% — reduced engagement")
            return 60.0
        else:
            reasons.append(f"Utilization critically low, declined {drop:.1f}%")
            return 90.0

    def _score_completion_trend(self, trend: float, reasons: List[str]) -> float:
        drop = -trend
        if drop <= 0:
            return 0.0
        elif drop < self.COMPLETION_DROP_MODERATE:
            reasons.append(f"Task completion rate slipped by {drop:.1f}%")
            return 30.0
        elif drop < self.COMPLETION_DROP_CRITICAL:
            reasons.append(f"Task completion declining — {drop:.1f}% drop observed")
            return 60.0
        else:
            reasons.append(f"Task completion severely degraded by {drop:.1f}%")
            return 90.0

    def _score_report_consistency(self, consistency: float, reasons: List[str]) -> float:
        """consistency = submitted / expected (0.0–1.0)"""
        if consistency >= 0.85:
            return 0.0
        elif consistency >= self.REPORT_INCONSISTENCY_MEDIUM:
            reasons.append("Report submission inconsistency detected")
            return 35.0
        elif consistency >= self.REPORT_INCONSISTENCY_HIGH:
            reasons.append("Reports submitted inconsistently — possible disengagement")
            return 65.0
        else:
            reasons.append("Very low report submission rate — significant disengagement signal")
            return 90.0

    def _compute_confidence(
        self,
        risk_score: int,
        productivity: float,
        attendance: float
    ) -> int:
        """
        Confidence reflects how strongly the data supports the prediction.
        Higher confidence when multiple strong signals align.
        """
        base_confidence = 60

        # Strong signals increase confidence
        if risk_score >= 70 or risk_score <= 20:
            base_confidence += 20
        elif risk_score >= 50 or risk_score <= 35:
            base_confidence += 10

        # Corroborating absolute values
        if productivity < 50 and risk_score >= 60:
            base_confidence += 8
        if attendance < 70 and risk_score >= 60:
            base_confidence += 7

        return min(base_confidence, 95)

    @staticmethod
    def _classify_level(score: int) -> str:
        if score >= 70:
            return "HIGH"
        elif score >= 40:
            return "MEDIUM"
        return "LOW"