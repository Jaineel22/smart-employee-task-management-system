"""
Recommendation Engine Test Suite
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from services.recommendation_engine import RecommendationEngine

engine = RecommendationEngine()


class TestRecommendationEngine:

    def test_high_burnout_generates_urgent_recs(self):
        data = {
            "employeeId": 1,
            "burnoutRisk": 85.0,
            "productivityScore": 60.0,
        }
        result = engine.generate(data)
        assert result["priority"] == "HIGH"
        assert len(result["recommendations"]) > 0
        assert result["expectedImprovement"] >= 0

    def test_no_issues_generates_positive_rec(self):
        data = {
            "employeeId":           2,
            "productivityScore":    88.0,
            "burnoutRisk":          15.0,
            "attritionRisk":        10.0,
            "attendancePercentage": 95.0,
            "utilizationPercentage":72.0,
            "pendingTasks":         1,
            "overdueTasks":         0,
            "reportConsistency":    1.0,
            "completionRate":       92.0,
        }
        result = engine.generate(data)
        assert len(result["recommendations"]) > 0

    def test_empty_input_no_crash(self):
        result = engine.generate({"employeeId": 3})
        assert "recommendations" in result
        assert "expectedImprovement" in result

    def test_improvement_clamped(self):
        import random
        for _ in range(15):
            data = {
                "employeeId":           random.randint(1, 100),
                "productivityScore":    random.uniform(0, 100),
                "burnoutRisk":          random.uniform(0, 100),
                "attritionRisk":        random.uniform(0, 100),
                "attendancePercentage": random.uniform(0, 100),
            }
            result = engine.generate(data)
            assert 0 <= result["expectedImprovement"] <= 25

    def test_recommendations_deduplicated(self):
        data = {
            "employeeId":   4,
            "burnoutRisk":  90.0,
            "overdueTasks": 8,
            "pendingTasks": 12,
        }
        result = engine.generate(data)
        recs = result["recommendations"]
        assert len(recs) == len(set(recs))

    def test_max_6_recommendations(self):
        data = {
            "employeeId":           5,
            "productivityScore":    30.0,
            "burnoutRisk":          85.0,
            "attritionRisk":        75.0,
            "attendancePercentage": 55.0,
            "pendingTasks":         12,
            "overdueTasks":         6,
            "reportConsistency":    0.3,
            "completionRate":       45.0,
        }
        result = engine.generate(data)
        assert len(result["recommendations"]) <= 6

    def test_response_structure(self):
        result = engine.generate({"employeeId": 1})
        required = {"employeeId", "recommendations", "expectedImprovement", "priority", "recommendationCount"}
        assert required.issubset(result.keys())