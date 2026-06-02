"""
burnout_routes.py
=================
FastAPI routes for burnout detection endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
import logging

from services.burnout_predictor import predict_burnout
from services.feature_engineering import get_employee_features

router = APIRouter(prefix="/burnout", tags=["Burnout Detection"])
logger = logging.getLogger(__name__)


@router.get("/{employee_id}")
async def get_burnout_risk(
    employee_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None
) -> Dict[str, Any]:
    """
    Get burnout risk assessment for an employee.
    
    Args:
        employee_id: The employee's ID
        month: Month (1-12), defaults to current month
        year: Year (e.g., 2026), defaults to current year
    
    Returns:
        Burnout risk assessment with score, level, reasons, recommendations
    """
    try:
        # Get employee features from database (via Spring Boot)
        # In a real implementation, this would call Spring Boot
        # For now, we accept features in request or use defaults
        
        # For Phase 4A, we'll accept query params or use demo data
        features = {
            'employee_id': employee_id,
            'attendance_percentage': float(request.query_params.get('attendance', 85)),
            'monthly_hours_worked': float(request.query_params.get('hours', 160)),
            'daily_avg_hours': float(request.query_params.get('daily_hours', 8)),
            'pending_tasks': int(request.query_params.get('pending', 0)),
            'overdue_tasks': int(request.query_params.get('overdue', 0)),
            'utilization_percentage': float(request.query_params.get('utilization', 75)),
            'consecutive_work_days': int(request.query_params.get('consecutive_days', 5)),
            'reports_submitted': int(request.query_params.get('reports', 10)),
            'expected_reports': int(request.query_params.get('expected_reports', 22))
        }
        
        result = predict_burnout(features)
        logger.info(f"Burnout prediction completed for employee {employee_id}: {result['level']}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error predicting burnout for employee {employee_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Burnout prediction failed: {str(e)}")


@router.post("/batch")
async def get_batch_burnout_risks(employees: list) -> Dict[str, Any]:
    """
    Get burnout risk for multiple employees.
    
    Args:
        employees: List of employee feature dictionaries
    
    Returns:
        Dictionary mapping employee_id to burnout assessment
    """
    try:
        results = {}
        for emp_data in employees:
            emp_id = emp_data.get('employee_id')
            if emp_id:
                results[emp_id] = predict_burnout(emp_data)
        
        logger.info(f"Batch burnout prediction completed for {len(results)} employees")
        return {"results": results, "count": len(results)}
        
    except Exception as e:
        logger.error(f"Error in batch burnout prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")