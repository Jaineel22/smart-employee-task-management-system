from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import services and utilities
from services.predictor import get_prediction
from utils.model_loader import get_model_status

# Create FastAPI app
app = FastAPI(title="Productivity Prediction AI Engine", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class ProductivityRequest(BaseModel):
    employee_id: int
    month: int
    year: int
    total_tasks_assigned: int
    total_tasks_completed: int
    avg_completion_percentage: float
    on_time_completion_rate: float
    total_hours_worked: float
    expected_hours: float
    avg_task_progress: float

class ProductivityResponse(BaseModel):
    predicted_productivity_score: float
    confidence_interval: List[float]
    contributing_factors: Dict[str, float]
    recommendations: List[str]

# Root endpoint
@app.get("/")
def root():
    model_status = get_model_status()
    return {
        "message": "Productivity Prediction AI Service is running",
        "status": "healthy",
        "version": "1.0.0",
        "modelLoaded": model_status.get("productivity_model_loaded", False)
    }

# Health check endpoint
@app.get("/health")
def health():
    model_status = get_model_status()
    return {
        "status": "healthy", 
        "service": "ai-engine",
        "modelLoaded": model_status.get("productivity_model_loaded", False)
    }

# AI-4 Health check endpoint (new)
@app.get("/ai-health")
def ai_health():
    """Comprehensive health check for AI-4 modules"""
    return {
        "status": "healthy",
        "version": "4.0.0",
        "modules": ["productivity", "burnout"],
        "message": "AI-4 Burnout Detection module is ready"
    }

# Prediction endpoint
@app.post("/predict-productivity", response_model=ProductivityResponse)
async def predict_productivity(request: ProductivityRequest):
    try:
        logger.info(f"Received prediction request for employee {request.employee_id}")
        
        # Convert request to DataFrame
        input_data = pd.DataFrame([{
            'total_tasks_assigned': request.total_tasks_assigned,
            'total_tasks_completed': request.total_tasks_completed,
            'avg_completion_percentage': request.avg_completion_percentage,
            'on_time_completion_rate': request.on_time_completion_rate,
            'total_hours_worked': request.total_hours_worked,
            'expected_hours': request.expected_hours,
            'avg_task_progress': request.avg_task_progress,
            'month': request.month,
            'year': request.year
        }])
        
        # Get prediction from trained model
        prediction_result = get_prediction(input_data)
        
        # Generate recommendations
        recommendations = []
        if prediction_result['contributing_factors'].get('task_completion_rate', 0) < 70:
            recommendations.append("Focus on completing assigned tasks to improve productivity")
        if prediction_result['contributing_factors'].get('on_time_rate', 0) < 80:
            recommendations.append("Improve deadline management by planning ahead")
        if prediction_result['contributing_factors'].get('hours_utilization', 0) < 70:
            recommendations.append("Increase consistent work hours to meet expectations")
        if prediction_result['contributing_factors'].get('avg_progress', 0) < 60:
            recommendations.append("Break down tasks into smaller steps for better progress tracking")
        
        if not recommendations:
            recommendations = ["Great performance! Keep maintaining your productivity levels."]
        
        predicted_score = round(prediction_result['predicted_score'], 1)
        
        return ProductivityResponse(
            predicted_productivity_score=predicted_score,
            confidence_interval=[round(predicted_score - 5, 1), round(predicted_score + 5, 1)],
            contributing_factors=prediction_result['contributing_factors'],
            recommendations=recommendations[:3]
        )
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# ── AI-4 Routes (Burnout Detection) ──────────────────────────────────────

# Import and include burnout routes
try:
    from routes import burnout_routes
    # Register with both prefixes for flexibility
    app.include_router(burnout_routes.router, prefix="/api/v1")
    app.include_router(burnout_routes.router)  # Also register without prefix
    logger.info("✅ Burnout routes registered successfully")
    logger.info("   Available endpoints:")
    logger.info("   - GET /burnout/{employee_id}")
    logger.info("   - POST /burnout/")
    logger.info("   - GET /api/v1/burnout/{employee_id}")
    logger.info("   - POST /api/v1/burnout/")
except ImportError as e:
    logger.warning(f"Could not import burnout routes: {e}")
except Exception as e:
    logger.error(f"Error registering burnout routes: {e}")

# ── Test endpoint to verify burnout module is working ─────────────────────
@app.get("/test-burnout")
async def test_burnout():
    """Test endpoint to verify burnout module is loaded"""
    try:
        from services.burnout_predictor import BurnoutPredictor
        predictor = BurnoutPredictor()
        test_result = predictor.predict({"employeeId": 1})
        return {
            "status": "burnout_module_loaded",
            "test_result": test_result
        }
    except ImportError as e:
        return {"status": "error", "message": f"Import error: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)