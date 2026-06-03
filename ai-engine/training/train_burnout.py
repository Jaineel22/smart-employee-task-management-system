"""
Burnout Model Training Script
Generates synthetic training data and trains a Random Forest classifier.
Saves model to models/burnout_model.pkl
"""

import os
import pickle
import logging
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import StandardScaler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_PATH  = os.path.join(MODELS_DIR, "burnout_model.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "burnout_scaler.pkl")


def generate_burnout_data(n_samples: int = 2000) -> pd.DataFrame:
    """Generate synthetic employee burnout dataset."""
    np.random.seed(42)

    data = {
        "daily_avg_hours":      np.random.uniform(6.0, 14.0, n_samples),
        "monthly_hours":        np.random.uniform(120.0, 280.0, n_samples),
        "attendance_pct":       np.random.uniform(60.0, 100.0, n_samples),
        "pending_tasks":        np.random.randint(0, 15, n_samples),
        "overdue_tasks":        np.random.randint(0, 8, n_samples),
        "utilization_pct":      np.random.uniform(40.0, 110.0, n_samples),
        "consecutive_days":     np.random.randint(1, 20, n_samples),
        "reports_submitted_pct":np.random.uniform(0.3, 1.0, n_samples),
    }

    df = pd.DataFrame(data)

    # Deterministic label generation based on domain logic
    def label_burnout(row):
        score = 0
        if row["daily_avg_hours"] > 10:
            score += 30
        elif row["daily_avg_hours"] > 9:
            score += 15
        if row["monthly_hours"] > 220:
            score += 25
        elif row["monthly_hours"] > 200:
            score += 12
        if row["overdue_tasks"] > 3:
            score += 20
        elif row["overdue_tasks"] > 1:
            score += 10
        if row["pending_tasks"] > 6:
            score += 15
        elif row["pending_tasks"] > 3:
            score += 7
        if row["utilization_pct"] > 95:
            score += 10
        if row["consecutive_days"] > 10:
            score += 10
        if row["attendance_pct"] < 75:
            score += 5
        return 2 if score >= 55 else (1 if score >= 30 else 0)  # HIGH/MEDIUM/LOW

    df["burnout_label"] = df.apply(label_burnout, axis=1)
    logger.info(f"Label distribution:\n{df['burnout_label'].value_counts()}")
    return df


def train():
    df = generate_burnout_data()

    feature_cols = [
        "daily_avg_hours", "monthly_hours", "attendance_pct",
        "pending_tasks", "overdue_tasks", "utilization_pct",
        "consecutive_days", "reports_submitted_pct",
    ]
    X = df[feature_cols].values
    y = df["burnout_label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=8,
        min_samples_split=4,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    logger.info(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    logger.info(f"\n{classification_report(y_test, y_pred, target_names=['LOW','MEDIUM','HIGH'])}")

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(SCALER_PATH, "wb") as f:
        pickle.dump(scaler, f)

    logger.info(f"✅ Burnout model saved to {MODEL_PATH}")
    logger.info(f"✅ Burnout scaler saved to {SCALER_PATH}")


if __name__ == "__main__":
    train()