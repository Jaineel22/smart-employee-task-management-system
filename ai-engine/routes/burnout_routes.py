"""
AI-4A: Burnout Detection API Routes
Matches YOUR existing burnout_routes.py exactly:
  - BurnoutRequest uses camelCase field names
  - BurnoutResponse includes factorScores: Dict[str, int]
  - Module-level singleton: predictor = BurnoutPredictor()
  - GET  /burnout/{employee_id}
  - POST /burnout/
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict

from services.burnout_predictor import BurnoutPredictor

logger    = logging.getLogger(__name__)
router    = APIRouter(prefix="/burnout", tags=["Burnout Detection"])
predictor = BurnoutPredictor()          # singleton — matches your app.py test endpoint


# ── Request model (camelCase — matches Spring Boot payload) ──────────────────
class BurnoutRequest(BaseModel):
    employeeId:            int   = Field(...,         description="Employee unique ID")
    attendancePercentage:  float = Field(default=90.0,  ge=0,   le=100)
    monthlyHoursWorked:    float = Field(default=176.0, ge=0)
    dailyAverageHours:     float = Field(default=8.0,   ge=0,   le=24)
    pendingTasks:          int   = Field(default=0,     ge=0)
    overdueTasks:          int   = Field(default=0,     ge=0)
    utilizationPercentage: float = Field(default=70.0,  ge=0,   le=110)
    consecutiveWorkDays:   int   = Field(default=5,     ge=0)
    reportsTotal:          int   = Field(default=20,    ge=0)
    reportsSubmitted:      int   = Field(default=20,    ge=0)


# ── Response model (must match exactly what BurnoutPredictor.predict returns) ─
class BurnoutResponse(BaseModel):
    employeeId:   int
    burnoutRisk:  int
    level:        str
    reasons:      List[str]
    factorScores: Dict[str, int]


# ── GET /burnout/{employee_id} ────────────────────────────────────────────────
@router.get("/{employee_id}", response_model=BurnoutResponse)
async def get_burnout_score(employee_id: int):
    """
    Returns burnout risk score using default metric values.
    Quick check — Spring Boot GET call with no body.
    """
    try:
        logger.info("[API] GET /burnout/%d", employee_id)
        # Pass employeeId so the predictor can echo it back
        result = predictor.predict({"employeeId": employee_id})
        return BurnoutResponse(**result)
    except Exception as e:
        logger.exception("[API] Burnout GET failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Burnout computation failed: {str(e)}")


# ── POST /burnout/ ────────────────────────────────────────────────────────────
@router.post("/", response_model=BurnoutResponse)
async def compute_burnout(request: BurnoutRequest):
    """
    Full burnout risk computation with real employee metrics.
    Called by Spring Boot WorkforceIntelligenceService with actual data.
    """
    try:
        logger.info("[API] POST /burnout/ employeeId=%d", request.employeeId)
        result = predictor.predict(request.dict())
        return BurnoutResponse(**result)
    except Exception as e:
        logger.exception("[API] Burnout POST failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Burnout computation failed: {str(e)}")