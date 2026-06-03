import pandas as pd
import numpy as np
import joblib
import os
from utils.model_loader import get_model, get_scaler

def predict(features):
    """Get productivity prediction from trained model"""
    return get_prediction(features)

def get_prediction(input_data):
    """
    Get productivity prediction from trained model
    
    Args:
        input_data: DataFrame with features
    
    Returns:
        dict with prediction and contributing factors
    """
    # Load model and scaler with the correct model name 'productivity'
    model = get_model('productivity')  # ✅ FIXED: Added 'productivity'
    scaler = get_scaler('productivity')  # ✅ FIXED: Added 'productivity'
    
    if model is None or scaler is None:
        # Fallback to rule-based prediction if model not loaded
        print("⚠️ Model not loaded, using fallback prediction")
        return fallback_prediction(input_data)
    
    # Calculate derived features
    input_data['month_sin'] = np.sin(2 * np.pi * input_data['month'] / 12)
    input_data['month_cos'] = np.cos(2 * np.pi * input_data['month'] / 12)
    
    # Select features in the same order as training
    feature_columns = [
        'total_tasks_assigned',
        'total_tasks_completed',
        'avg_completion_percentage',
        'on_time_completion_rate',
        'total_hours_worked',
        'expected_hours',
        'avg_task_progress',
        'month_sin',
        'month_cos',
        'year'
    ]
    
    # Ensure all required columns exist
    for col in feature_columns:
        if col not in input_data.columns:
            input_data[col] = 0
    
    X = input_data[feature_columns]
    
    # Scale features
    X_scaled = scaler.transform(X)
    
    # Get prediction
    predicted_score = model.predict(X_scaled)[0]
    predicted_score = max(0, min(100, predicted_score))  # Clip to 0-100 range
    
    # Calculate contributing factors
    completion_rate = (input_data['total_tasks_completed'].iloc[0] / max(1, input_data['total_tasks_assigned'].iloc[0])) * 100
    hours_rate = (input_data['total_hours_worked'].iloc[0] / max(1, input_data['expected_hours'].iloc[0])) * 100
    
    return {
        'predicted_score': predicted_score,
        'contributing_factors': {
            'task_completion_rate': float(completion_rate),
            'on_time_rate': float(input_data['on_time_completion_rate'].iloc[0]),
            'avg_progress': float(input_data['avg_task_progress'].iloc[0]),
            'hours_utilization': float(min(hours_rate, 100))
        }
    }

def fallback_prediction(input_data):
    """Fallback rule-based prediction when model is not available"""
    completion_rate = (input_data['total_tasks_completed'].iloc[0] / max(1, input_data['total_tasks_assigned'].iloc[0])) * 100
    hours_rate = (input_data['total_hours_worked'].iloc[0] / max(1, input_data['expected_hours'].iloc[0])) * 100
    
    predicted_score = (
        completion_rate * 0.4 +
        input_data['on_time_completion_rate'].iloc[0] * 0.3 +
        input_data['avg_task_progress'].iloc[0] * 0.2 +
        min(hours_rate, 100) * 0.1
    )
    predicted_score = max(0, min(100, predicted_score))
    
    return {
        'predicted_score': predicted_score,
        'contributing_factors': {
            'task_completion_rate': float(completion_rate),
            'on_time_rate': float(input_data['on_time_completion_rate'].iloc[0]),
            'avg_progress': float(input_data['avg_task_progress'].iloc[0]),
            'hours_utilization': float(min(hours_rate, 100))
        }
    }