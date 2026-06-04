"""
AI-4B: Attrition Risk API Routes
Bug fixed: result from calculate_attrition_risk does NOT contain employeeId,
so  AttritionResponse(employeeId=request.employeeId, **result) is safe.
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List

from services.attrition_predictor import calculate_attrition_risk

router = APIRouter(prefix="/attrition", tags=["Attrition Risk"])
logger = logging.getLogger(__name__)


class AttritionRequest(BaseModel):
    employeeId:            int   = Field(..., description="Employee unique ID")
    attendance_trend:      float = Field(default=0.0)
    productivity_trend:    float = Field(default=0.0)
    utilization_trend:     float = Field(default=0.0)
    task_completion_trend: float = Field(default=0.0)
    report_consistency:    float = Field(default=80.0, ge=0, le=100)
    current_attendance:    float = Field(default=80.0, ge=0, le=100)
    current_productivity:  float = Field(default=70.0, ge=0, le=100)
    current_utilization:   float = Field(default=70.0, ge=0, le=100)
    months_of_data:        int   = Field(default=1, ge=1)


class AttritionResponse(BaseModel):
    employeeId:   int
    attritionRisk: int
    level:        str
    confidence:   int
    reasons:      List[str]


@router.get("/{employeeId}", response_model=AttritionResponse)
async def get_attrition_by_id(
    employeeId: int,
    attendance_trend:      float = 0.0,
    productivity_trend:    float = 0.0,
    utilization_trend:     float = 0.0,
    task_completion_trend: float = 0.0,
    report_consistency:    float = 80.0,
    current_attendance:    float = 80.0,
    current_productivity:  float = 70.0,
    current_utilization:   float = 70.0,
    months_of_data:        int   = 1,
):
    """GET — Spring Boot passes metrics as query params."""
    try:
        logger.info("[API] GET /attrition/%d", employeeId)
        data = {
            "attendance_trend":      attendance_trend,
            "productivity_trend":    productivity_trend,
            "utilization_trend":     utilization_trend,
            "task_completion_trend": task_completion_trend,
            "report_consistency":    report_consistency,
            "current_attendance":    current_attendance,
            "current_productivity":  current_productivity,
            "current_utilization":   current_utilization,
            "months_of_data":        months_of_data,
        }
        # result has no "employeeId" key — safe to unpack
        result = calculate_attrition_risk(data)
        return AttritionResponse(employeeId=employeeId, **result)
    except Exception as e:
        logger.exception("[API] Attrition GET failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=AttritionResponse)
async def predict_attrition(request: AttritionRequest):
    """POST — full payload from Spring Boot."""
    try:
        logger.info("[API] POST /attrition/ employeeId=%d", request.employeeId)
        data = request.dict()
        emp_id = data.pop("employeeId")          # remove before passing to service
        result = calculate_attrition_risk(data)  # result has no employeeId
        return AttritionResponse(employeeId=emp_id, **result)
    except Exception as e:
        logger.exception("[API] Attrition POST failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))