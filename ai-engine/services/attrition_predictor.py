"""
AI-4B: Attrition Risk Engine
Bug fixed: predict() no longer returns "employeeId" in the result dict.
The route does  AttritionResponse(employeeId=request.employeeId, **result)
so "employeeId" must NOT be a key inside result — duplicate-kwarg TypeError.
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class AttritionPredictor:
    """
    Stateless attrition risk calculator.
    Call .predict(data) — result dict does NOT contain employeeId (route injects it).
    """

    HIGH_THRESHOLD   = 70
    MEDIUM_THRESHOLD = 40

    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Expected keys (all optional, safe defaults applied):
            attendance_trend        float  % change (negative = declining)
            productivity_trend      float  % change
            utilization_trend       float  % change
            task_completion_trend   float  % change
            report_consistency      float  0–100
            current_attendance      float  0–100
            current_productivity    float  0–100
            current_utilization     float  0–100
            months_of_data          int

        Returns dict with keys:
            attritionRisk  int
            level          str
            confidence     int
            reasons        List[str]
        NOTE: employeeId is intentionally NOT in this dict.
              The route injects it via  AttritionResponse(employeeId=..., **result)
        """
        try:
            score   = 0.0
            reasons: List[str] = []
            confidence_signals: List[float] = []

            months = self._i(data, "months_of_data", 1)

            # ── 1. Attendance trend (max 22 pts) ──────────────────────────────
            att_trend = self._f(data, "attendance_trend", 0)
            curr_att  = self._f(data, "current_attendance", 80)

            if att_trend <= -15:
                score += 22
                reasons.append(f"Attendance dropped sharply ({abs(att_trend):.0f}%)")
            elif att_trend <= -10:
                score += 16
                reasons.append(f"Attendance dropped {abs(att_trend):.0f}%")
            elif att_trend <= -5:
                score += 8
                reasons.append(f"Attendance declining trend ({abs(att_trend):.0f}%)")

            if curr_att < 65:
                score += 8
                reasons.append("Current attendance critically low")
            elif curr_att < 75:
                score += 4

            confidence_signals.append(min(1.0, abs(att_trend) / 20))

            # ── 2. Productivity trend (max 22 pts) ────────────────────────────
            prod_trend = self._f(data, "productivity_trend", 0)
            curr_prod  = self._f(data, "current_productivity", 70)

            if prod_trend <= -15:
                score += 22
                reasons.append(f"Productivity dropped significantly ({abs(prod_trend):.0f}%)")
            elif prod_trend <= -8:
                score += 15
                reasons.append(f"Productivity decreased over recent months ({abs(prod_trend):.0f}%)")
            elif prod_trend <= -3:
                score += 7
                reasons.append("Slight productivity decline observed")

            if curr_prod < 50:
                score += 8
                reasons.append("Current productivity critically low")
            elif curr_prod < 60:
                score += 4

            confidence_signals.append(min(1.0, abs(prod_trend) / 20))

            # ── 3. Task completion trend (max 18 pts) ─────────────────────────
            task_trend = self._f(data, "task_completion_trend", 0)

            if task_trend <= -15:
                score += 18
                reasons.append("Task completion rate declining rapidly")
            elif task_trend <= -8:
                score += 12
                reasons.append(f"Task completion rate dropped {abs(task_trend):.0f}%")
            elif task_trend <= -3:
                score += 5
                reasons.append("Slight decline in task completion rate")

            confidence_signals.append(min(1.0, abs(task_trend) / 15))

            # ── 4. Report consistency (max 18 pts) ────────────────────────────
            report_consistency = self._f(data, "report_consistency", 80)

            if report_consistency < 30:
                score += 18
                reasons.append("Reports submitted inconsistently — engagement concern")
            elif report_consistency < 50:
                score += 12
                reasons.append("Inconsistent report submissions")
            elif report_consistency < 65:
                score += 6
                reasons.append("Moderate report submission gaps")

            confidence_signals.append(report_consistency / 100)

            # ── 5. Utilization trend (max 10 pts) ─────────────────────────────
            util_trend = self._f(data, "utilization_trend", 0)

            if util_trend <= -20:
                score += 10
                reasons.append("Utilization plummeted — possible disengagement")
            elif util_trend <= -10:
                score += 6
                reasons.append("Utilization declining over time")
            elif util_trend <= -5:
                score += 3

            confidence_signals.append(min(1.0, abs(util_trend) / 20))

            # ── Confidence ────────────────────────────────────────────────────
            base_confidence = 70 if months >= 3 else (55 if months == 2 else 40)
            if confidence_signals:
                strength = sum(confidence_signals) / len(confidence_signals)
                confidence = min(95, int(base_confidence + strength * 25))
            else:
                confidence = base_confidence

            # ── Clamp & level ─────────────────────────────────────────────────
            final_score = int(min(100, max(0, round(score))))

            if final_score >= self.HIGH_THRESHOLD:
                level = "HIGH"
            elif final_score >= self.MEDIUM_THRESHOLD:
                level = "MEDIUM"
            else:
                level = "LOW"

            if not reasons:
                reasons.append("Employee trends are stable — no significant risk signals")

            # ⚠️ No "employeeId" key — route injects it via **result
            result = {
                "attritionRisk": final_score,
                "level":         level,
                "confidence":    confidence,
                "reasons":       reasons[:5],
            }
            logger.info("[AttritionPredictor] score=%d level=%s confidence=%d",
                        final_score, level, confidence)
            return result

        except Exception as e:
            logger.exception("[AttritionPredictor] error: %s", e)
            return {
                "attritionRisk": 0,
                "level":         "LOW",
                "confidence":    40,
                "reasons":       ["Unable to calculate — insufficient trend data"],
            }

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


# ── backward-compat function ──────────────────────────────────────────────────
def calculate_attrition_risk(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Function wrapper — result does NOT contain employeeId.
    Route must inject it: AttritionResponse(employeeId=X, **result)
    """
    return AttritionPredictor().predict(data)