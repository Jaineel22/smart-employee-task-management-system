import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import joblib
import os

print("📊 Loading dataset...")
df = pd.read_csv('data/synthetic_employee_data.csv')

print(f"   Loaded {len(df)} rows, {len(df.columns)} columns")

# Define features and target
feature_columns = [
    'total_tasks_assigned',
    'total_tasks_completed',
    'avg_completion_percentage',
    'on_time_completion_rate',
    'total_hours_worked',
    'expected_hours',
    'avg_task_progress'
]

# Also include month and year as cyclical features (optional)
df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)

feature_columns.extend(['month_sin', 'month_cos', 'year'])

X = df[feature_columns]
y = df['productivity_score']

print(f"\n📊 Features: {len(feature_columns)} columns")
print(f"   Target: productivity_score")

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print(f"\n📊 Train size: {len(X_train)}, Test size: {len(X_test)}")

# Scale features
print("\n🔄 Scaling features...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train model
print("\n🤖 Training RandomForest model...")
model = RandomForestRegressor(
    n_estimators=100,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train_scaled, y_train)

# Evaluate
print("\n📊 Model Evaluation:")
y_pred = model.predict(X_test_scaled)

r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

print(f"   R² Score: {r2:.4f}")
print(f"   MAE: {mae:.2f} points")
print(f"   RMSE: {rmse:.2f} points")
print(f"   Accuracy within ±5%: {(np.abs(y_pred - y_test) <= 5).mean() * 100:.1f}%")

# Save model and scaler
print("\n💾 Saving model and scaler...")
joblib.dump(model, 'model.pkl')
joblib.dump(scaler, 'scaler.pkl')
print("   ✅ model.pkl saved")
print("   ✅ scaler.pkl saved")

# Feature importance
feature_importance = pd.DataFrame({
    'feature': feature_columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print("\n📊 Top 5 Most Important Features:")
for i, row in feature_importance.head(5).iterrows():
    print(f"   {row['feature']}: {row['importance']:.3f}")

print("\n✅ Training complete!")