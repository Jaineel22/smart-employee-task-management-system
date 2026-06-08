"""
AI-5: Recommendation Engine API Routes
POST /recommendations/employee/
GET  /recommendations/employee/{employee_id}

PRESERVES existing AI-4D endpoints:
  GET  /recommendations/{employeeId}
  POST /recommendations/
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

from services.recommendation_engine import (
    generate_recommendations,              # AI-4D backward compat
    generate_structured_recommendations,   # AI-5 new
)

router = APIRouter(prefix="/recommendations", tags=["AI-5 Recommendations"])
logger = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════════════════
# AI-4D REQUEST/RESPONSE MODELS (BACKWARD COMPAT - PRESERVED)
# ════════════════════════════════════════════════════════════════════════════
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


# ════════════════════════════════════════════════════════════════════════════
# AI-5 REQUEST/RESPONSE MODELS (NEW)
# ════════════════════════════════════════════════════════════════════════════
class EmployeeRecommendationRequest(BaseModel):
    employeeId:             int
    attendance_pct:         float = Field(default=80.0,  ge=0, le=100)
    productivity_pct:       float = Field(default=70.0,  ge=0, le=100)
    utilization_pct:        float = Field(default=70.0,  ge=0, le=110)
    report_consistency:     float = Field(default=80.0,  ge=0, le=100)
    pending_tasks:          int   = Field(default=0,     ge=0)
    overdue_tasks:          int   = Field(default=0,     ge=0)
    predicted_productivity: Optional[float] = Field(default=None, ge=0, le=100)
    burnout_score:          float = Field(default=0.0,   ge=0, le=100)
    attrition_score:        float = Field(default=0.0,   ge=0, le=100)
    daily_avg_hours:        float = Field(default=8.0,   ge=0)
    consecutive_work_days:  int   = Field(default=5,     ge=0)


class StructuredRecommendation(BaseModel):
    message:     str
    category:    str
    priority:    str
    impactScore: int
    confidence:  int
    generatedAt: str


class StructuredRecommendationResponse(BaseModel):
    employeeId:      int
    recommendations: List[StructuredRecommendation]
    overallPriority: str
    totalCount:      int


class LegacyRecommendationResponse(BaseModel):
    """AI-4D schema — kept for backward compat"""
    employeeId:          int
    recommendations:     List[str]
    expectedImprovement: int


# ════════════════════════════════════════════════════════════════════════════
# AI-4D BACKWARD COMPAT ENDPOINTS (PRESERVED - DO NOT MODIFY)
# ════════════════════════════════════════════════════════════════════════════

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
    """
    AI-4D BACKWARD COMPAT - DO NOT MODIFY.
    Returns plain text recommendations + expectedImprovement.
    """
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
    """
    AI-4D BACKWARD COMPAT - DO NOT MODIFY.
    Returns plain text recommendations + expectedImprovement.
    """
    try:
        logger.info("[API] POST /recommendations/ employeeId=%d", request.employeeId)
        data = request.dict()
        emp_id = data.pop("employeeId")              # remove before passing to service
        result = generate_recommendations(data)      # no employeeId in result
        return RecommendationResponse(employeeId=emp_id, **result)
    except Exception as e:
        logger.exception("[API] Recommendations POST failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════════════════
# AI-5 NEW ENDPOINTS (ADDITIVE - NO BREAKING CHANGES)
# ════════════════════════════════════════════════════════════════════════════

@router.post("/employee/", response_model=StructuredRecommendationResponse)
async def get_structured_recommendations(request: EmployeeRecommendationRequest):
    """
    AI-5 structured recommendations with category, priority, impact, confidence.
    Called by Spring Boot RecommendationService.
    """
    try:
        logger.info("[API] POST /recommendations/employee/ id=%d", request.employeeId)
        data   = request.dict()
        emp_id = data.pop("employeeId")
        result = generate_structured_recommendations(data)

        return StructuredRecommendationResponse(
            employeeId=emp_id,
            **result,
        )
    except Exception as e:
        logger.exception("[API] Structured recommendations failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/employee/{employee_id}", response_model=StructuredRecommendationResponse)
async def get_recommendations_for_employee(
    employee_id: int,
    attendance_pct:     float = 80.0,
    productivity_pct:   float = 70.0,
    utilization_pct:    float = 70.0,
    report_consistency: float = 80.0,
    pending_tasks:      int   = 0,
    overdue_tasks:      int   = 0,
):
    """
    AI-5 GET endpoint — Spring Boot passes metrics as query params.
    Returns structured recommendations.
    """
    try:
        data = {
            "attendance_pct":     attendance_pct,
            "productivity_pct":   productivity_pct,
            "utilization_pct":    utilization_pct,
            "report_consistency": report_consistency,
            "pending_tasks":      pending_tasks,
            "overdue_tasks":      overdue_tasks,
        }
        result = generate_structured_recommendations(data)
        return StructuredRecommendationResponse(employeeId=employee_id, **result)
    except Exception as e:
        logger.exception("[API] Recommendations GET failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/legacy/", response_model=LegacyRecommendationResponse)
async def get_legacy_recommendations(request: EmployeeRecommendationRequest):
    """
    AI-4D backward-compat endpoint (alternative path).
    Returns plain text recommendations + expectedImprovement.
    """
    try:
        data   = request.dict()
        emp_id = data.pop("employeeId")
        result = generate_recommendations(data)
        return LegacyRecommendationResponse(employeeId=emp_id, **result)
    except Exception as e:
        logger.exception("[API] Legacy recommendations failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))