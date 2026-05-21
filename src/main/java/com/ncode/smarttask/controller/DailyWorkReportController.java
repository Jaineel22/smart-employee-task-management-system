package com.ncode.smarttask.controller;

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

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class DailyWorkReportController {

    private final DailyWorkReportService dailyWorkReportService;

    // POST /api/reports
    // Employee submits a new daily work report for a task
    @PostMapping
    public ResponseEntity<DailyWorkReport> createReport(@RequestBody CreateDailyWorkReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dailyWorkReportService.createReport(request));
    }

    // GET /api/reports
    // Admin/Manager views all submitted reports across all employees
    @GetMapping
    public ResponseEntity<List<DailyWorkReport>> getAllReports() {
        return ResponseEntity.ok(dailyWorkReportService.getAllReports());
    }

    // GET /api/reports/{id}
    // Fetch a specific report by its ID
    @GetMapping("/{id}")
    public ResponseEntity<DailyWorkReport> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(dailyWorkReportService.getReportById(id));
    }

    // GET /api/reports/user/{userId}
    // Employee or Manager views all reports submitted by a specific employee
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<DailyWorkReport>> getReportsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(dailyWorkReportService.getReportsByUser(userId));
    }

    // GET /api/reports/date/2025-06-01
    // Manager/Admin views all reports submitted on a specific date
    // Date format: YYYY-MM-DD
    @GetMapping("/date/{date}")
    public ResponseEntity<List<DailyWorkReport>> getReportsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(dailyWorkReportService.getReportsByDate(date));
    }

    // PUT /api/reports/{id}
    // Employee updates their existing report — only non-null fields are changed
    @PutMapping("/{id}")
    public ResponseEntity<DailyWorkReport> updateReport(@PathVariable Long id,
                                                         @RequestBody UpdateDailyWorkReportRequest request) {
        return ResponseEntity.ok(dailyWorkReportService.updateReport(id, request));
    }

    // DELETE /api/reports/{id}
    // Delete a report by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteReport(@PathVariable Long id) {
        dailyWorkReportService.deleteReport(id);
        return ResponseEntity.ok("Report deleted successfully");
    }
}