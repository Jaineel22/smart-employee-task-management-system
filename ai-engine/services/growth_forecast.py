"""
AI-4E: Growth Forecast Engine
Lightweight 3-month productivity projection using linear trend.
Result does NOT contain employeeId — route injects it.
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class GrowthForecastEngine:
    """3-month productivity forecaster. No external APIs."""

    def forecast(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Expected keys (all optional, safe defaults applied):
            productivity_history  List[float]  oldest → newest
            current_productivity  float        0–100
            burnout_score         float        0–100
            utilization_pct       float        0–100
            attendance_pct        float        0–100

        Returns:
            currentProductivity            float
            predictedProductivity3Months   float
            improvement                    float
            trend                          str
            monthlyForecast                List[{month, predictedProductivity}]
        NOTE: employeeId is NOT in the result — route injects it.
        """
        try:
            current    = self._f(data, "current_productivity", 70.0)
            burnout    = self._f(data, "burnout_score",        0.0)
            utilization = self._f(data, "utilization_pct",    70.0)
            attendance  = self._f(data, "attendance_pct",     80.0)

            history: List[float] = []
            raw_hist = data.get("productivity_history", [])
            if isinstance(raw_hist, list):
                history = [float(v) for v in raw_hist if v is not None]

            # Base slope from history or mild positive default
            if len(history) >= 2:
                slope = self._linear_slope(history)
            else:
                slope = 0.5

            # ── Modifier adjustments ───────────────────────────────────────────
            burnout_drag = (
                -1.5 if burnout >= 70
                else -0.5 if burnout >= 40
                else 0.0
            )
            attendance_mod = (
                0.5  if attendance >= 90
                else -0.5 if attendance < 70
                else 0.0
            )
            util_mod = (
                -1.0 if utilization > 95
                else -0.3 if utilization > 85
                else -0.5 if utilization < 50
                else 0.0
            )

            effective_slope = slope + burnout_drag + attendance_mod + util_mod

            # ── 3-month projection ────────────────────────────────────────────
            predicted_3m = round(
                min(100.0, max(0.0, current + effective_slope * 3)), 1
            )
            improvement = round(predicted_3m - current, 1)

            monthly_forecast = [
                {
                    "month": m,
                    "predictedProductivity": round(
                        min(100.0, max(0.0, current + effective_slope * m)), 1
                    ),
                }
                for m in range(1, 4)
            ]

            if improvement >= 10:
                trend = "Strong Growth"
            elif improvement >= 4:
                trend = "Moderate Growth"
            elif improvement >= 0:
                trend = "Stable"
            elif improvement >= -5:
                trend = "Slight Decline"
            else:
                trend = "Declining"

            result = {
                "currentProductivity":          current,
                "predictedProductivity3Months": predicted_3m,
                "improvement":                  improvement,
                "trend":                        trend,
                "monthlyForecast":              monthly_forecast,
            }
            logger.info(
                "[GrowthForecastEngine] current=%.1f predicted=%.1f trend=%s",
                current, predicted_3m, trend,
            )
            return result

        except Exception as e:
            logger.exception("[GrowthForecastEngine] error: %s", e)
            return {
                "currentProductivity":          0.0,
                "predictedProductivity3Months": 0.0,
                "improvement":                  0.0,
                "trend":                        "Unknown",
                "monthlyForecast":              [],
            }

    @staticmethod
    def _linear_slope(values: List[float]) -> float:
        """OLS slope — average change per period."""
        n = len(values)
        if n < 2:
            return 0.0
        x_mean = (n - 1) / 2.0
        y_mean = sum(values) / n
        num = sum((i - x_mean) * (values[i] - y_mean) for i in range(n))
        den = sum((i - x_mean) ** 2 for i in range(n))
        return num / den if den != 0 else 0.0

    @staticmethod
    def _f(data: Dict, key: str, default: float) -> float:
        try:
            v = data.get(key, default)
            return float(v) if v is not None else float(default)
        except (TypeError, ValueError):
            return float(default)


# ── backward-compat function ──────────────────────────────────────────────────
def forecast_growth(data: Dict[str, Any]) -> Dict[str, Any]:
    """Result does NOT contain employeeId — route injects it."""
    return GrowthForecastEngine().forecast(data)