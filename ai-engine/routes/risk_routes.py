"""
AI-6: Deadline Risk Prediction API Routes
GET  /risk/task/{task_id}
POST /risk/task/
GET  /risk/team/
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from services.risk_prediction_engine import RiskPredictionEngine

router    = APIRouter(prefix="/risk", tags=["Deadline Risk Prediction"])
logger    = logging.getLogger(__name__)
engine    = RiskPredictionEngine()          # module-level singleton


# ── Request model ─────────────────────────────────────────────────────────────
class RiskRequest(BaseModel):
    task_id:                 Optional[int]   = None
    task_title:              Optional[str]   = None
    days_remaining:          Optional[int]   = None
    completion_percentage:   int             = Field(default=0,    ge=0, le=100)
    expected_progress:       int             = Field(default=50,   ge=0, le=100)
    productivity_score:      float           = Field(default=70.0, ge=0, le=100)
    utilization_pct:         float           = Field(default=70.0, ge=0, le=110)
    attendance_pct:          float           = Field(default=80.0, ge=0, le=100)
    historical_on_time_rate: float           = Field(default=100.0,ge=0, le=100)
    priority:                str             = Field(default="MEDIUM")
    task_complexity:         Optional[str]   = None


# ── Response model ────────────────────────────────────────────────────────────
class FactorBreakdown(BaseModel):
    deadline_proximity:  Optional[int] = None
    progress:            Optional[int] = None
    productivity:        Optional[int] = None
    utilization:         Optional[int] = None
    attendance:          Optional[int] = None
    historical_delivery: Optional[int] = None


class RiskResponse(BaseModel):
    taskId:           Optional[int]
    taskTitle:        Optional[str]
    riskScore:        int
    riskLevel:        str
    confidence:       int
    reasons:          List[str]
    recommendations:  List[str]
    factorBreakdown:  Dict[str, Any]
    mlModelUsed:      bool


# ── POST /risk/task/ ──────────────────────────────────────────────────────────
@router.post("/task/", response_model=RiskResponse)
async def predict_task_risk(request: RiskRequest):
    """
    Full risk computation with all metrics.
    Called by Spring Boot DeadlineRiskService for individual task scoring.
    """
    try:
        logger.info("[API] POST /risk/task/ task_id=%s", request.task_id)
        result = engine.predict(request.dict())
        return RiskResponse(**result)
    except Exception as e:
        logger.exception("[API] Risk POST failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Risk computation failed: {str(e)}")


# ── GET /risk/task/{task_id} — quick check with defaults ──────────────────────
@router.get("/task/{task_id}", response_model=RiskResponse)
async def get_task_risk(
    task_id: int,
    days_remaining:          Optional[int]   = None,
    completion_percentage:   int             = 0,
    expected_progress:       int             = 50,
    productivity_score:      float           = 70.0,
    utilization_pct:         float           = 70.0,
    attendance_pct:          float           = 80.0,
    historical_on_time_rate: float           = 100.0,
    priority:                str             = "MEDIUM",
):
    try:
        logger.info("[API] GET /risk/task/%d", task_id)
        data = {
            "task_id":                 task_id,
            "days_remaining":          days_remaining,
            "completion_percentage":   completion_percentage,
            "expected_progress":       expected_progress,
            "productivity_score":      productivity_score,
            "utilization_pct":         utilization_pct,
            "attendance_pct":          attendance_pct,
            "historical_on_time_rate": historical_on_time_rate,
            "priority":                priority,
        }
        result = engine.predict(data)
        return RiskResponse(**result)
    except Exception as e:
        logger.exception("[API] Risk GET failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /risk/team/ — batch scoring ─────────────────────────────────────────
class TeamRiskRequest(BaseModel):
    tasks: List[RiskRequest]


class TeamRiskResponse(BaseModel):
    totalTasks:      int
    criticalCount:   int
    highCount:       int
    mediumCount:     int
    lowCount:        int
    avgRiskScore:    int
    teamRiskLevel:   str
    taskRisks:       List[RiskResponse]


@router.post("/team/", response_model=TeamRiskResponse)
async def predict_team_risk(request: TeamRiskRequest):
    """
    Batch risk scoring for all tasks in a team.
    Spring Boot sends all active tasks; FastAPI scores each one.
    """
    try:
        logger.info("[API] POST /risk/team/ tasks=%d", len(request.tasks))
        risks = []
        for task_req in request.tasks:
            try:
                result = engine.predict(task_req.dict())
                risks.append(RiskResponse(**result))
            except Exception as e:
                logger.warning("[API] Skipping task %s: %s", task_req.task_id, e)

        risks.sort(key=lambda r: r.riskScore, reverse=True)

        critical = sum(1 for r in risks if r.riskLevel == "CRITICAL")
        high     = sum(1 for r in risks if r.riskLevel == "HIGH")
        medium   = sum(1 for r in risks if r.riskLevel == "MEDIUM")
        low      = sum(1 for r in risks if r.riskLevel == "LOW")
        avg      = int(sum(r.riskScore for r in risks) / len(risks)) if risks else 0

        team_level = (
            "CRITICAL" if critical > 0 else
            "HIGH"     if high > 0     else
            "MEDIUM"   if medium > 0   else
            "LOW"
        )

        return TeamRiskResponse(
            totalTasks=len(risks),
            criticalCount=critical,
            highCount=high,
            mediumCount=medium,
            lowCount=low,
            avgRiskScore=avg,
            teamRiskLevel=team_level,
            taskRisks=risks,
        )
    except Exception as e:
        logger.exception("[API] Team risk POST failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))