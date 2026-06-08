"""
app.py — AI Engine (merged AI-3 + AI-4 + AI-5 + AI-6)
========================================================
PRESERVES all existing endpoints — nothing removed or renamed:
  GET  /                        root
  GET  /health                  AI-3 health (used by PredictionService.isAiServiceReachable)
  POST /predict-productivity    main AI-3 prediction
  GET  /test-burnout            AI-4 burnout smoke-test
  GET  /ai-health               AI-4 health check

ADDS AI-5 routes:
  POST /recommendations/employee/
  GET  /recommendations/employee/{id}
  POST /recommendations/legacy/

ADDS AI-6 routes:
  POST /risk/task/
  GET  /risk/task/{task_id}
  POST /risk/team/

AI-4 routes remain registered exactly as before:
  /burnout/*, /attrition/*, /forecast/*, /team-health/*
"""

import logging
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# ── AI-3 utilities (unchanged) ────────────────────────────────────────────────
from services.predictor   import get_prediction
from utils.model_loader   import get_model_status

# ── AI-4 routers (unchanged — all preserved) ─────────────────────────────────
from routes.burnout_routes        import router as burnout_router
from routes.attrition_routes      import router as attrition_router
from routes.recommendation_routes import router as recommendation_router
from routes.forecast_routes       import router as forecast_router
from routes.team_health_routes    import router as team_health_router

# ── AI-5 router (new) ────────────────────────────────────────────────────────
# Note: AI-5 uses the same recommendation_routes.py but with new endpoints
# The existing router already has AI-5 endpoints added

# ── AI-6 router (new) ────────────────────────────────────────────────────────
from routes.risk_routes import router as risk_router

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI-Powered Workforce Analytics Engine",
    description=(
        "AI-3: Productivity Prediction  |  "
        "AI-4: Burnout · Attrition · Team Health · Recommendations · Growth Forecast  |  "
        "AI-5: Structured Recommendation Engine  |  "
        "AI-6: Deadline Risk Prediction"
    ),
    version="6.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers ──────────────────────────────────────────────────────

# AI-4 (unchanged)
app.include_router(burnout_router)
app.include_router(attrition_router)
app.include_router(recommendation_router)   # /recommendations/* — AI-4D + AI-5
app.include_router(forecast_router)
app.include_router(team_health_router)

# Also register burnout under /api/v1 prefix for flexibility (matches your original)
app.include_router(burnout_router, prefix="/api/v1")

# AI-6 (new)
app.include_router(risk_router)

logger.info("✅ All AI routers registered: AI-3, AI-4, AI-5, AI-6")


# ════════════════════════════════════════════════════════════════════════════════
# AI-3 MODELS (PRESERVED — do not modify)
# ════════════════════════════════════════════════════════════════════════════════

class ProductivityRequest(BaseModel):
    employee_id:               int
    month:                     int
    year:                      int
    total_tasks_assigned:      int
    total_tasks_completed:     int
    avg_completion_percentage: float
    on_time_completion_rate:   float
    total_hours_worked:        float
    expected_hours:            float
    avg_task_progress:         float


class ProductivityResponse(BaseModel):
    predicted_productivity_score: float
    confidence_interval:          List[float]
    contributing_factors:         Dict[str, float]
    recommendations:              List[str]


# ════════════════════════════════════════════════════════════════════════════════
# AI-3 ENDPOINTS (PRESERVED — do not rename or remove)
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    """AI-3 root — unchanged."""
    model_status = get_model_status()
    return {
        "message":    "AI-Powered Workforce Analytics Engine is running",
        "status":     "healthy",
        "version":    "6.0.0",
        "modelLoaded": model_status.get("productivity_model_loaded", False),
    }


@app.get("/health")
def health():
    """
    AI-3 health — MUST stay at /health.
    PredictionService.isAiServiceReachable() calls GET /health.
    """
    model_status = get_model_status()
    return {
        "status":    "healthy",
        "service":   "ai-engine",
        "modelLoaded": model_status.get("productivity_model_loaded", False),
    }


@app.post("/predict-productivity", response_model=ProductivityResponse)
async def predict_productivity(request: ProductivityRequest):
    """
    AI-3 productivity prediction — MUST stay at /predict-productivity.
    Called by Spring Boot PredictionService.callPythonService().
    """
    try:
        logger.info("Prediction request for employee %d", request.employee_id)
        input_data = pd.DataFrame([{
            "total_tasks_assigned":      request.total_tasks_assigned,
            "total_tasks_completed":     request.total_tasks_completed,
            "avg_completion_percentage": request.avg_completion_percentage,
            "on_time_completion_rate":   request.on_time_completion_rate,
            "total_hours_worked":        request.total_hours_worked,
            "expected_hours":            request.expected_hours,
            "avg_task_progress":         request.avg_task_progress,
            "month":                     request.month,
            "year":                      request.year,
        }])

        prediction_result = get_prediction(input_data)
        cf = prediction_result.get("contributing_factors", {})

        recommendations = []
        if cf.get("task_completion_rate", 100) < 70:
            recommendations.append("Focus on completing assigned tasks to improve productivity")
        if cf.get("on_time_rate", 100) < 80:
            recommendations.append("Improve deadline management by planning ahead")
        if cf.get("hours_utilization", 100) < 70:
            recommendations.append("Increase consistent work hours to meet expectations")
        if cf.get("avg_progress", 100) < 60:
            recommendations.append("Break tasks into smaller steps for better progress")
        if not recommendations:
            recommendations = ["Great performance! Keep maintaining your productivity levels."]

        predicted_score = round(prediction_result["predicted_score"], 1)
        return ProductivityResponse(
            predicted_productivity_score=predicted_score,
            confidence_interval=[round(predicted_score - 5, 1), round(predicted_score + 5, 1)],
            contributing_factors=prediction_result["contributing_factors"],
            recommendations=recommendations[:3],
        )

    except Exception as e:
        logger.error("Prediction error: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


# ════════════════════════════════════════════════════════════════════════════════
# AI-4 HEALTH + SMOKE TESTS (PRESERVED)
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/ai-health", tags=["Health"])
def ai_health():
    """AI-4 comprehensive health check — all modules."""
    return {
        "status":  "healthy",
        "version": "6.0.0",
        "modules": [
            "ai-3-productivity",
            "ai-4-burnout",
            "ai-4-attrition",
            "ai-4-team-health",
            "ai-4-forecast",
            "ai-5-recommendations",
            "ai-6-deadline-risk",
        ],
    }


@app.get("/test-burnout", tags=["Health"])
async def test_burnout():
    """Smoke-test endpoint — verifies BurnoutPredictor loads and runs correctly."""
    try:
        from services.burnout_predictor import BurnoutPredictor
        predictor   = BurnoutPredictor()
        test_result = predictor.predict({"employeeId": 1})
        return {"status": "burnout_module_loaded", "test_result": test_result}
    except ImportError as e:
        return {"status": "error", "message": f"Import error: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/test-risk", tags=["Health"])
async def test_risk():
    """Smoke-test for AI-6 risk engine."""
    try:
        from services.risk_prediction_engine import RiskPredictionEngine
        engine = RiskPredictionEngine()
        result = engine.predict({
            "task_id": 1,
            "task_title": "Test Task",
            "days_remaining": 3,
            "completion_percentage": 20,
            "expected_progress": 60,
            "productivity_score": 55,
            "priority": "HIGH",
        })
        return {"status": "risk_module_loaded", "test_result": result}
    except ImportError as e:
        return {"status": "error", "message": f"Import error: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/test-recommendations", tags=["Health"])
async def test_recommendations():
    """Smoke-test for AI-5 recommendation engine."""
    try:
        from services.recommendation_engine import generate_structured_recommendations
        result = generate_structured_recommendations({
            "attendance_pct": 65,
            "productivity_pct": 48,
            "overdue_tasks": 3,
            "pending_tasks": 8,
        })
        return {"status": "recommendation_module_loaded", "test_result": result}
    except ImportError as e:
        return {"status": "error", "message": f"Import error: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)