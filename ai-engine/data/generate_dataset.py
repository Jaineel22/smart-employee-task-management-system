import pandas as pd
import numpy as np
from datetime import datetime, timedelta

np.random.seed(42)

# Number of records
n_records = 4000

# Generate employee IDs (1-50 employees, each with multiple months)
employee_ids = np.random.randint(1, 51, n_records)

# Generate dates (last 24 months)
start_date = datetime(2024, 1, 1)
end_date = datetime(2025, 12, 31)
date_range = (end_date - start_date).days
random_days = np.random.randint(0, date_range, n_records)

# Fix: Convert numpy.int32 to regular int for timedelta
dates = [start_date + timedelta(days=int(d)) for d in random_days]

# Extract month and year
months = [d.month for d in dates]
years = [d.year for d in dates]

# Generate features with realistic correlations
total_tasks_assigned = np.random.randint(5, 30, n_records)

# Task completion rate (correlated with productivity)
completion_rate = np.random.beta(2, 2, n_records) * 0.8 + 0.2
total_tasks_completed = (total_tasks_assigned * completion_rate).astype(int)

# Average completion percentage (correlated with completion rate)
avg_completion_percentage = completion_rate * 100 + np.random.normal(0, 5, n_records)
avg_completion_percentage = np.clip(avg_completion_percentage, 0, 100)

# On-time completion rate
on_time_completion_rate = completion_rate * 100 + np.random.normal(0, 8, n_records)
on_time_completion_rate = np.clip(on_time_completion_rate, 0, 100)

# Hours worked (40-200 hours per month, correlated with completion)
total_hours_worked = 80 + (completion_rate * 80) + np.random.normal(0, 15, n_records)
total_hours_worked = np.clip(total_hours_worked, 30, 200)

# Expected hours (standard 176 for full-time)
expected_hours = np.full(n_records, 176.0)

# Average task progress
avg_task_progress = avg_completion_percentage + np.random.normal(0, 5, n_records)
avg_task_progress = np.clip(avg_task_progress, 0, 100)

# Calculate productivity score (target variable)
productivity_score = (
    (completion_rate * 100) * 0.35 +
    on_time_completion_rate * 0.25 +
    avg_completion_percentage * 0.20 +
    (total_hours_worked / expected_hours * 100) * 0.20
) + np.random.normal(0, 3, n_records)
productivity_score = np.clip(productivity_score, 0, 100)

# Performance status based on score
performance_status = []
for score in productivity_score:
    if score >= 90:
        performance_status.append('Outstanding')
    elif score >= 75:
        performance_status.append('Excellent')
    elif score >= 60:
        performance_status.append('Good')
    elif score >= 40:
        performance_status.append('Needs Improvement')
    else:
        performance_status.append('Low Productivity')

# Create DataFrame
df = pd.DataFrame({
    'employee_id': employee_ids,
    'month': months,
    'year': years,
    'total_tasks_assigned': total_tasks_assigned,
    'total_tasks_completed': total_tasks_completed,
    'avg_completion_percentage': avg_completion_percentage.round(2),
    'on_time_completion_rate': on_time_completion_rate.round(2),
    'total_hours_worked': total_hours_worked.round(1),
    'expected_hours': expected_hours,
    'avg_task_progress': avg_task_progress.round(2),
    'productivity_score': productivity_score.round(1),
    'performance_status': performance_status
})

# Save to CSV
df.to_csv('data/synthetic_employee_data.csv', index=False)
print(f"✅ Generated {len(df)} rows of synthetic data")
print(f"✅ Saved to data/synthetic_employee_data.csv")
print(f"\n📊 Data Statistics:")
print(f"   - Productivity Score Range: {df['productivity_score'].min():.1f} - {df['productivity_score'].max():.1f}")
print(f"   - Average Score: {df['productivity_score'].mean():.1f}")
print(f"   - Outstanding: {(df['performance_status'] == 'Outstanding').sum()}")
print(f"   - Excellent: {(df['performance_status'] == 'Excellent').sum()}")
print(f"   - Good: {(df['performance_status'] == 'Good').sum()}")
print(f"   - Needs Improvement: {(df['performance_status'] == 'Needs Improvement').sum()}")
print(f"   - Low Productivity: {(df['performance_status'] == 'Low Productivity').sum()}")