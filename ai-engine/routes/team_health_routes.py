"""
AI-4C: Team Health Engine Routes
Bug fixed:
  - calculate_team_health result has no managerId key — injected by route
  - POST endpoint pops managerId from request before building employee list
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

from services.team_health_engine import calculate_team_health

router = APIRouter(prefix="/team-health", tags=["Team Health"])
logger = logging.getLogger(__name__)


class EmployeeMetric(BaseModel):
    employeeId:         int
    attendance_pct:     float = Field(default=80.0,  ge=0, le=100)
    productivity_pct:   float = Field(default=70.0,  ge=0, le=100)
    utilization_pct:    float = Field(default=70.0,  ge=0, le=100)
    task_completion:    float = Field(default=75.0,  ge=0, le=100)
    report_consistency: float = Field(default=70.0,  ge=0, le=100)
    burnout_score:      float = Field(default=0.0,   ge=0, le=100)
    attrition_score:    float = Field(default=0.0,   ge=0, le=100)


class TeamHealthRequest(BaseModel):
    managerId: int
    employees: List[EmployeeMetric]


class TeamHealthResponse(BaseModel):
    managerId:          int
    teamHealth:         float
    category:           str
    attendanceScore:    float
    productivityScore:  float
    completionScore:    float
    engagementScore:    float
    utilizationScore:   float
    teamSize:           int
    highRiskEmployees:  List[int]
    topPerformers:      List[int]
    bottomPerformers:   List[int]


@router.post("/", response_model=TeamHealthResponse)
async def calculate_health(request: TeamHealthRequest):
    """
    POST — Spring Boot sends managerId + list of employee metrics.
    result from calculate_team_health has no managerId key.
    """
    try:
        if not request.employees:
            raise HTTPException(status_code=400, detail="No employee data provided")

        logger.info(
            "[API] POST /team-health/ managerId=%d employees=%d",
            request.managerId, len(request.employees),
        )
        # EmployeeMetric.dict() produces "employeeId" (camelCase) — correct
        employees_data = [e.dict() for e in request.employees]
        result = calculate_team_health(employees_data)   # no managerId in result
        return TeamHealthResponse(managerId=request.managerId, **result)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[API] Team health POST failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{managerId}", response_model=TeamHealthResponse)
async def get_team_health(managerId: int):
    """
    GET — returns a zeroed placeholder.
    Spring Boot should use POST with actual employee metrics for real data.
    """
    logger.info("[API] GET /team-health/%d — returning empty placeholder", managerId)
    return TeamHealthResponse(
        managerId=managerId,
        teamHealth=0.0,
        category="Needs Attention",
        attendanceScore=0.0,
        productivityScore=0.0,
        completionScore=0.0,
        engagementScore=0.0,
        utilizationScore=0.0,
        teamSize=0,
        highRiskEmployees=[],
        topPerformers=[],
        bottomPerformers=[],
    )