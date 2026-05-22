package com.ncode.smarttask.controller;

import com.ncode.smarttask.dto.AdminDashboardResponse;
import com.ncode.smarttask.dto.EmployeeDashboardResponse;
import com.ncode.smarttask.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // GET /api/dashboard/admin
    // Returns full system-wide analytics for Admin or Manager view
    @GetMapping("/admin")
    public ResponseEntity<AdminDashboardResponse> getAdminDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }

    // GET /api/dashboard/employee/{employeeId}
    // Returns personal productivity summary for a specific employee
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<EmployeeDashboardResponse> getEmployeeDashboard(@PathVariable Long employeeId) {
        return ResponseEntity.ok(dashboardService.getEmployeeDashboard(employeeId));
    }
}