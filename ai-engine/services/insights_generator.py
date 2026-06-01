from typing import Dict, Any


def generate_insights(prediction: float, confidence: float) -> Dict[str, Any]:
    """Create simple human-readable insights based on prediction score."""
    label = "low" if prediction < 0.5 else "high"
    return {
        "label": label,
        "summary": f"Predicted score is {prediction:.3f}",
        "confidence": float(confidence),
    }
