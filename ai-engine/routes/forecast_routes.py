"""
Growth Forecast API Routes
GET /forecast/{employeeId}
POST /forecast/
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List
from services.growth_forecast import GrowthForecastEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/forecast", tags=["Growth Forecast"])
engine = GrowthForecastEngine()


class ForecastRequest(BaseModel):
    employeeId:           int         = Field(..., description="Employee unique ID")
    productivityHistory:  List[float] = Field(default=[], description="Monthly productivity scores")
    currentProductivity:  float       = Field(default=65.0, ge=0, le=100)


class ForecastResponse(BaseModel):
    employeeId:                   int
    currentProductivity:          int
    smoothedProductivity:         int
    predictedProductivity1Month:  int
    predictedProductivity3Months: int
    predictedProductivity6Months: int
    improvement3Months:           int
    improvement6Months:           int
    trendDirection:               str
    trendPerMonth:                float
    confidence:                   int
    dataPoints:                   int
    historicalData:               List[int]


@router.get("/{employee_id}", response_model=ForecastResponse)
async def get_forecast(employee_id: int):
    """GET forecast with minimal data — returns stable forecast."""
    try:
        logger.info(f"[API] GET /forecast/{employee_id}")
        data   = {"employeeId": employee_id, "productivityHistory": [65.0]}
        result = engine.forecast(data)
        return result
    except Exception as e:
        logger.exception(f"[API] Forecast GET failed: {e}")
        raise HTTPException(status_code=500, detail=f"Forecast computation failed: {str(e)}")


@router.post("/", response_model=ForecastResponse)
async def compute_forecast(request: ForecastRequest):
    """POST forecast with historical productivity data."""
    try:
        logger.info(f"[API] POST /forecast/ for employeeId={request.employeeId}")
        data   = request.dict()
        result = engine.forecast(data)
        return result
    except Exception as e:
        logger.exception(f"[API] Forecast POST failed: {e}")
        raise HTTPException(status_code=500, detail=f"Forecast computation failed: {str(e)}")