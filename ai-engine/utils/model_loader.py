"""
model_loader.py
===============
Singleton model loader for all AI models.
Supports productivity, burnout, and attrition models.
"""

import joblib
import os
from typing import Any, Optional, Dict
import logging

logger = logging.getLogger(__name__)

# Global model cache
_models: Dict[str, Any] = {}
_scalers: Dict[str, Any] = {}


def load_model(model_name: str, model_path: Optional[str] = None) -> Any:
    """
    Load a model by name.
    
    Args:
        model_name: Name of the model ('productivity', 'burnout', 'attrition')
        model_path: Optional custom path, defaults to models/{model_name}_model.pkl
    
    Returns:
        Loaded model or None if not found
    """
    global _models
    
    # Return cached model if available
    if model_name in _models and _models[model_name] is not None:
        return _models[model_name]
    
    # Determine model path
    if model_path is None:
        base_dir = os.path.dirname(os.path.dirname(__file__))
        model_path = os.path.join(base_dir, 'models', f'{model_name}_model.pkl')
    
    # Load model
    if os.path.exists(model_path):
        try:
            _models[model_name] = joblib.load(model_path)
            logger.info(f"✅ Loaded {model_name} model from {model_path}")
            return _models[model_name]
        except Exception as e:
            logger.error(f"❌ Error loading {model_name} model: {e}")
            return None
    else:
        logger.warning(f"⚠️ Model file not found: {model_path}")
        return None


def load_scaler(scaler_name: str, scaler_path: Optional[str] = None) -> Any:
    """
    Load a scaler by name.
    
    Args:
        scaler_name: Name of the scaler
        scaler_path: Optional custom path
    
    Returns:
        Loaded scaler or None if not found
    """
    global _scalers
    
    if scaler_name in _scalers and _scalers[scaler_name] is not None:
        return _scalers[scaler_name]
    
    if scaler_path is None:
        base_dir = os.path.dirname(os.path.dirname(__file__))
        scaler_path = os.path.join(base_dir, 'models', f'{scaler_name}_scaler.pkl')
    
    if os.path.exists(scaler_path):
        try:
            _scalers[scaler_name] = joblib.load(scaler_path)
            logger.info(f"✅ Loaded {scaler_name} scaler from {scaler_path}")
            return _scalers[scaler_name]
        except Exception as e:
            logger.error(f"❌ Error loading {scaler_name} scaler: {e}")
            return None
    else:
        logger.warning(f"⚠️ Scaler file not found: {scaler_path}")
        return None


def get_model(model_name: str) -> Optional[Any]:
    """Get loaded model, loading if necessary"""
    return load_model(model_name)


def get_scaler(scaler_name: str) -> Optional[Any]:
    """Get loaded scaler, loading if necessary"""
    return load_scaler(scaler_name)


def get_model_status() -> Dict[str, bool]:
    """Get status of all models"""
    return {
        'productivity_model_loaded': _models.get('productivity') is not None,
        'burnout_model_loaded': _models.get('burnout') is not None,
        'attrition_model_loaded': _models.get('attrition') is not None
    }


# For backward compatibility with existing code
def get_productivity_model():
    return get_model('productivity')


def get_productivity_scaler():
    return get_scaler('productivity')