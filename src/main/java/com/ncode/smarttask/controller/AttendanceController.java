package com.ncode.smarttask.controller;

import com.ncode.smarttask.dto.*;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.repository.UserRepository;
import com.ncode.smarttask.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final UserRepository    userRepository;

    // ── Helper: resolve authenticated user ────────────────
    private User resolveUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    // ── EMPLOYEE: Clock In ─────────────────────────────────
    // POST /api/attendance/clock-in
    @PostMapping("/clock-in")
    public ResponseEntity<AttendanceRecordDTO> clockIn(
            Authentication auth,
            @RequestBody(required = false) ClockInRequest request) {

        Long userId  = resolveUser(auth).getId();
        String notes = (request != null) ? request.getRemarks() : null;
        return ResponseEntity.ok(attendanceService.clockIn(userId, notes));
    }

    // ── EMPLOYEE: Clock Out ────────────────────────────────
    // POST /api/attendance/clock-out
    @PostMapping("/clock-out")
    public ResponseEntity<AttendanceRecordDTO> clockOut(
            Authentication auth,
            @RequestBody(required = false) ClockOutRequest request) {

        Long userId  = resolveUser(auth).getId();
        String notes = (request != null) ? request.getRemarks() : null;
        return ResponseEntity.ok(attendanceService.clockOut(userId, notes));
    }

    // ── EMPLOYEE: Own history ──────────────────────────────
    // GET /api/attendance/my-history
    @GetMapping("/my-history")
    public ResponseEntity<List<AttendanceRecordDTO>> getMyHistory(Authentication auth) {
        Long userId = resolveUser(auth).getId();
        return ResponseEntity.ok(attendanceService.getMyHistory(userId));
    }

    // ── EMPLOYEE: Own summary ──────────────────────────────
    // GET /api/attendance/my-summary?month=5&year=2026
    @GetMapping("/my-summary")
    public ResponseEntity<AttendanceSummaryDTO> getMySummary(
            Authentication auth,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        LocalDate now = LocalDate.now();
        int m = month > 0 ? month : now.getMonthValue();
        int y = year  > 0 ? year  : now.getYear();
        Long userId = resolveUser(auth).getId();
        return ResponseEntity.ok(attendanceService.getMySummary(userId, m, y));
    }

    // ── MANAGER: Full team attendance ──────────────────────
    // GET /api/attendance/team?month=5&year=2026
    @GetMapping("/team")
    public ResponseEntity<TeamAttendanceDTO> getTeamAttendance(
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        LocalDate now = LocalDate.now();
        int m = month > 0 ? month : now.getMonthValue();
        int y = year  > 0 ? year  : now.getYear();
        return ResponseEntity.ok(attendanceService.getTeamAttendance(m, y));
    }

    // ── MANAGER: One employee's history ───────────────────
    // GET /api/attendance/employee/{id}
    @GetMapping("/employee/{id}")
    public ResponseEntity<List<AttendanceRecordDTO>> getEmployeeHistory(@PathVariable Long id) {
        return ResponseEntity.ok(attendanceService.getEmployeeHistory(id));
    }

    // ── MANAGER: Dashboard summary (today + this month) ───
    // GET /api/attendance/dashboard-summary
    @GetMapping("/dashboard-summary")
    public ResponseEntity<TeamAttendanceDTO> getDashboardSummary() {
        LocalDate now = LocalDate.now();
        return ResponseEntity.ok(attendanceService.getTeamAttendance(now.getMonthValue(), now.getYear()));
    }
}