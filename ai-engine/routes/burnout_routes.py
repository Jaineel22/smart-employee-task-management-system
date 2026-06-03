"""
Burnout Detection API Routes
GET /burnout/{employeeId}
"""

import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from services.burnout_predictor import BurnoutPredictor

logger    = logging.getLogger(__name__)
router    = APIRouter(prefix="/burnout", tags=["Burnout Detection"])
predictor = BurnoutPredictor()


class BurnoutRequest(BaseModel):
    employeeId:            int   = Field(..., description="Employee unique ID")
    attendancePercentage:  float = Field(default=90.0,  ge=0,   le=100)
    monthlyHoursWorked:    float = Field(default=176.0, ge=0)
    dailyAverageHours:     float = Field(default=8.0,   ge=0,   le=24)
    pendingTasks:          int   = Field(default=0,     ge=0)
    overdueTasks:          int   = Field(default=0,     ge=0)
    utilizationPercentage: float = Field(default=70.0,  ge=0,   le=110)
    consecutiveWorkDays:   int   = Field(default=5,     ge=0)
    reportsTotal:          int   = Field(default=20,    ge=0)
    reportsSubmitted:      int   = Field(default=20,    ge=0)


class BurnoutResponse(BaseModel):
    employeeId:   int
    burnoutRisk:  int
    level:        str
    reasons:      List[str]
    factorScores: Dict[str, int]


@router.get("/{employee_id}", response_model=BurnoutResponse)
async def get_burnout_score(employee_id: int):
    """
    Returns burnout risk score for an employee.
    Uses default values when called with just employeeId (GET).
    """
    try:
        logger.info(f"[API] GET /burnout/{employee_id}")
        data   = {"employeeId": employee_id}
        result = predictor.predict(data)
        return result
    except Exception as e:
        logger.exception(f"[API] Burnout GET failed: {e}")
        raise HTTPException(status_code=500, detail=f"Burnout computation failed: {str(e)}")


@router.post("/", response_model=BurnoutResponse)
async def compute_burnout(request: BurnoutRequest):
    """
    Returns burnout risk with full employee metrics payload.
    Called by Spring Boot with real employee data.
    """
    try:
        logger.info(f"[API] POST /burnout/ for employeeId={request.employeeId}")
        data   = request.dict()
        result = predictor.predict(data)
        return result
    except Exception as e:
        logger.exception(f"[API] Burnout POST failed: {e}")
        raise HTTPException(status_code=500, detail=f"Burnout computation failed: {str(e)}")