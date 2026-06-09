package com.ncode.smarttask.controller;

import com.ncode.smarttask.dto.ActivityReportResponse;
import com.ncode.smarttask.dto.CreateDailyWorkReportRequest;
import com.ncode.smarttask.dto.UpdateDailyWorkReportRequest;
import com.ncode.smarttask.entity.DailyWorkReport;
import com.ncode.smarttask.service.DailyWorkReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * DailyWorkReportController — extended with Activity Intelligence endpoints.
 *
 * All existing endpoints are preserved with identical paths and behaviour.
 * New endpoints are under /api/reports/activity/* to avoid any collision.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class DailyWorkReportController {

    private final DailyWorkReportService dailyWorkReportService;

    // ── EXISTING ENDPOINTS (unchanged) ───────────────────────────────────────

    /**
     * POST /api/reports
     * Employee submits a new daily work report for a task
     */
    @PostMapping
    public ResponseEntity<DailyWorkReport> createReport(
            @RequestBody CreateDailyWorkReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(dailyWorkReportService.createReport(request));
    }

    /**
     * GET /api/reports
     * Admin/Manager views all submitted reports across all employees
     */
    @GetMapping
    public ResponseEntity<List<DailyWorkReport>> getAllReports() {
        return ResponseEntity.ok(dailyWorkReportService.getAllReports());
    }

    /**
     * GET /api/reports/{id}
     * Fetch a specific report by its ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<DailyWorkReport> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(dailyWorkReportService.getReportById(id));
    }

    /**
     * GET /api/reports/user/{userId}
     * Employee or Manager views all reports submitted by a specific employee
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<DailyWorkReport>> getReportsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(dailyWorkReportService.getReportsByUser(userId));
    }

    /**
     * GET /api/reports/date/{date}
     * Manager/Admin views all reports submitted on a specific date
     * Date format: YYYY-MM-DD
     */
    @GetMapping("/date/{date}")
    public ResponseEntity<List<DailyWorkReport>> getReportsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(dailyWorkReportService.getReportsByDate(date));
    }

    /**
     * PUT /api/reports/{id}
     * Employee updates their existing report — only non-null fields are changed
     */
    @PutMapping("/{id}")
    public ResponseEntity<DailyWorkReport> updateReport(
            @PathVariable Long id,
            @RequestBody UpdateDailyWorkReportRequest request) {
        return ResponseEntity.ok(dailyWorkReportService.updateReport(id, request));
    }

    /**
     * DELETE /api/reports/{id}
     * Delete a report by ID
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteReport(@PathVariable Long id) {
        dailyWorkReportService.deleteReport(id);
        return ResponseEntity.ok("Report deleted successfully");
    }

    // ── NEW: Activity Intelligence endpoints ──────────────────────────────────

    /**
     * GET /api/reports/activity
     * Manager: all employees' activity reports with AI insights.
     */
    @GetMapping("/activity")
    public ResponseEntity<List<ActivityReportResponse>> getAllActivityReports() {
        return ResponseEntity.ok(dailyWorkReportService.getAllActivityReports());
    }

    /**
     * GET /api/reports/activity/user/{userId}
     * Get enriched activity reports for one employee.
     */
    @GetMapping("/activity/user/{userId}")
    public ResponseEntity<List<ActivityReportResponse>> getActivityReportsByUser(
            @PathVariable Long userId) {
        return ResponseEntity.ok(dailyWorkReportService.getActivityReportsByUser(userId));
    }

    /**
     * GET /api/reports/activity/date/{date}
     * Manager: all activity reports for a specific date.
     */
    @GetMapping("/activity/date/{date}")
    public ResponseEntity<List<ActivityReportResponse>> getActivityReportsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(dailyWorkReportService.getActivityReportsByDate(date));
    }
}