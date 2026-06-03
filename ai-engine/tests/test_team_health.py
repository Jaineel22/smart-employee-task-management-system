"""
Team Health Engine Test Suite
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from services.team_health_engine import TeamHealthEngine

engine = TeamHealthEngine()


class TestTeamHealthEngine:

    def _make_employee(self, **kwargs):
        defaults = {
            "employeeId":           1,
            "name":                 "Test Employee",
            "attendancePercentage": 90.0,
            "productivityScore":    80.0,
            "utilizationPercentage":70.0,
            "completionRate":       85.0,
            "burnoutRisk":          20.0,
            "attritionRisk":        15.0,
        }
        defaults.update(kwargs)
        return defaults

    def test_empty_team_returns_zero_health(self):
        result = engine.compute({"managerId": 1, "employees": []})
        assert result["teamHealth"] == 0
        assert result["teamSize"]   == 0

    def test_excellent_team(self):
        employees = [
            self._make_employee(
                employeeId=i,
                attendancePercentage=96.0,
                productivityScore=92.0,
                completionRate=94.0,
                burnoutRisk=10.0,
            )
            for i in range(1, 6)
        ]
        result = engine.compute({"managerId": 1, "employees": employees})
        assert result["teamHealth"] >= 80
        assert result["category"] in ["Excellent", "Good"]

    def test_poor_team_needs_attention(self):
        employees = [
            self._make_employee(
                employeeId=i,
                attendancePercentage=55.0,
                productivityScore=45.0,
                completionRate=50.0,
                burnoutRisk=80.0,
            )
            for i in range(1, 4)
        ]
        result = engine.compute({"managerId": 2, "employees": employees})
        assert result["teamHealth"] < 75
        assert result["category"] in ["Average", "Needs Attention"]

    def test_high_risk_count(self):
        employees = [
            self._make_employee(employeeId=1, burnoutRisk=75.0),
            self._make_employee(employeeId=2, burnoutRisk=80.0),
            self._make_employee(employeeId=3, burnoutRisk=15.0),
        ]
        result = engine.compute({"managerId": 3, "employees": employees})
        assert result["highRiskCount"] >= 2

    def test_score_clamped(self):
        employees = [self._make_employee(employeeId=i) for i in range(1, 11)]
        result = engine.compute({"managerId": 4, "employees": employees})
        assert 0 <= result["teamHealth"] <= 100
        assert 0 <= result["attendanceScore"]   <= 100
        assert 0 <= result["productivityScore"] <= 100

    def test_top_performers_identified(self):
        employees = [
            self._make_employee(employeeId=1, productivityScore=95.0),
            self._make_employee(employeeId=2, productivityScore=40.0),
            self._make_employee(employeeId=3, productivityScore=75.0),
        ]
        result = engine.compute({"managerId": 5, "employees": employees})
        assert result["topPerformers"][0]["productivityScore"] == 95

    def test_insights_generated(self):
        employees = [self._make_employee(employeeId=i) for i in range(1, 4)]
        result = engine.compute({"managerId": 6, "employees": employees})
        assert len(result["insights"]) > 0

    def test_missing_ai_service_fallback(self):
        """TeamHealthEngine is pure Python — never crashes"""
        result = engine.compute({"managerId": 99, "employees": []})
        assert "teamHealth" in result
        assert "category" in result