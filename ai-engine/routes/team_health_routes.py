"""
Team Health API Routes
GET /team-health/{managerId}
POST /team-health/
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from services.team_health_engine import TeamHealthEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/team-health", tags=["Team Health"])
engine = TeamHealthEngine()


class EmployeeMetric(BaseModel):
    employeeId:           int
    name:                 str  = ""
    attendancePercentage: float = Field(default=90.0, ge=0, le=100)
    productivityScore:    float = Field(default=70.0, ge=0, le=100)
    utilizationPercentage:float = Field(default=70.0, ge=0, le=110)
    completionRate:       float = Field(default=85.0, ge=0, le=100)
    burnoutRisk:          float = Field(default=20.0, ge=0, le=100)
    attritionRisk:        float = Field(default=20.0, ge=0, le=100)


class TeamHealthRequest(BaseModel):
    managerId: int         = Field(..., description="Manager unique ID")
    employees: List[EmployeeMetric] = Field(default=[])


@router.post("/", tags=["Team Health"])
async def compute_team_health(request: TeamHealthRequest):
    """POST team health with all employee metrics."""
    try:
        logger.info(
            f"[API] POST /team-health/ for managerId={request.managerId}, "
            f"employees={len(request.employees)}"
        )
        data = {
            "managerId": request.managerId,
            "employees": [e.dict() for e in request.employees],
        }
        result = engine.compute(data)
        return result
    except Exception as e:
        logger.exception(f"[API] Team Health POST failed: {e}")
        raise HTTPException(status_code=500, detail=f"Team health computation failed: {str(e)}")


@router.get("/{manager_id}", tags=["Team Health"])
async def get_team_health(manager_id: int):
    """GET team health with empty team — returns zero-state response."""
    try:
        logger.info(f"[API] GET /team-health/{manager_id}")
        data   = {"managerId": manager_id, "employees": []}
        result = engine.compute(data)
        return result
    except Exception as e:
        logger.exception(f"[API] Team Health GET failed: {e}")
        raise HTTPException(status_code=500, detail=f"Team health computation failed: {str(e)}")