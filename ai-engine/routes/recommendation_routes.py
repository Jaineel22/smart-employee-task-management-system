"""
AI-4D: Recommendation Engine Routes
Bug fixed: pop employeeId before calling service; result has no employeeId key.
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List

from services.recommendation_engine import generate_recommendations

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])
logger = logging.getLogger(__name__)


class RecommendationRequest(BaseModel):
    employeeId:           int   = Field(..., description="Employee unique ID")
    attendance_pct:       float = Field(default=80.0,  ge=0, le=100)
    productivity_pct:     float = Field(default=70.0,  ge=0, le=100)
    utilization_pct:      float = Field(default=70.0,  ge=0, le=100)
    pending_tasks:        int   = Field(default=0,     ge=0)
    overdue_tasks:        int   = Field(default=0,     ge=0)
    burnout_score:        float = Field(default=0.0,   ge=0, le=100)
    attrition_score:      float = Field(default=0.0,   ge=0, le=100)
    daily_avg_hours:      float = Field(default=8.0,   ge=0)
    report_consistency:   float = Field(default=80.0,  ge=0, le=100)
    consecutive_work_days: int  = Field(default=5,     ge=0)


class RecommendationResponse(BaseModel):
    employeeId:           int
    recommendations:      List[str]
    expectedImprovement:  int


@router.get("/{employeeId}", response_model=RecommendationResponse)
async def get_recommendations(
    employeeId:           int,
    attendance_pct:       float = 80.0,
    productivity_pct:     float = 70.0,
    utilization_pct:      float = 70.0,
    pending_tasks:        int   = 0,
    overdue_tasks:        int   = 0,
    burnout_score:        float = 0.0,
    attrition_score:      float = 0.0,
    daily_avg_hours:      float = 8.0,
    report_consistency:   float = 80.0,
    consecutive_work_days: int  = 5,
):
    try:
        logger.info("[API] GET /recommendations/%d", employeeId)
        data = {
            "attendance_pct":       attendance_pct,
            "productivity_pct":     productivity_pct,
            "utilization_pct":      utilization_pct,
            "pending_tasks":        pending_tasks,
            "overdue_tasks":        overdue_tasks,
            "burnout_score":        burnout_score,
            "attrition_score":      attrition_score,
            "daily_avg_hours":      daily_avg_hours,
            "report_consistency":   report_consistency,
            "consecutive_work_days": consecutive_work_days,
        }
        result = generate_recommendations(data)   # no employeeId in result
        return RecommendationResponse(employeeId=employeeId, **result)
    except Exception as e:
        logger.exception("[API] Recommendations GET failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=RecommendationResponse)
async def create_recommendations(request: RecommendationRequest):
    try:
        logger.info("[API] POST /recommendations/ employeeId=%d", request.employeeId)
        data = request.dict()
        emp_id = data.pop("employeeId")              # remove before passing to service
        result = generate_recommendations(data)      # no employeeId in result
        return RecommendationResponse(employeeId=emp_id, **result)
    except Exception as e:
        logger.exception("[API] Recommendations POST failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))