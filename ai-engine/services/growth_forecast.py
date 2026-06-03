"""
Growth Forecast Engine
Estimates future productivity using lightweight statistical forecasting.
Uses exponential smoothing and linear trend projection — no external APIs.
"""

import logging
import math
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class GrowthForecastEngine:
    """
    Forecasts employee productivity for the next 1, 3, and 6 months.

    Methods:
    - Exponential Weighted Moving Average (EWMA)
    - Linear regression on historical data
    - Hybrid blend for final forecast
    """

    ALPHA = 0.3          # EWMA smoothing factor (0 < α < 1)
    MIN_DATA_POINTS = 2  # Minimum history required
    MAX_PRODUCTIVITY = 100.0
    MIN_PRODUCTIVITY = 0.0

    def forecast(self, employee_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate productivity forecast for an employee.

        Args:
            employee_data: Dict with employeeId and productivityHistory list.

        Returns:
            Forecast dict with current, 1-month, 3-month, 6-month predictions.
        """
        try:
            employee_id = employee_data.get("employeeId", 0)
            history: List[float] = [
                float(v) for v in employee_data.get("productivityHistory", [])
            ]

            logger.info(
                f"[Forecast] Computing for employeeId={employee_id}, "
                f"history_points={len(history)}"
            )

            # ── Guard: Not Enough Data ─────────────────────────────────────────
            if len(history) < self.MIN_DATA_POINTS:
                current = history[0] if history else float(
                    employee_data.get("currentProductivity", 65.0)
                )
                return self._insufficient_data_response(employee_id, current)

            # ── Current Productivity ───────────────────────────────────────────
            current_productivity = history[-1]

            # ── EWMA Smoothed Series ───────────────────────────────────────────
            ewma = self._compute_ewma(history)
            smoothed_current = ewma[-1]

            # ── Linear Trend ───────────────────────────────────────────────────
            trend_per_month = self._linear_trend(history)

            # ── Hybrid Forecast ────────────────────────────────────────────────
            def project(months: int) -> int:
                linear_proj = smoothed_current + (trend_per_month * months)
                # Apply diminishing returns for large projections
                dampened = linear_proj * (0.95 ** (months - 1))
                # Blend: 60% linear, 40% mean-reversion toward ideal
                mean_rev = smoothed_current + (85.0 - smoothed_current) * 0.08 * months
                blended  = (dampened * 0.6) + (mean_rev * 0.4)
                return round(max(self.MIN_PRODUCTIVITY, min(self.MAX_PRODUCTIVITY, blended)))

            pred_1m = project(1)
            pred_3m = project(3)
            pred_6m = project(6)

            # ── Improvement Calculation ────────────────────────────────────────
            improvement_3m = pred_3m - round(current_productivity)
            improvement_6m = pred_6m - round(current_productivity)

            # ── Trend Direction ────────────────────────────────────────────────
            trend_dir = (
                "IMPROVING" if trend_per_month > 0.5 else
                "DECLINING"  if trend_per_month < -0.5 else
                "STABLE"
            )

            # ── Confidence ────────────────────────────────────────────────────
            confidence = self._compute_confidence(history, trend_per_month)

            result = {
                "employeeId":                   employee_id,
                "currentProductivity":          round(current_productivity),
                "smoothedProductivity":         round(smoothed_current),
                "predictedProductivity1Month":  pred_1m,
                "predictedProductivity3Months": pred_3m,
                "predictedProductivity6Months": pred_6m,
                "improvement3Months":           improvement_3m,
                "improvement6Months":           improvement_6m,
                "trendDirection":               trend_dir,
                "trendPerMonth":                round(trend_per_month, 2),
                "confidence":                   confidence,
                "dataPoints":                   len(history),
                "historicalData":               [round(v) for v in history],
            }

            logger.info(
                f"[Forecast] employeeId={employee_id} → "
                f"current={round(current_productivity)}, "
                f"3m={pred_3m}, trend={trend_dir}"
            )
            return result

        except Exception as e:
            logger.exception(f"[Forecast] Failed: {e}")
            raise

    def _compute_ewma(self, data: List[float]) -> List[float]:
        """Exponential Weighted Moving Average."""
        ewma = [data[0]]
        for i in range(1, len(data)):
            ewma.append(self.ALPHA * data[i] + (1 - self.ALPHA) * ewma[-1])
        return ewma

    def _linear_trend(self, data: List[float]) -> float:
        """
        Compute slope (trend per period) using simple linear regression.
        Returns positive value → improving, negative → declining.
        """
        n = len(data)
        if n < 2:
            return 0.0

        x_mean = (n - 1) / 2.0
        y_mean = sum(data) / n

        numerator   = sum((i - x_mean) * (data[i] - y_mean) for i in range(n))
        denominator = sum((i - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return 0.0
        return numerator / denominator

    def _compute_confidence(self, history: List[float], trend: float) -> int:
        """
        Confidence reflects data stability and trend consistency.
        """
        n = len(history)
        base = 55

        # More data → higher confidence
        if n >= 12:
            base += 25
        elif n >= 6:
            base += 15
        elif n >= 3:
            base += 8

        # Low variance → more predictable → higher confidence
        if n >= 2:
            mean = sum(history) / n
            variance = sum((x - mean) ** 2 for x in history) / n
            std = math.sqrt(variance)
            if std < 5:
                base += 10
            elif std < 10:
                base += 5
            elif std > 20:
                base -= 10

        # Strong consistent trend → higher confidence
        if abs(trend) > 3:
            base -= 5  # high volatility reduces confidence
        elif abs(trend) > 1:
            base += 3

        return min(base, 92)

    @staticmethod
    def _insufficient_data_response(employee_id: int, current: float) -> Dict[str, Any]:
        return {
            "employeeId":                   employee_id,
            "currentProductivity":          round(current),
            "smoothedProductivity":         round(current),
            "predictedProductivity1Month":  round(current),
            "predictedProductivity3Months": round(current),
            "predictedProductivity6Months": round(current),
            "improvement3Months":           0,
            "improvement6Months":           0,
            "trendDirection":               "INSUFFICIENT_DATA",
            "trendPerMonth":                0.0,
            "confidence":                   30,
            "dataPoints":                   1,
            "historicalData":               [round(current)],
        }