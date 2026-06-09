package com.ncode.smarttask.controller;

import com.ncode.smarttask.dto.*;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.repository.UserRepository;
import com.ncode.smarttask.service.TaskInterruptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * TaskInterruptionController — Feature 2: Pause / Resume Workflow
 *
 * Endpoints:
 *   POST /api/tasks/{taskId}/pause                  — Employee pauses a task
 *   POST /api/tasks/{taskId}/resume                 — Employee resumes a task
 *   GET  /api/tasks/{taskId}/interruptions          — History for a task
 *   GET  /api/interruptions/employee/{employeeId}   — All interruptions by employee
 *   GET  /api/interruptions/paused                  — All currently paused (manager)
 *   GET  /api/interruptions/paused/me               — My currently paused tasks
 *   GET  /api/interruptions/analytics               — Manager analytics
 *
 * JWT auth is inherited from SecurityConfig.
 * All new paths — zero collision with existing endpoints.
 */
@RestController
@RequiredArgsConstructor
public class TaskInterruptionController {

    private final TaskInterruptionService interruptionService;
    private final UserRepository userRepository;

    // ── Helper to resolve user ID from Authentication ─────────────────────────

    private Long resolveUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return user.getId();
    }

    // ── Pause ─────────────────────────────────────────────────────────────────

    /**
     * POST /api/tasks/{taskId}/pause
     * Employee pauses an in-progress task with a mandatory reason.
     */
    @PostMapping("/api/tasks/{taskId}/pause")
    public ResponseEntity<TaskInterruptionResponse> pauseTask(
            @PathVariable Long taskId,
            @RequestBody PauseTaskRequest request) {

        return ResponseEntity.ok(interruptionService.pauseTask(taskId, request));
    }

    // ── Resume ────────────────────────────────────────────────────────────────

    /**
     * POST /api/tasks/{taskId}/resume
     * Employee resumes a paused task.
     * Automatically calculates interruption duration.
     */
    @PostMapping("/api/tasks/{taskId}/resume")
    public ResponseEntity<TaskInterruptionResponse> resumeTask(
            @PathVariable Long taskId,
            @RequestBody ResumeTaskRequest request) {

        return ResponseEntity.ok(interruptionService.resumeTask(taskId, request));
    }

    // ── Task history ──────────────────────────────────────────────────────────

    /**
     * GET /api/tasks/{taskId}/interruptions
     * Full interruption history for a task — visible to employee and manager.
     */
    @GetMapping("/api/tasks/{taskId}/interruptions")
    public ResponseEntity<List<TaskInterruptionResponse>> getTaskInterruptions(
            @PathVariable Long taskId) {

        return ResponseEntity.ok(interruptionService.getInterruptionsByTask(taskId));
    }

    // ── Employee view ─────────────────────────────────────────────────────────

    /**
     * GET /api/interruptions/employee/{employeeId}
     * All interruptions by a specific employee — manager view.
     */
    @GetMapping("/api/interruptions/employee/{employeeId}")
    public ResponseEntity<List<TaskInterruptionResponse>> getByEmployee(
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(interruptionService.getInterruptionsByEmployee(employeeId));
    }

    /**
     * GET /api/interruptions/paused/me
     * Employee: my currently paused tasks.
     * Reads employee ID from the JWT principal.
     */
    @GetMapping("/api/interruptions/paused/me")
    public ResponseEntity<List<TaskInterruptionResponse>> getMyPausedTasks(
            Authentication authentication) {

        Long employeeId = resolveUserId(authentication);
        return ResponseEntity.ok(interruptionService.getCurrentlyPausedByEmployee(employeeId));
    }

    // ── Manager views ─────────────────────────────────────────────────────────

    /**
     * GET /api/interruptions/paused
     * Manager: all tasks currently paused across the team.
     */
    @GetMapping("/api/interruptions/paused")
    public ResponseEntity<List<TaskInterruptionResponse>> getAllPaused() {
        return ResponseEntity.ok(interruptionService.getAllCurrentlyPaused());
    }

    /**
     * GET /api/interruptions/analytics
     * Manager: interruption analytics — counts, durations, most interrupted.
     */
    @GetMapping("/api/interruptions/analytics")
    public ResponseEntity<InterruptionAnalyticsResponse> getAnalytics() {
        return ResponseEntity.ok(interruptionService.getAnalytics());
    }
}