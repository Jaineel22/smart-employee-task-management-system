"""
AI-4E: Growth Forecast Routes
Bug fixed: pop employeeId before calling service; result has no employeeId key.
monthlyForecast items are plain dicts — Pydantic coerces them into MonthlyForecast.
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List

from services.growth_forecast import forecast_growth

router = APIRouter(prefix="/forecast", tags=["Growth Forecast"])
logger = logging.getLogger(__name__)


class ForecastRequest(BaseModel):
    employeeId:           int         = Field(..., description="Employee unique ID")
    productivity_history: List[float] = Field(default_factory=list)
    current_productivity: float       = Field(default=70.0, ge=0, le=100)
    burnout_score:        float       = Field(default=0.0,  ge=0, le=100)
    utilization_pct:      float       = Field(default=70.0, ge=0, le=100)
    attendance_pct:       float       = Field(default=80.0, ge=0, le=100)


class MonthlyForecast(BaseModel):
    month:                  int
    predictedProductivity:  float


class ForecastResponse(BaseModel):
    employeeId:                     int
    currentProductivity:            float
    predictedProductivity3Months:   float
    improvement:                    float
    trend:                          str
    monthlyForecast:                List[MonthlyForecast]


@router.get("/{employeeId}", response_model=ForecastResponse)
async def get_forecast(
    employeeId:           int,
    current_productivity: float = 70.0,
    burnout_score:        float = 0.0,
    utilization_pct:      float = 70.0,
    attendance_pct:       float = 80.0,
):
    """GET — pass metrics as query params. History requires POST."""
    try:
        logger.info("[API] GET /forecast/%d", employeeId)
        data = {
            "productivity_history": [],
            "current_productivity": current_productivity,
            "burnout_score":        burnout_score,
            "utilization_pct":      utilization_pct,
            "attendance_pct":       attendance_pct,
        }
        result = forecast_growth(data)   # no employeeId in result
        return ForecastResponse(employeeId=employeeId, **result)
    except Exception as e:
        logger.exception("[API] Forecast GET failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=ForecastResponse)
async def create_forecast(request: ForecastRequest):
    try:
        logger.info("[API] POST /forecast/ employeeId=%d", request.employeeId)
        data = request.dict()
        emp_id = data.pop("employeeId")    # remove before passing to service
        result = forecast_growth(data)     # no employeeId in result
        return ForecastResponse(employeeId=emp_id, **result)
    except Exception as e:
        logger.exception("[API] Forecast POST failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))