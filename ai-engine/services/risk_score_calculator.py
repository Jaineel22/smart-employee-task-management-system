"""
risk_score_calculator.py
========================
AI-6: Computes the weighted risk score from rule outputs.
This file is the ML plug-in point for future AI-7+:
  - Replace calculate() with an ML model call
  - Keep the same input/output contract
  - No API changes needed
"""

import logging
from typing import Dict, Any, List, Tuple

from services.risk_rules import RISK_RULES

logger = logging.getLogger(__name__)


# Priority multipliers — HIGH-priority tasks carry more risk weight
PRIORITY_MULTIPLIERS = {
    "HIGH":   1.15,
    "MEDIUM": 1.00,
    "LOW":    0.85,
}


def calculate(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compute composite risk score from all rule components.

    Input keys (all optional — safe defaults applied):
        days_remaining          int    (negative = overdue)
        completion_percentage   int    0–100
        expected_progress       int    0–100
        productivity_score      float  0–100
        utilization_pct         float  0–100
        attendance_pct          float  0–100
        historical_on_time_rate float  0–100
        priority                str    HIGH | MEDIUM | LOW
        task_complexity         str    HIGH | MEDIUM | LOW  (future use)

    Returns:
        risk_score       int   0–100
        risk_level       str   LOW | MEDIUM | HIGH | CRITICAL
        confidence       int   0–100
        reasons          List[str]
        recommendations  List[str]
        factor_breakdown Dict[str, int]
        ml_model_used    bool
    """
    try:
        reasons:      List[str] = []
        recs:         List[str] = []
        factor_scores: Dict[str, int] = {}
        raw_weighted = 0.0
        signal_count = 0

        for rule in RISK_RULES:
            raw = rule["scorer"](data)
            factor_scores[rule["name"]] = raw
            raw_weighted += raw * rule["weight"]

            # Collect reasons and recommendations from rules that fired significantly
            if raw >= 50:
                signal_count += 1
                reason = rule["reason_fn"](data, raw)
                if reason:
                    reasons.append(reason)
                rec = rule["rec_fn"](data, raw)
                if rec:
                    recs.append(rec)

        # Priority multiplier
        priority = (data.get("priority") or "MEDIUM").upper()
        multiplier = PRIORITY_MULTIPLIERS.get(priority, 1.0)
        final_score = int(min(100, max(0, round(raw_weighted * multiplier))))

        risk_level = _resolve_level(final_score)

        # Confidence increases with number of corroborating signals
        confidence = min(95, 60 + signal_count * 8)

        if not recs:
            recs.append("Continue current pace — risk level is manageable")
        if not reasons:
            reasons.append("No significant risk signals detected")

        return {
            "risk_score":       final_score,
            "risk_level":       risk_level,
            "confidence":       confidence,
            "reasons":          reasons,
            "recommendations":  recs,
            "factor_breakdown": factor_scores,
            "ml_model_used":    False,
        }

    except Exception as e:
        logger.exception("[RiskScoreCalculator] error: %s", e)
        return {
            "risk_score":       0,
            "risk_level":       "LOW",
            "confidence":       40,
            "reasons":          ["Could not calculate risk — insufficient data"],
            "recommendations":  ["Ensure task has a deadline and assigned employee"],
            "factor_breakdown": {},
            "ml_model_used":    False,
        }


def _resolve_level(score: int) -> str:
    if score >= 81:
        return "CRITICAL"
    if score >= 61:
        return "HIGH"
    if score >= 31:
        return "MEDIUM"
    return "LOW"