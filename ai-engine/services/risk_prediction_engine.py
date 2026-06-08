"""
risk_prediction_engine.py
=========================
AI-6: Risk Prediction Engine
Top-level class that coordinates rule evaluation and score calculation.
Spring Boot calls this via the FastAPI /risk/* routes.

ML upgrade path:
    Replace RiskPredictionEngine.predict() internals with model.predict()
    while keeping the same method signature — zero API changes.
"""

import logging
from typing import Dict, Any

from services.risk_score_calculator import calculate

logger = logging.getLogger(__name__)


class RiskPredictionEngine:
    """
    Stateless risk engine.
    Instantiate once (module-level singleton) and call .predict(data).
    """

    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compute deadline risk for one task.

        Expected keys in data (all optional):
            task_id                 int
            task_title              str
            days_remaining          int   (negative = overdue)
            completion_percentage   int   0–100
            expected_progress       int   0–100
            productivity_score      float 0–100
            utilization_pct         float 0–100
            attendance_pct          float 0–100
            historical_on_time_rate float 0–100
            priority                str   HIGH | MEDIUM | LOW
            task_complexity         str   HIGH | MEDIUM | LOW

        Returns dict matching RiskPredictionResponse schema.
        """
        task_id    = data.get("task_id")
        task_title = data.get("task_title", "Unknown Task")

        result = calculate(data)

        logger.info(
            "[RiskPredictionEngine] task=%s score=%d level=%s",
            task_id, result["risk_score"], result["risk_level"],
        )

        return {
            "taskId":           task_id,
            "taskTitle":        task_title,
            "riskScore":        result["risk_score"],
            "riskLevel":        result["risk_level"],
            "confidence":       result["confidence"],
            "reasons":          result["reasons"],
            "recommendations":  result["recommendations"],
            "factorBreakdown":  result["factor_breakdown"],
            "mlModelUsed":      result["ml_model_used"],
        }


# ── Module-level singleton ────────────────────────────────────────────────────
def calculate_task_risk(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function — used by routes that import directly."""
    return RiskPredictionEngine().predict(data)