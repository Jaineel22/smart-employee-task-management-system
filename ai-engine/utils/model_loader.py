import joblib
import os
from typing import Any, Optional

_model = None
_scaler = None

def load_model(path: Optional[str] = None) -> Any:
    """Load the trained model and scaler"""
    global _model, _scaler
    
    model_path = path or 'model.pkl'
    scaler_path = 'scaler.pkl'
    
    if os.path.exists(model_path) and os.path.exists(scaler_path):
        try:
            _model = joblib.load(model_path)
            _scaler = joblib.load(scaler_path)
            print("✅ Model and scaler loaded successfully")
            return _model
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return None
    else:
        print(f"⚠️ Model files not found: {model_path} or {scaler_path}")
        return None

def get_model():
    """Get loaded model"""
    global _model
    if _model is None:
        load_model()
    return _model

def get_scaler():
    """Get loaded scaler"""
    global _scaler
    if _scaler is None:
        load_model()
    return _scaler

def get_model_status():
    """Get model loading status"""
    global _model, _scaler
    return {
        'model_loaded': _model is not None,
        'scaler_loaded': _scaler is not None
    }

# Try to load model on module import
load_model()