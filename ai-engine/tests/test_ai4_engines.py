"""
AI-4 Test Suite — corrected to match fixed service APIs
========================================================
Key rules now enforced:
  - BurnoutPredictor.predict()     → result INCLUDES  employeeId, factorScores
  - AttritionPredictor.predict()   → result EXCLUDES  employeeId  (route injects)
  - TeamHealthEngine.calculate()   → result EXCLUDES  managerId   (route injects)
  - generate_recommendations()     → result EXCLUDES  employeeId  (route injects)
  - forecast_growth()              → result EXCLUDES  employeeId  (route injects)

Run: pytest tests/test_ai4_engines.py -v
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest

from services.burnout_predictor    import BurnoutPredictor, calculate_burnout_risk
from services.attrition_predictor  import AttritionPredictor, calculate_attrition_risk
from services.team_health_engine   import TeamHealthEngine, calculate_team_health
from services.recommendation_engine import RecommendationEngine, generate_recommendations
from services.growth_forecast       import GrowthForecastEngine, forecast_growth


# ═══════════════════════════════════════════════════════════════════════════════
# AI-4A: BURNOUT ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class TestBurnoutEngine:
    """BurnoutPredictor.predict() result MUST contain factorScores."""

    predictor = BurnoutPredictor()

    def _predict(self, **kwargs):
        return self.predictor.predict(kwargs)

    # ── Response shape ────────────────────────────────────────────────────────
    def test_result_has_all_required_keys(self):
        result = self._predict(employeeId=1)
        for key in ("employeeId", "burnoutRisk", "level", "reasons", "factorScores"):
            assert key in result, f"Missing key: {key}"

    def test_factor_scores_has_all_components(self):
        result = self._predict(employeeId=1)
        for k in ("hours", "tasks", "utilization", "consecutive", "attendance", "reports"):
            assert k in result["factorScores"], f"factorScores missing: {k}"
            assert isinstance(result["factorScores"][k], int)

    def test_employee_id_echoed_back(self):
        result = self._predict(employeeId=42)
        assert result["employeeId"] == 42

    # ── Camel-case field names (from BurnoutRequest.dict()) ───────────────────
    def test_camel_case_fields_accepted(self):
        result = self.predictor.predict({
            "employeeId":            3,
            "attendancePercentage":  55.0,
            "monthlyHoursWorked":    230.0,
            "dailyAverageHours":     11.5,
            "pendingTasks":          12,
            "overdueTasks":          6,
            "utilizationPercentage": 97.0,
            "consecutiveWorkDays":   15,
            "reportsTotal":          22,
            "reportsSubmitted":      4,
        })
        assert result["level"] == "HIGH"
        assert result["burnoutRisk"] >= 70

    # ── Risk levels ───────────────────────────────────────────────────────────
    def test_high_risk_scenario(self):
        result = self._predict(
            employeeId=1,
            dailyAverageHours=11, monthlyHoursWorked=240,
            overdueTasks=6, pendingTasks=12,
            utilizationPercentage=97, consecutiveWorkDays=15,
            reportsSubmitted=3, reportsTotal=22,
        )
        assert result["level"] == "HIGH"
        assert result["burnoutRisk"] >= 70

    def test_low_risk_scenario(self):
        result = self._predict(
            employeeId=1,
            attendancePercentage=95, monthlyHoursWorked=155,
            dailyAverageHours=7.5, pendingTasks=1, overdueTasks=0,
            utilizationPercentage=62, consecutiveWorkDays=5,
            reportsSubmitted=20, reportsTotal=22,
        )
        assert result["level"] == "LOW"
        assert result["burnoutRisk"] < 40

    def test_score_clamped_0_to_100(self):
        result = self._predict(
            employeeId=1,
            dailyAverageHours=14, monthlyHoursWorked=350,
            overdueTasks=20, pendingTasks=50, utilizationPercentage=110,
            consecutiveWorkDays=30, reportsSubmitted=0, reportsTotal=22,
        )
        assert 0 <= result["burnoutRisk"] <= 100

    def test_empty_data_does_not_crash(self):
        result = self.predictor.predict({})
        assert "burnoutRisk" in result
        assert "factorScores" in result

    def test_backward_compat_function(self):
        """calculate_burnout_risk() also returns factorScores."""
        result = calculate_burnout_risk({"employeeId": 99})
        assert "factorScores" in result

    def test_reasons_list_capped_at_5(self):
        result = self._predict(
            employeeId=1,
            dailyAverageHours=11, monthlyHoursWorked=225,
            overdueTasks=7, pendingTasks=15, utilizationPercentage=98,
            consecutiveWorkDays=14, reportsSubmitted=2, reportsTotal=22,
            attendancePercentage=55,
        )
        assert len(result["reasons"]) <= 5


# ═══════════════════════════════════════════════════════════════════════════════
# AI-4B: ATTRITION ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class TestAttritionEngine:
    """AttritionPredictor.predict() result must NOT contain employeeId."""

    predictor = AttritionPredictor()

    def _predict(self, **kwargs):
        return self.predictor.predict(kwargs)

    def test_result_has_no_employee_id(self):
        """Route injects employeeId — it must NOT be in the service result."""
        result = self._predict()
        assert "employeeId" not in result, \
            "employeeId must NOT be in attrition result (route injects it)"

    def test_result_has_required_keys(self):
        result = self._predict()
        for key in ("attritionRisk", "level", "confidence", "reasons"):
            assert key in result, f"Missing key: {key}"

    def test_high_attrition(self):
        result = self._predict(
            attendance_trend=-18, productivity_trend=-20,
            utilization_trend=-25, task_completion_trend=-18,
            report_consistency=20, current_attendance=55,
            current_productivity=40, months_of_data=3,
        )
        assert result["level"] == "HIGH"
        assert result["attritionRisk"] >= 70

    def test_stable_employee(self):
        result = self._predict(
            attendance_trend=2, productivity_trend=3,
            report_consistency=90, current_attendance=90,
            current_productivity=80, months_of_data=3,
        )
        assert result["level"] == "LOW"

    def test_confidence_in_range(self):
        result = self._predict(attendance_trend=-5, months_of_data=2)
        assert 0 <= result["confidence"] <= 100

    def test_no_data_safe_defaults(self):
        result = self._predict()
        assert "attritionRisk" in result

    def test_reasons_is_list(self):
        result = self._predict(attendance_trend=-12)
        assert isinstance(result["reasons"], list)

    def test_backward_compat_function(self):
        result = calculate_attrition_risk({})
        assert "employeeId" not in result


# ═══════════════════════════════════════════════════════════════════════════════
# AI-4C: TEAM HEALTH ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class TestTeamHealthEngine:
    """TeamHealthEngine.calculate() result must NOT contain managerId."""

    engine = TeamHealthEngine()

    def _make(self, n=4, **overrides):
        base = {
            "employeeId":         None,
            "attendance_pct":     85.0,
            "productivity_pct":   75.0,
            "utilization_pct":    70.0,
            "task_completion":    80.0,
            "report_consistency": 78.0,
            "burnout_score":      20.0,
            "attrition_score":    15.0,
        }
        return [{**base, "employeeId": i + 1, **overrides} for i in range(n)]

    def test_result_has_no_manager_id(self):
        result = self.engine.calculate(self._make())
        assert "managerId" not in result, \
            "managerId must NOT be in team health result (route injects it)"

    def test_result_has_required_keys(self):
        result = self.engine.calculate(self._make())
        for k in ("teamHealth", "category", "attendanceScore", "productivityScore",
                  "completionScore", "engagementScore", "utilizationScore",
                  "teamSize", "highRiskEmployees", "topPerformers", "bottomPerformers"):
            assert k in result

    def test_employee_id_camel_case_resolved(self):
        """employeeId (camelCase from Pydantic) must appear in topPerformers."""
        employees = [
            {"employeeId": 10, "productivity_pct": 95, "task_completion": 92, "attendance_pct": 98},
            {"employeeId": 20, "productivity_pct": 40, "task_completion": 35, "attendance_pct": 50},
        ]
        result = self.engine.calculate(employees)
        assert 10 in result["topPerformers"]
        assert 20 in result["bottomPerformers"]
        # No None values
        assert None not in result["topPerformers"]
        assert None not in result["bottomPerformers"]

    def test_healthy_team_score(self):
        result = self.engine.calculate(self._make(5))
        assert result["teamHealth"] >= 60
        assert result["teamSize"] == 5

    def test_unhealthy_team(self):
        result = self.engine.calculate(self._make(
            3, attendance_pct=45, productivity_pct=38,
            task_completion=42, report_consistency=25, burnout_score=85,
        ))
        assert result["category"] in ("Average", "Needs Attention")

    def test_empty_team_returns_zeros(self):
        result = self.engine.calculate([])
        assert result["teamHealth"] == 0
        assert result["teamSize"] == 0

    def test_high_burnout_flagged_as_risk(self):
        employees = [
            {"employeeId": 1, "burnout_score": 80, "attrition_score": 20},
            {"employeeId": 2, "burnout_score": 15, "attrition_score": 10},
        ]
        result = self.engine.calculate(employees)
        assert 1 in result["highRiskEmployees"]
        assert 2 not in result["highRiskEmployees"]

    def test_backward_compat_function(self):
        result = calculate_team_health(self._make())
        assert "managerId" not in result


# ═══════════════════════════════════════════════════════════════════════════════
# AI-4D: RECOMMENDATION ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class TestRecommendationEngine:
    """generate_recommendations() result must NOT contain employeeId."""

    engine = RecommendationEngine()

    def test_result_has_no_employee_id(self):
        result = self.engine.generate({})
        assert "employeeId" not in result

    def test_result_has_required_keys(self):
        result = self.engine.generate({})
        assert "recommendations" in result
        assert "expectedImprovement" in result

    def test_poor_performer_gets_multiple_recommendations(self):
        result = self.engine.generate({
            "attendance_pct": 60, "productivity_pct": 45,
            "utilization_pct": 92, "pending_tasks": 12,
            "overdue_tasks": 5, "burnout_score": 75,
            "attrition_score": 65, "report_consistency": 35,
        })
        assert len(result["recommendations"]) >= 3
        assert result["expectedImprovement"] > 0

    def test_healthy_employee_gets_at_least_one_rec(self):
        result = self.engine.generate({
            "attendance_pct": 95, "productivity_pct": 90,
            "utilization_pct": 68, "burnout_score": 8,
        })
        assert len(result["recommendations"]) >= 1

    def test_expected_improvement_capped_at_25(self):
        result = self.engine.generate({
            "attendance_pct": 30, "productivity_pct": 20,
            "overdue_tasks": 20, "burnout_score": 100,
        })
        assert result["expectedImprovement"] <= 25

    def test_empty_data_returns_defaults(self):
        result = self.engine.generate({})
        assert isinstance(result["recommendations"], list)
        assert len(result["recommendations"]) >= 1

    def test_backward_compat_function(self):
        result = generate_recommendations({})
        assert "employeeId" not in result


# ═══════════════════════════════════════════════════════════════════════════════
# AI-4E: GROWTH FORECAST ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class TestGrowthForecastEngine:
    """forecast_growth() result must NOT contain employeeId."""

    engine = GrowthForecastEngine()

    def test_result_has_no_employee_id(self):
        result = self.engine.forecast({})
        assert "employeeId" not in result

    def test_result_has_required_keys(self):
        result = self.engine.forecast({"current_productivity": 70})
        for k in ("currentProductivity", "predictedProductivity3Months",
                  "improvement", "trend", "monthlyForecast"):
            assert k in result

    def test_monthly_forecast_has_3_entries(self):
        result = self.engine.forecast({"current_productivity": 70})
        assert len(result["monthlyForecast"]) == 3

    def test_monthly_forecast_structure(self):
        result = self.engine.forecast({"current_productivity": 70})
        for item in result["monthlyForecast"]:
            assert "month" in item
            assert "predictedProductivity" in item
            assert 1 <= item["month"] <= 3

    def test_improving_employee(self):
        result = self.engine.forecast({
            "productivity_history": [60, 65, 70, 74],
            "current_productivity": 74,
            "burnout_score": 10, "utilization_pct": 65, "attendance_pct": 92,
        })
        assert result["trend"] in ("Strong Growth", "Moderate Growth", "Stable")

    def test_declining_employee(self):
        result = self.engine.forecast({
            "productivity_history": [82, 76, 68, 62],
            "current_productivity": 62,
            "burnout_score": 78, "utilization_pct": 97, "attendance_pct": 60,
        })
        assert result["improvement"] < 5

    def test_predicted_score_clamped(self):
        result = self.engine.forecast({
            "productivity_history": [95, 98, 99],
            "current_productivity": 99,
        })
        assert result["predictedProductivity3Months"] <= 100.0
        assert result["predictedProductivity3Months"] >= 0.0

    def test_empty_input_safe(self):
        result = self.engine.forecast({})
        assert result["currentProductivity"] == 70.0  # default

    def test_backward_compat_function(self):
        result = forecast_growth({})
        assert "employeeId" not in result


# ═══════════════════════════════════════════════════════════════════════════════
# EDGE CASES — all engines
# ═══════════════════════════════════════════════════════════════════════════════

class TestEdgeCases:

    def test_zero_values_burnout(self):
        result = BurnoutPredictor().predict({
            "employeeId": 1, "attendancePercentage": 0,
            "dailyAverageHours": 0, "overdueTasks": 0,
        })
        assert 0 <= result["burnoutRisk"] <= 100

    def test_max_values_burnout(self):
        result = BurnoutPredictor().predict({
            "employeeId": 1,
            "attendancePercentage": 100, "dailyAverageHours": 24,
            "overdueTasks": 100, "pendingTasks": 100,
            "utilizationPercentage": 110, "consecutiveWorkDays": 31,
        })
        assert 0 <= result["burnoutRisk"] <= 100

    def test_none_values_handled(self):
        """None values should fall back to defaults, not crash."""
        result = BurnoutPredictor().predict({
            "employeeId": 1,
            "attendancePercentage": None,
            "dailyAverageHours": None,
        })
        assert "burnoutRisk" in result

    def test_all_engines_survive_empty_input(self):
        assert "burnoutRisk"      in calculate_burnout_risk({})
        assert "attritionRisk"    in calculate_attrition_risk({})
        assert "teamHealth"       in calculate_team_health([])
        assert "recommendations"  in generate_recommendations({})
        assert "currentProductivity" in forecast_growth({})

    def test_duplicate_kwarg_does_not_occur(self):
        """
        Simulate what the route does:
            AttritionResponse(employeeId=X, **result)
        This must not raise 'duplicate keyword argument'.
        """
        result = calculate_attrition_risk({"attendance_trend": -10})
        assert "employeeId" not in result   # would cause duplicate-kwarg

        result2 = calculate_team_health([])
        assert "managerId" not in result2   # same issue for team health

        result3 = generate_recommendations({})
        assert "employeeId" not in result3

        result4 = forecast_growth({})
        assert "employeeId" not in result4