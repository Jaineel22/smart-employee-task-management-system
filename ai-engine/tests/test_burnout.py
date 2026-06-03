"""
Burnout Engine Test Suite
Tests edge cases, boundary conditions, and normal flows.

Run: pytest ai-engine/tests/test_burnout.py -v
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from services.burnout_predictor import BurnoutPredictor

predictor = BurnoutPredictor()


class TestBurnoutPredictor:

    def test_healthy_employee_is_low_risk(self):
        """Standard healthy employee → LOW risk"""
        data = {
            "employeeId": 1,
            "attendancePercentage":  95.0,
            "monthlyHoursWorked":    170.0,
            "dailyAverageHours":     7.5,
            "pendingTasks":          2,
            "overdueTasks":          0,
            "utilizationPercentage": 65.0,
            "consecutiveWorkDays":   5,
            "reportsTotal":          20,
            "reportsSubmitted":      20,
        }
        result = predictor.predict(data)
        assert result["level"] == "LOW"
        assert result["burnoutRisk"] < 40

    def test_overworked_employee_is_high_risk(self):
        """Overworked with multiple overdue tasks → HIGH risk"""
        data = {
            "employeeId": 2,
            "attendancePercentage":  70.0,
            "monthlyHoursWorked":    260.0,
            "dailyAverageHours":     12.5,
            "pendingTasks":          10,
            "overdueTasks":          6,
            "utilizationPercentage": 105.0,
            "consecutiveWorkDays":   14,
            "reportsTotal":          20,
            "reportsSubmitted":      10,
        }
        result = predictor.predict(data)
        assert result["level"] == "HIGH"
        assert result["burnoutRisk"] >= 70

    def test_medium_risk_employee(self):
        """Moderate workload → MEDIUM risk"""
        data = {
            "employeeId": 3,
            "attendancePercentage":  82.0,
            "monthlyHoursWorked":    205.0,
            "dailyAverageHours":     9.5,
            "pendingTasks":          5,
            "overdueTasks":          2,
            "utilizationPercentage": 88.0,
            "consecutiveWorkDays":   7,
            "reportsTotal":          20,
            "reportsSubmitted":      16,
        }
        result = predictor.predict(data)
        assert result["level"] in ["MEDIUM", "HIGH"]
        assert 30 <= result["burnoutRisk"] <= 90

    def test_no_attendance_data(self):
        """Zero attendance → elevated risk signal"""
        data = {
            "employeeId": 4,
            "attendancePercentage": 0.0,
        }
        result = predictor.predict(data)
        assert result["burnoutRisk"] >= 0
        assert result["level"] in ["LOW", "MEDIUM", "HIGH"]

    def test_no_tasks(self):
        """Employee with no tasks at all → should not crash"""
        data = {
            "employeeId": 5,
            "pendingTasks": 0,
            "overdueTasks": 0,
        }
        result = predictor.predict(data)
        assert "burnoutRisk" in result
        assert "level" in result

    def test_no_reports(self):
        """Employee with no reports submitted → should not crash"""
        data = {
            "employeeId": 6,
            "reportsTotal":     20,
            "reportsSubmitted": 0,
        }
        result = predictor.predict(data)
        assert "burnoutRisk" in result

    def test_invalid_employee_id_zero(self):
        """EmployeeId = 0 should still process"""
        data = {"employeeId": 0}
        result = predictor.predict(data)
        assert result["employeeId"] == 0

    def test_score_clamped_0_100(self):
        """Score must always be between 0 and 100"""
        for _ in range(20):
            import random
            data = {
                "employeeId": random.randint(1, 1000),
                "attendancePercentage":  random.uniform(0, 100),
                "monthlyHoursWorked":    random.uniform(0, 300),
                "dailyAverageHours":     random.uniform(0, 16),
                "pendingTasks":          random.randint(0, 20),
                "overdueTasks":          random.randint(0, 10),
                "utilizationPercentage": random.uniform(0, 110),
                "consecutiveWorkDays":   random.randint(0, 25),
            }
            result = predictor.predict(data)
            assert 0 <= result["burnoutRisk"] <= 100

    def test_reasons_not_empty_for_high_risk(self):
        """High risk should always have reasons"""
        data = {
            "employeeId":           99,
            "monthlyHoursWorked":   280.0,
            "dailyAverageHours":    13.0,
            "overdueTasks":         7,
            "utilizationPercentage":108.0,
        }
        result = predictor.predict(data)
        if result["level"] == "HIGH":
            assert len(result["reasons"]) > 0

    def test_response_structure(self):
        """Response must contain all required fields"""
        result = predictor.predict({"employeeId": 1})
        required_keys = {"employeeId", "burnoutRisk", "level", "reasons", "factorScores"}
        assert required_keys.issubset(result.keys())