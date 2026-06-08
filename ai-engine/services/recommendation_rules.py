"""
recommendation_rules.py
========================
AI-5: Recommendation Rule Definitions
Separated from engine logic so future ML models can replace or augment rules
without touching the API layer.

Each rule is a tuple:
    (condition_fn, message_fn, category, priority_fn, impact, confidence)
Where:
    condition_fn  : callable(data) → bool
    message_fn    : callable(data) → str
    category      : str
    priority_fn   : callable(data) → str   (HIGH | MEDIUM | LOW)
    impact        : int   0–100
    confidence    : int   0–100
"""

from typing import List, Tuple, Callable, Dict, Any


# ── Type alias ────────────────────────────────────────────────────────────────
RuleType = Tuple[
    Callable[[Dict], bool],   # condition
    Callable[[Dict], str],    # message
    str,                      # category
    Callable[[Dict], str],    # priority
    int,                      # impact
    int,                      # confidence
]


def _fmt(val) -> str:
    try:
        return str(int(round(float(val))))
    except Exception:
        return str(val)


# ════════════════════════════════════════════════════════════════════════════
# ATTENDANCE RULES
# ════════════════════════════════════════════════════════════════════════════
ATTENDANCE_RULES: List[RuleType] = [
    (
        lambda d: d.get("attendance_pct", 100) < 65,
        lambda d: (f"Attendance critically low ({_fmt(d.get('attendance_pct', 0))}%) — "
                   f"aim for 80%+ to avoid productivity score penalties"),
        "ATTENDANCE", lambda d: "HIGH", 90, 88,
    ),
    (
        lambda d: 65 <= d.get("attendance_pct", 100) < 75,
        lambda d: (f"Attendance dropped to {_fmt(d.get('attendance_pct', 0))}% — "
                   f"increase consistency to maintain your performance score"),
        "ATTENDANCE", lambda d: "MEDIUM", 70, 82,
    ),
    (
        lambda d: 75 <= d.get("attendance_pct", 100) < 85,
        lambda d: (f"Good attendance ({_fmt(d.get('attendance_pct', 0))}%) — "
                   f"maintain this to maximise your productivity score"),
        "CONSISTENCY", lambda d: "LOW", 40, 75,
    ),
]

# ════════════════════════════════════════════════════════════════════════════
# PRODUCTIVITY RULES
# ════════════════════════════════════════════════════════════════════════════
PRODUCTIVITY_RULES: List[RuleType] = [
    (
        lambda d: d.get("productivity_pct", 70) < 45,
        lambda d: ("Productivity critically low — identify and eliminate "
                   "the top 3 time-wasting activities immediately"),
        "PRODUCTIVITY_IMPROVEMENT", lambda d: "HIGH", 95, 90,
    ),
    (
        lambda d: 45 <= d.get("productivity_pct", 70) < 60,
        lambda d: ("Use time-blocking: allocate dedicated 2-hour focus blocks "
                   "for your highest-priority tasks daily"),
        "TIME_MANAGEMENT", lambda d: "HIGH", 82, 85,
    ),
    (
        lambda d: 60 <= d.get("productivity_pct", 70) < 72,
        lambda d: (f"Productivity at {_fmt(d.get('productivity_pct', 70))}% — "
                   f"completing pending tasks before accepting new ones will push this above 75%"),
        "FOCUS", lambda d: "MEDIUM", 62, 78,
    ),
    (
        lambda d: d.get("productivity_pct", 70) >= 85,
        lambda d: (f"Excellent productivity ({_fmt(d.get('productivity_pct', 70))}%) — "
                   f"consider mentoring teammates to sustain team performance"),
        "SKILL_IMPROVEMENT", lambda d: "LOW", 35, 72,
    ),
]

# ════════════════════════════════════════════════════════════════════════════
# TASK / DEADLINE RULES
# ════════════════════════════════════════════════════════════════════════════
TASK_RULES: List[RuleType] = [
    (
        lambda d: d.get("overdue_tasks", 0) >= 5,
        lambda d: (f"{_fmt(d.get('overdue_tasks', 0))} overdue tasks detected — "
                   f"allocate 2 dedicated hours daily to clear the backlog first"),
        "TASK_PRIORITIZATION", lambda d: "HIGH", 92, 91,
    ),
    (
        lambda d: 2 <= d.get("overdue_tasks", 0) < 5,
        lambda d: (f"Reduce overdue tasks ({_fmt(d.get('overdue_tasks', 0))} overdue) "
                   f"by 50% this week — focus on oldest deadlines first"),
        "DEADLINE_MANAGEMENT", lambda d: "HIGH", 85, 87,
    ),
    (
        lambda d: d.get("overdue_tasks", 0) == 1,
        lambda d: "1 overdue task — clear it today before working on in-progress items",
        "DEADLINE_MANAGEMENT", lambda d: "MEDIUM", 70, 82,
    ),
    (
        lambda d: d.get("pending_tasks", 0) >= 10,
        lambda d: (f"Heavy backlog: {_fmt(d.get('pending_tasks', 0))} pending tasks — "
                   f"break them into daily sub-goals; avoid accepting new assignments"),
        "WORKLOAD_BALANCING", lambda d: "HIGH", 88, 84,
    ),
    (
        lambda d: 6 <= d.get("pending_tasks", 0) < 10,
        lambda d: (f"Elevated pending tasks ({_fmt(d.get('pending_tasks', 0))}) — "
                   f"complete current work before taking on new assignments"),
        "FOCUS", lambda d: "MEDIUM", 65, 79,
    ),
]

# ════════════════════════════════════════════════════════════════════════════
# UTILIZATION RULES
# ════════════════════════════════════════════════════════════════════════════
UTILIZATION_RULES: List[RuleType] = [
    (
        lambda d: d.get("utilization_pct", 70) > 95,
        lambda d: (f"Utilization critically high ({_fmt(d.get('utilization_pct', 70))}%) — "
                   f"speak with your manager about redistributing some tasks"),
        "WORKLOAD_BALANCING", lambda d: "HIGH", 87, 83,
    ),
    (
        lambda d: d.get("utilization_pct", 70) < 45,
        lambda d: (f"Utilization low ({_fmt(d.get('utilization_pct', 70))}%) — "
                   f"take on additional tasks to improve your contribution score"),
        "PRODUCTIVITY_IMPROVEMENT", lambda d: "MEDIUM", 60, 76,
    ),
]

# ════════════════════════════════════════════════════════════════════════════
# REPORT CONSISTENCY RULES
# ════════════════════════════════════════════════════════════════════════════
REPORT_RULES: List[RuleType] = [
    (
        lambda d: d.get("report_consistency", 80) < 50,
        lambda d: ("Daily work report submission rate is very low — "
                   "reports directly impact your efficiency calculation"),
        "CONSISTENCY", lambda d: "HIGH", 80, 86,
    ),
    (
        lambda d: 50 <= d.get("report_consistency", 80) < 70,
        lambda d: "Improve report submission rate to above 80% for accurate productivity tracking",
        "CONSISTENCY", lambda d: "MEDIUM", 55, 78,
    ),
]

# ════════════════════════════════════════════════════════════════════════════
# AI PREDICTION INTEGRATION RULES
# ════════════════════════════════════════════════════════════════════════════
PREDICTION_RULES: List[RuleType] = [
    (
        lambda d: (d.get("predicted_productivity") is not None
                   and d.get("predicted_productivity", 70) - d.get("productivity_pct", 70) >= 8),
        lambda d: (f"Your productivity is projected to increase by "
                   f"{_fmt(d.get('predicted_productivity', 70) - d.get('productivity_pct', 70))}% "
                   f"next month — maintain current work habits to realise this gain"),
        "PRODUCTIVITY_IMPROVEMENT", lambda d: "LOW", 50, 74,
    ),
    (
        lambda d: (d.get("predicted_productivity") is not None
                   and d.get("productivity_pct", 70) - d.get("predicted_productivity", 70) >= 8),
        lambda d: (f"AI forecast predicts a productivity decline of "
                   f"{_fmt(d.get('productivity_pct', 70) - d.get('predicted_productivity', 70))}% — "
                   f"focus on task completion and attendance now"),
        "PRODUCTIVITY_IMPROVEMENT", lambda d: "HIGH", 88, 80,
    ),
]

# ── Master registry ────────────────────────────────────────────────────────────
ALL_RECOMMENDATION_RULES: List[RuleType] = (
    ATTENDANCE_RULES
    + PRODUCTIVITY_RULES
    + TASK_RULES
    + UTILIZATION_RULES
    + REPORT_RULES
    + PREDICTION_RULES
)