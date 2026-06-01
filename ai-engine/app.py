from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

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

# Root endpoint - THIS WAS MISSING
@app.get("/")
def root():
    return {
        "message": "Productivity Prediction AI Service is running",
        "status": "healthy",
        "version": "1.0.0"
    }

# Health check endpoint
@app.get("/health")
def health():
    model_status = get_model_status()
    return {
        "status": "healthy", 
        "service": "ai-engine",
        "modelLoaded": model_status["model_loaded"]
    }

# Add these imports at the top of app.py (after existing imports)
from services.predictor import get_prediction
from utils.model_loader import get_model_status

# Then replace the prediction endpoint
@app.post("/predict-productivity", response_model=ProductivityResponse)
async def predict_productivity(request: ProductivityRequest):
    try:
        # Convert request to DataFrame
        import pandas as pd
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
        
        return ProductivityResponse(
            predicted_productivity_score=round(prediction_result['predicted_score'], 1),
            confidence_interval=[round(prediction_result['predicted_score'] - 5, 1), 
                                round(prediction_result['predicted_score'] + 5, 1)],
            contributing_factors=prediction_result['contributing_factors'],
            recommendations=recommendations[:3]
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")