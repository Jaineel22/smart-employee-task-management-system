"""
Attrition Risk API Routes
GET /attrition/{employeeId}
POST /attrition/
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from services.attrition_predictor import AttritionPredictor

logger    = logging.getLogger(__name__)
router    = APIRouter(prefix="/attrition", tags=["Attrition Risk"])
predictor = AttritionPredictor()


class AttritionRequest(BaseModel):
    employeeId:          int   = Field(..., description="Employee unique ID")
    attendanceTrend:     float = Field(default=0.0)
    productivityTrend:   float = Field(default=0.0)
    utilizationTrend:    float = Field(default=0.0)
    completionTrend:     float = Field(default=0.0)
    reportConsistency:   float = Field(default=1.0, ge=0.0, le=1.0)
    currentProductivity: float = Field(default=70.0, ge=0, le=100)
    currentAttendance:   float = Field(default=90.0, ge=0, le=100)


class AttritionResponse(BaseModel):
    employeeId:   int
    attritionRisk:int
    level:        str
    confidence:   int
    reasons:      List[str]
    factorScores: Dict[str, int]


@router.get("/{employee_id}", response_model=AttritionResponse)
async def get_attrition_score(employee_id: int):
    """GET attrition risk with default/neutral trends."""
    try:
        logger.info(f"[API] GET /attrition/{employee_id}")
        data   = {"employeeId": employee_id}
        result = predictor.predict(data)
        return result
    except Exception as e:
        logger.exception(f"[API] Attrition GET failed: {e}")
        raise HTTPException(status_code=500, detail=f"Attrition computation failed: {str(e)}")


@router.post("/", response_model=AttritionResponse)
async def compute_attrition(request: AttritionRequest):
    """POST attrition risk with full trend data."""
    try:
        logger.info(f"[API] POST /attrition/ for employeeId={request.employeeId}")
        data   = request.dict()
        result = predictor.predict(data)
        return result
    except Exception as e:
        logger.exception(f"[API] Attrition POST failed: {e}")
        raise HTTPException(status_code=500, detail=f"Attrition computation failed: {str(e)}")