"""
Productivity Routes — wraps existing predictor for AI-4 router structure.
Keeps backward compatibility with existing /predict endpoint.
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/productivity", tags=["Productivity"])


class ProductivityRequest(BaseModel):
    employeeId:           int   = Field(..., description="Employee unique ID")
    attendancePercentage: float = Field(default=90.0, ge=0, le=100)
    tasksCompleted:       int   = Field(default=10,   ge=0)
    hoursWorked:          float = Field(default=160.0, ge=0)
    overdueTasks:         int   = Field(default=0,    ge=0)
    utilizationRate:      float = Field(default=70.0, ge=0, le=110)


@router.get("/{employee_id}")
async def get_productivity(employee_id: int):
    """Stub — delegates to existing /predict endpoint."""
    return {
        "employeeId": employee_id,
        "message":    "Use POST /predict for productivity prediction",
        "endpoint":   "/predict",
    }