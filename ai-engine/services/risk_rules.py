"""
risk_rules.py
=============
AI-6: Deadline Risk Rule Definitions
All scoring rules are defined here — separated from engine logic
so future ML models can replace rules without touching the API layer.

Rule schema:
    Each rule is a dict:
        weight      : float   contribution to final score (all weights sum to 1.0)
        scorer      : callable(data) → int  raw score 0–100 for this component
        reason_fn   : callable(data, raw) → str | None   human-readable reason (or None)
        rec_fn      : callable(data, raw) → str | None   recommendation (or None)
"""

from typing import Dict, Any, Optional


# ── 1. DEADLINE PROXIMITY (weight 0.30) ──────────────────────────────────────

def _deadline_score(data: Dict[str, Any]) -> int:
    days = data.get("days_remaining", 999)
    if days is None:
        return 5
    if days < 0:
        return 100
    if days == 0:
        return 95
    if days <= 2:
        return 85
    if days <= 5:
        return 65
    if days <= 10:
        return 40
    if days <= 20:
        return 20
    return 5


def _deadline_reason(data: Dict[str, Any], raw: int) -> Optional[str]:
    days = data.get("days_remaining", 999)
    if days is None:
        return None
    if days < 0:
        return f"Task is overdue by {abs(days)} day(s)"
    if days == 0:
        return "Deadline is today"
    if days <= 5:
        return f"Deadline approaching in {days} day(s)"
    return None


def _deadline_rec(data: Dict[str, Any], raw: int) -> Optional[str]:
    days = data.get("days_remaining", 999)
    if days is None:
        return None
    if days < 0:
        return "Escalate immediately — deadline has already passed"
    if days == 0:
        return "Complete and submit today — no time remaining"
    if days <= 2:
        return "Pause all other tasks — focus entirely on this one"
    if days <= 5:
        return "Increase daily work allocation on this task"
    return None


# ── 2. PROGRESS (weight 0.25) ─────────────────────────────────────────────────

def _progress_score(data: Dict[str, Any]) -> int:
    progress  = data.get("completion_percentage", 0) or 0
    expected  = data.get("expected_progress",     50) or 50
    gap = max(0, expected - progress)
    if gap >= 50:
        return 90
    if gap >= 30:
        return 70
    if gap >= 15:
        return 45
    if progress >= 80:
        return 10
    return 25


def _progress_reason(data: Dict[str, Any], raw: int) -> Optional[str]:
    progress = data.get("completion_percentage", 0) or 0
    expected = data.get("expected_progress",     50) or 50
    gap = max(0, expected - progress)
    if gap >= 30:
        return (f"Progress ({progress}%) is significantly behind "
                f"schedule (expected {expected}%)")
    if gap >= 15:
        return f"Slight progress lag: {progress}% vs expected {expected}%"
    return None


def _progress_rec(data: Dict[str, Any], raw: int) -> Optional[str]:
    gap = max(0, (data.get("expected_progress", 50) or 50)
              - (data.get("completion_percentage", 0) or 0))
    if gap >= 30:
        return "Allocate additional daily hours to close the progress gap"
    if gap >= 15:
        return "Prioritize this task in your daily work schedule"
    return None


# ── 3. PRODUCTIVITY (weight 0.15) ─────────────────────────────────────────────

def _productivity_score(data: Dict[str, Any]) -> int:
    prod = data.get("productivity_score", 70) or 70
    if prod < 40:
        return 85
    if prod < 55:
        return 60
    if prod < 70:
        return 35
    return 10


def _productivity_reason(data: Dict[str, Any], raw: int) -> Optional[str]:
    prod = data.get("productivity_score", 70) or 70
    if prod < 55:
        return f"Employee productivity below average ({int(prod)}%)"
    return None


def _productivity_rec(data: Dict[str, Any], raw: int) -> Optional[str]:
    prod = data.get("productivity_score", 70) or 70
    if prod < 55:
        return "Review workload — consider redistributing some tasks"
    return None


# ── 4. UTILIZATION (weight 0.10) ─────────────────────────────────────────────

def _utilization_score(data: Dict[str, Any]) -> int:
    util = data.get("utilization_pct", 70) or 70
    if util > 95:
        return 90
    if util > 85:
        return 60
    if util < 40:
        return 20
    return 15


def _utilization_reason(data: Dict[str, Any], raw: int) -> Optional[str]:
    util = data.get("utilization_pct", 70) or 70
    if util > 85:
        return f"Employee utilization high ({int(util)}%) — overloaded"
    return None


def _utilization_rec(data: Dict[str, Any], raw: int) -> Optional[str]:
    util = data.get("utilization_pct", 70) or 70
    if util > 85:
        return "Redistribute tasks to reduce overload risk"
    return None


# ── 5. ATTENDANCE (weight 0.10) ───────────────────────────────────────────────

def _attendance_score(data: Dict[str, Any]) -> int:
    att = data.get("attendance_pct", 80) or 80
    if att < 60:
        return 80
    if att < 75:
        return 50
    return 10


def _attendance_reason(data: Dict[str, Any], raw: int) -> Optional[str]:
    att = data.get("attendance_pct", 80) or 80
    if att < 75:
        return f"Low attendance ({int(att)}%) reduces effective working capacity"
    return None


def _attendance_rec(data: Dict[str, Any], raw: int) -> Optional[str]:
    att = data.get("attendance_pct", 80) or 80
    if att < 60:
        return "Critical attendance issue — escalate to manager"
    return None


# ── 6. HISTORICAL DELIVERY (weight 0.10) ─────────────────────────────────────

def _historical_score(data: Dict[str, Any]) -> int:
    rate = data.get("historical_on_time_rate", 100) or 100
    if rate < 50:
        return 80
    if rate < 70:
        return 50
    return 10


def _historical_reason(data: Dict[str, Any], raw: int) -> Optional[str]:
    rate = data.get("historical_on_time_rate", 100) or 100
    if rate < 70:
        return f"Historical on-time delivery rate low ({int(rate)}%)"
    return None


def _historical_rec(data: Dict[str, Any], raw: int) -> Optional[str]:
    return None  # No specific recommendation for historical pattern


# ── RULE REGISTRY ─────────────────────────────────────────────────────────────

RISK_RULES = [
    {
        "name":      "deadline_proximity",
        "weight":    0.30,
        "scorer":    _deadline_score,
        "reason_fn": _deadline_reason,
        "rec_fn":    _deadline_rec,
    },
    {
        "name":      "progress",
        "weight":    0.25,
        "scorer":    _progress_score,
        "reason_fn": _progress_reason,
        "rec_fn":    _progress_rec,
    },
    {
        "name":      "productivity",
        "weight":    0.15,
        "scorer":    _productivity_score,
        "reason_fn": _productivity_reason,
        "rec_fn":    _productivity_rec,
    },
    {
        "name":      "utilization",
        "weight":    0.10,
        "scorer":    _utilization_score,
        "reason_fn": _utilization_reason,
        "rec_fn":    _utilization_rec,
    },
    {
        "name":      "attendance",
        "weight":    0.10,
        "scorer":    _attendance_score,
        "reason_fn": _attendance_reason,
        "rec_fn":    _attendance_rec,
    },
    {
        "name":      "historical_delivery",
        "weight":    0.10,
        "scorer":    _historical_score,
        "reason_fn": _historical_reason,
        "rec_fn":    _historical_rec,
    },
]

# Sanity check — weights must sum to 1.0
assert abs(sum(r["weight"] for r in RISK_RULES) - 1.0) < 1e-9, \
    "Risk rule weights must sum to 1.0"