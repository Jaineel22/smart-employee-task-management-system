"""
Attrition Model Training Script
Trains a Random Forest classifier on synthetic trend-based attrition data.
"""

import os
import pickle
import logging
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import StandardScaler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_PATH  = os.path.join(MODELS_DIR, "attrition_model.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "attrition_scaler.pkl")


def generate_attrition_data(n_samples: int = 2000) -> pd.DataFrame:
    np.random.seed(99)

    df = pd.DataFrame({
        "attendance_trend":   np.random.uniform(-30.0, 10.0, n_samples),
        "productivity_trend": np.random.uniform(-35.0, 15.0, n_samples),
        "utilization_trend":  np.random.uniform(-30.0, 10.0, n_samples),
        "completion_trend":   np.random.uniform(-30.0, 10.0, n_samples),
        "report_consistency": np.random.uniform(0.2, 1.0, n_samples),
    })

    def label(row):
        risk = 0
        if row["attendance_trend"] < -15:
            risk += 25
        elif row["attendance_trend"] < -8:
            risk += 12
        if row["productivity_trend"] < -20:
            risk += 25
        elif row["productivity_trend"] < -10:
            risk += 12
        if row["utilization_trend"] < -18:
            risk += 20
        elif row["utilization_trend"] < -9:
            risk += 10
        if row["completion_trend"] < -20:
            risk += 18
        elif row["completion_trend"] < -10:
            risk += 9
        if row["report_consistency"] < 0.5:
            risk += 12
        elif row["report_consistency"] < 0.7:
            risk += 6
        return 2 if risk >= 55 else (1 if risk >= 30 else 0)

    df["attrition_label"] = df.apply(label, axis=1)
    logger.info(f"Label distribution:\n{df['attrition_label'].value_counts()}")
    return df


def train():
    df = generate_attrition_data()
    feature_cols = [
        "attendance_trend", "productivity_trend", "utilization_trend",
        "completion_trend", "report_consistency",
    ]
    X = df[feature_cols].values
    y = df["attrition_label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    model = GradientBoostingClassifier(
        n_estimators=150,
        learning_rate=0.1,
        max_depth=5,
        random_state=42,
    )
    model.fit(X_train_s, y_train)

    y_pred = model.predict(X_test_s)
    logger.info(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    logger.info(f"\n{classification_report(y_test, y_pred, target_names=['LOW','MEDIUM','HIGH'])}")

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(SCALER_PATH, "wb") as f:
        pickle.dump(scaler, f)

    logger.info(f"✅ Attrition model saved to {MODEL_PATH}")


if __name__ == "__main__":
    train()