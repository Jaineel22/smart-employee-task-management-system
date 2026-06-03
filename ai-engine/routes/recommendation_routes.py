"""
Recommendation Engine API Routes
GET /recommendations/{employeeId}
POST /recommendations/
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List
from services.recommendation_engine import RecommendationEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/recommendations", tags=["Recommendations"])
engine = RecommendationEngine()


class RecommendationRequest(BaseModel):
    employeeId:           int   = Field(..., description="Employee unique ID")
    productivityScore:    float = Field(default=70.0, ge=0, le=100)
    burnoutRisk:          float = Field(default=30.0, ge=0, le=100)
    attritionRisk:        float = Field(default=20.0, ge=0, le=100)
    attendancePercentage: float = Field(default=90.0, ge=0, le=100)
    utilizationPercentage:float = Field(default=70.0, ge=0, le=110)
    pendingTasks:         int   = Field(default=0,    ge=0)
    overdueTasks:         int   = Field(default=0,    ge=0)
    reportConsistency:    float = Field(default=1.0,  ge=0, le=1.0)
    completionRate:       float = Field(default=85.0, ge=0, le=100)


class RecommendationResponse(BaseModel):
    employeeId:          int
    recommendations:     List[str]
    expectedImprovement: int
    priority:            str
    recommendationCount: int


@router.get("/{employee_id}", response_model=RecommendationResponse)
async def get_recommendations(employee_id: int):
    """GET recommendations with neutral defaults."""
    try:
        logger.info(f"[API] GET /recommendations/{employee_id}")
        data   = {"employeeId": employee_id}
        result = engine.generate(data)
        return result
    except Exception as e:
        logger.exception(f"[API] Recommendations GET failed: {e}")
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")


@router.post("/", response_model=RecommendationResponse)
async def generate_recommendations(request: RecommendationRequest):
    """POST recommendations with full employee context."""
    try:
        logger.info(f"[API] POST /recommendations/ for employeeId={request.employeeId}")
        data   = request.dict()
        result = engine.generate(data)
        return result
    except Exception as e:
        logger.exception(f"[API] Recommendations POST failed: {e}")
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")