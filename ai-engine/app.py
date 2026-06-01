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
    return {"status": "healthy", "service": "ai-engine"}

# Prediction endpoint
@app.post("/predict-productivity", response_model=ProductivityResponse)
async def predict_productivity(request: ProductivityRequest):
    # Simple prediction logic (stub)
    # Will be replaced with actual ML model later
    
    # Calculate a basic productivity score
    completion_rate = (request.total_tasks_completed / max(1, request.total_tasks_assigned)) * 100
    hours_rate = (request.total_hours_worked / max(1, request.expected_hours)) * 100
    
    predicted_score = (
        completion_rate * 0.4 +
        request.on_time_completion_rate * 0.3 +
        request.avg_task_progress * 0.2 +
        min(hours_rate, 100) * 0.1
    )
    predicted_score = round(min(100, max(0, predicted_score)), 1)
    
    return ProductivityResponse(
        predicted_productivity_score=predicted_score,
        confidence_interval=[predicted_score - 5, predicted_score + 5],
        contributing_factors={
            "task_completion_rate": completion_rate,
            "on_time_rate": request.on_time_completion_rate,
            "avg_progress": request.avg_task_progress,
            "hours_utilization": hours_rate
        },
        recommendations=[
            "Complete pending tasks to improve score",
            "Maintain consistent work hours",
            "Focus on deadline management"
        ]
    )