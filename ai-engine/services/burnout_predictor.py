"""
burnout_predictor.py
====================
Predicts employee burnout risk based on behavioral patterns.

Input features:
- attendance_percentage (0-100)
- monthly_hours_worked (0-300)
- daily_avg_hours (0-24)
- pending_tasks (0-50)
- overdue_tasks (0-30)
- utilization_percentage (0-100)
- consecutive_work_days (1-30)
- reports_submitted (0-30)

Risk Levels:
- LOW (0-39): Green - Employee seems healthy
- MEDIUM (40-69): Orange - Monitor closely
- HIGH (70-100): Red - Immediate intervention needed
"""

import math
from typing import Dict, Any, List, Optional
from datetime import datetime

class BurnoutPredictor:
    """Deterministic burnout risk calculator - no ML required for Phase 4A"""
    
    # Risk level thresholds
    RISK_THRESHOLDS = {
        "LOW": {"min": 0, "max": 39, "color": "green", "action": "Monitor normally"},
        "MEDIUM": {"min": 40, "max": 69, "color": "orange", "action": "Schedule check-in"},
        "HIGH": {"min": 70, "max": 100, "color": "red", "action": "Immediate intervention required"}
    }
    
    # Feature weights (sum to 1.0)
    WEIGHTS = {
        "attendance_percentage": 0.15,
        "hours_variance": 0.20,      # High variance = risk
        "pending_overdue_ratio": 0.20,
        "utilization_rate": 0.15,
        "consecutive_days": 0.15,
        "report_consistency": 0.15
    }
    
    @classmethod
    def predict(cls, employee_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate burnout risk score.
        
        Args:
            employee_data: Dictionary containing employee metrics
            
        Returns:
            Dict with burnoutRisk, level, reasons, and recommendations
        """
        
        # Extract features with defaults
        attendance_pct = float(employee_data.get('attendance_percentage', 80))
        monthly_hours = float(employee_data.get('monthly_hours_worked', 160))
        daily_avg_hours = float(employee_data.get('daily_avg_hours', 8))
        pending_tasks = int(employee_data.get('pending_tasks', 0))
        overdue_tasks = int(employee_data.get('overdue_tasks', 0))
        utilization_pct = float(employee_data.get('utilization_percentage', 70))
        consecutive_days = int(employee_data.get('consecutive_work_days', 5))
        reports_submitted = int(employee_data.get('reports_submitted', 10))
        expected_reports = int(employee_data.get('expected_reports', 22))
        
        # 1. Attendance Score (lower attendance = higher risk)
        attendance_score = (100 - attendance_pct) / 100 * 100
        
        # 2. Hours Variance Score (high variance = burnout risk)
        expected_hours = 176  # 22 days * 8 hours
        hours_variance = abs(monthly_hours - expected_hours) / expected_hours
        hours_variance_score = min(100, hours_variance * 100 * 2)
        
        # 3. Pending/Overdue Ratio Score
        total_pending = pending_tasks + overdue_tasks
        if total_pending > 0:
            overdue_ratio = overdue_tasks / total_pending
            pending_score = min(100, (overdue_ratio * 100) + (total_pending * 2))
        else:
            pending_score = 0
        
        # 4. Utilization Score (over-utilization = risk)
        if utilization_pct > 100:
            utilization_score = min(100, (utilization_pct - 100) * 2)
        elif utilization_pct < 60:
            utilization_score = 20  # Under-utilization, moderate risk
        else:
            utilization_score = 0
        
        # 5. Consecutive Days Score
        if consecutive_days > 10:
            consecutive_score = min(100, (consecutive_days - 10) * 10)
        elif consecutive_days > 7:
            consecutive_score = 50
        else:
            consecutive_score = 0
        
        # 6. Report Consistency Score
        if expected_reports > 0:
            report_ratio = reports_submitted / expected_reports
            if report_ratio < 0.5:
                report_score = 80
            elif report_ratio < 0.8:
                report_score = 40
            else:
                report_score = 0
        else:
            report_score = 0
        
        # Calculate weighted total
        burnout_risk = (
            attendance_score * cls.WEIGHTS["attendance_percentage"] +
            hours_variance_score * cls.WEIGHTS["hours_variance"] +
            pending_score * cls.WEIGHTS["pending_overdue_ratio"] +
            utilization_score * cls.WEIGHTS["utilization_rate"] +
            consecutive_score * cls.WEIGHTS["consecutive_days"] +
            report_score * cls.WEIGHTS["report_consistency"]
        )
        
        # Clamp to 0-100
        burnout_risk = max(0, min(100, round(burnout_risk, 1)))
        
        # Determine risk level
        level = cls._get_risk_level(burnout_risk)
        
        # Generate reasons
        reasons = cls._generate_reasons(
            attendance_pct, monthly_hours, pending_tasks, overdue_tasks,
            utilization_pct, consecutive_days, report_ratio if expected_reports > 0 else 1
        )
        
        # Generate recommendations
        recommendations = cls._generate_recommendations(reasons, level)
        
        return {
            "employeeId": employee_data.get('employee_id'),
            "burnoutRisk": burnout_risk,
            "level": level,
            "reasons": reasons,
            "recommendations": recommendations,
            "timestamp": datetime.now().isoformat()
        }
    
    @classmethod
    def _get_risk_level(cls, score: float) -> str:
        """Get risk level based on score"""
        if score <= 39:
            return "LOW"
        elif score <= 69:
            return "MEDIUM"
        else:
            return "HIGH"
    
    @classmethod
    def _generate_reasons(cls, attendance: float, hours: float, 
                          pending: int, overdue: int, 
                          utilization: float, consecutive_days: int,
                          report_ratio: float) -> List[str]:
        """Generate human-readable reasons for burnout risk"""
        reasons = []
        
        if attendance < 75:
            reasons.append(f"Attendance dropped to {attendance:.0f}%")
        elif attendance > 95:
            reasons.append("Perfect attendance but may indicate overcommitment")
        
        if hours > 200:
            reasons.append(f"Working {hours:.0f}h/month exceeds healthy limit (176h)")
        elif hours < 120:
            reasons.append(f"Low work hours ({hours:.0f}h/month)")
        
        if overdue > 0:
            reasons.append(f"{overdue} overdue task{'s' if overdue > 1 else ''} pending")
        
        if pending > 10:
            reasons.append(f"High workload: {pending} pending tasks")
        
        if utilization > 100:
            reasons.append(f"Over-utilization at {utilization:.0f}% capacity")
        elif utilization < 50:
            reasons.append(f"Low engagement: {utilization:.0f}% utilization")
        
        if consecutive_days > 10:
            reasons.append(f"Worked {consecutive_days} days without break")
        
        if report_ratio < 0.6:
            reasons.append("Inconsistent report submission pattern")
        
        if len(reasons) == 0:
            reasons.append("Work patterns appear healthy")
        
        return reasons[:4]  # Limit to top 4 reasons
    
    @classmethod
    def _generate_recommendations(cls, reasons: List[str], level: str) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        if level == "HIGH":
            recommendations.append("Schedule immediate 1:1 wellness check")
            recommendations.append("Consider workload redistribution")
            recommendations.append("Encourage mandatory time off")
            recommendations.append("Review task priorities")
        elif level == "MEDIUM":
            recommendations.append("Conduct bi-weekly check-in")
            recommendations.append("Monitor workload and deadlines")
            recommendations.append("Promote work-life balance")
        else:
            recommendations.append("Continue current monitoring")
            recommendations.append("Recognize positive work patterns")
        
        # Specific recommendations based on reasons
        reason_text = " ".join(reasons).lower()
        
        if "attendance" in reason_text:
            recommendations.append("Review attendance patterns")
        if "overdue" in reason_text:
            recommendations.append("Provide deadline management support")
        if "workload" in reason_text:
            recommendations.append("Reassess task distribution")
        if "without break" in reason_text:
            recommendations.append("Schedule mandatory day off")
        
        # Remove duplicates and limit
        return list(dict.fromkeys(recommendations))[:4]


# Standalone function for easy import
def predict_burnout(employee_data: Dict[str, Any]) -> Dict[str, Any]:
    """Wrapper function for burnout prediction"""
    return BurnoutPredictor.predict(employee_data)