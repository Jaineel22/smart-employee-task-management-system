"""
Attrition Engine Test Suite
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from services.attrition_predictor import AttritionPredictor

predictor = AttritionPredictor()


class TestAttritionPredictor:

    def test_stable_employee_is_low_risk(self):
        data = {
            "employeeId":        1,
            "attendanceTrend":   2.0,
            "productivityTrend": 3.0,
            "utilizationTrend":  1.0,
            "completionTrend":   2.0,
            "reportConsistency": 0.95,
        }
        result = predictor.predict(data)
        assert result["level"] == "LOW"
        assert result["attritionRisk"] < 40

    def test_disengaged_employee_is_high_risk(self):
        data = {
            "employeeId":        2,
            "attendanceTrend":   -20.0,
            "productivityTrend": -25.0,
            "utilizationTrend":  -22.0,
            "completionTrend":   -24.0,
            "reportConsistency": 0.3,
        }
        result = predictor.predict(data)
        assert result["level"] == "HIGH"
        assert result["attritionRisk"] >= 70

    def test_empty_trends_no_crash(self):
        """Default values → should not crash"""
        result = predictor.predict({"employeeId": 3})
        assert "attritionRisk" in result

    def test_confidence_bounded(self):
        """Confidence must be 0–100"""
        result = predictor.predict({"employeeId": 4})
        assert 0 <= result["confidence"] <= 100

    def test_reasons_present_when_risk_high(self):
        data = {
            "employeeId":        5,
            "attendanceTrend":   -18.0,
            "productivityTrend": -22.0,
            "reportConsistency": 0.3,
        }
        result = predictor.predict(data)
        if result["level"] in ["HIGH", "MEDIUM"]:
            assert len(result["reasons"]) > 0

    def test_score_clamped(self):
        import random
        for _ in range(15):
            data = {
                "employeeId":        random.randint(1, 500),
                "attendanceTrend":   random.uniform(-30, 10),
                "productivityTrend": random.uniform(-35, 15),
                "utilizationTrend":  random.uniform(-30, 10),
                "completionTrend":   random.uniform(-30, 10),
                "reportConsistency": random.uniform(0.2, 1.0),
            }
            result = predictor.predict(data)
            assert 0 <= result["attritionRisk"] <= 100

    def test_response_structure(self):
        result = predictor.predict({"employeeId": 1})
        required = {"employeeId", "attritionRisk", "level", "confidence", "reasons"}
        assert required.issubset(result.keys())