package com.ncode.smarttask.service;

import com.ncode.smarttask.dto.*;
import com.ncode.smarttask.entity.Task;
import com.ncode.smarttask.entity.TaskInterruption;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.enums.TaskStatus;
import com.ncode.smarttask.repository.TaskInterruptionRepository;
import com.ncode.smarttask.repository.TaskRepository;
import com.ncode.smarttask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * TaskInterruptionService — handles pause/resume workflow for Feature 2.
 *
 * Key design principle:
 *   Paused time is tracked and stored in TaskInterruption so that
 *   the Productivity engine can exclude it from delay penalties.
 *
 * Productivity engine integration:
 *   Call getTotalPausedHoursForTask(taskId) to get total paused duration
 *   before computing late delivery penalty.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TaskInterruptionService {

    private final TaskInterruptionRepository interruptionRepository;
    private final TaskRepository             taskRepository;
    private final UserRepository             userRepository;

    // ════════════════════════════════════════════════════════════════════════
    // PAUSE
    // ════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/tasks/{taskId}/pause
     * Pause a task and record the interruption.
     * Task status → PAUSED.
     */
    public TaskInterruptionResponse pauseTask(Long taskId, PauseTaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        User employee = userRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found: " + request.getEmployeeId()));

        // Guard: can only pause IN_PROGRESS tasks
        if (task.getStatus() != TaskStatus.IN_PROGRESS && task.getStatus() != TaskStatus.RESUMED) {
            throw new RuntimeException(
                    "Task '" + task.getTitle() + "' cannot be paused — current status: " + task.getStatus());
        }

        // Guard: task already paused?
        interruptionRepository.findByTaskIdAndResumedAtIsNull(taskId)
                .ifPresent(existing -> {
                    throw new RuntimeException(
                            "Task is already paused since " + existing.getPausedAt());
                });

        if (request.getPauseReason() == null || request.getPauseReason().isBlank()) {
            throw new RuntimeException("Pause reason is mandatory.");
        }

        // Set task status to PAUSED
        task.setStatus(TaskStatus.PAUSED);
        taskRepository.save(task);

        // Create interruption record
        TaskInterruption interruption = TaskInterruption.builder()
                .task(task)
                .employee(employee)
                .pausedAt(LocalDateTime.now())
                .pauseReason(request.getPauseReason().trim())
                .build();

        TaskInterruption saved = interruptionRepository.save(interruption);
        log.info("[Interruption] Task {} paused by employee {} — reason: {}",
                task.getId(), employee.getId(), request.getPauseReason());

        return toResponse(saved);
    }

    // ════════════════════════════════════════════════════════════════════════
    // RESUME
    // ════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/tasks/{taskId}/resume
     * Resume a paused task.
     * Calculates interruption duration and updates the record.
     * Task status → IN_PROGRESS.
     */
    public TaskInterruptionResponse resumeTask(Long taskId, ResumeTaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        // Guard: must be PAUSED
        if (task.getStatus() != TaskStatus.PAUSED) {
            throw new RuntimeException(
                    "Task '" + task.getTitle() + "' is not currently paused — status: " + task.getStatus());
        }

        // Find the open interruption record
        TaskInterruption interruption = interruptionRepository
                .findByTaskIdAndResumedAtIsNull(taskId)
                .orElseThrow(() -> new RuntimeException(
                        "No active pause record found for task " + taskId));

        LocalDateTime now = LocalDateTime.now();
        long pausedHours = ChronoUnit.HOURS.between(interruption.getPausedAt(), now);

        interruption.setResumedAt(now);
        interruption.setInterruptionDurationHours((int) pausedHours);
        if (request.getResumeNote() != null) {
            interruption.setResumeNote(request.getResumeNote().trim());
        }
        if (request.getDelayJustification() != null) {
            interruption.setDelayJustification(request.getDelayJustification().trim());
        }

        interruptionRepository.save(interruption);

        // Set task back to IN_PROGRESS
        task.setStatus(TaskStatus.IN_PROGRESS);
        taskRepository.save(task);

        log.info("[Interruption] Task {} resumed by employee {} — paused for {}h",
                task.getId(), request.getEmployeeId(), pausedHours);

        return toResponse(interruption);
    }

    // ════════════════════════════════════════════════════════════════════════
    // QUERY METHODS
    // ════════════════════════════════════════════════════════════════════════

    /** GET /api/tasks/{taskId}/interruptions */
    @Transactional(readOnly = true)
    public List<TaskInterruptionResponse> getInterruptionsByTask(Long taskId) {
        return interruptionRepository.findByTaskIdOrderByPausedAtDesc(taskId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** GET /api/interruptions/employee/{employeeId} */
    @Transactional(readOnly = true)
    public List<TaskInterruptionResponse> getInterruptionsByEmployee(Long employeeId) {
        return interruptionRepository.findByEmployeeIdOrderByPausedAtDesc(employeeId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** GET /api/interruptions/paused/employee/{employeeId} — currently paused */
    @Transactional(readOnly = true)
    public List<TaskInterruptionResponse> getCurrentlyPausedByEmployee(Long employeeId) {
        return interruptionRepository.findCurrentlyPausedByEmployee(employeeId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** GET /api/interruptions/paused — all currently paused (manager) */
    @Transactional(readOnly = true)
    public List<TaskInterruptionResponse> getAllCurrentlyPaused() {
        return interruptionRepository.findAllCurrentlyPaused()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** GET /api/interruptions/analytics — manager analytics */
    @Transactional(readOnly = true)
    public InterruptionAnalyticsResponse getAnalytics() {
        List<TaskInterruption> all = interruptionRepository.findAllOrderByPausedAtDesc();
        List<TaskInterruption> paused = interruptionRepository.findAllCurrentlyPaused();

        int totalPausedHours = all.stream()
                .filter(i -> i.getInterruptionDurationHours() != null)
                .mapToInt(TaskInterruption::getInterruptionDurationHours)
                .sum();

        double avgDuration = all.stream()
                .filter(i -> i.getInterruptionDurationHours() != null)
                .mapToInt(TaskInterruption::getInterruptionDurationHours)
                .average()
                .orElse(0.0);

        // Most interrupted employee
        String mostInterruptedEmp = null;
        List<Object[]> empCounts = interruptionRepository.countInterruptionsPerEmployee();
        if (!empCounts.isEmpty()) {
            mostInterruptedEmp = (String) empCounts.get(0)[0];
        }

        // Most interrupted project
        String mostInterruptedProj = null;
        List<Object[]> projCounts = interruptionRepository.countInterruptionsPerProject();
        if (!projCounts.isEmpty()) {
            mostInterruptedProj = (String) projCounts.get(0)[0];
        }

        double avgPerEmployee = empCounts.isEmpty() ? 0.0
                : empCounts.stream().mapToLong(r -> ((Number) r[1]).longValue()).average().orElse(0.0);

        return InterruptionAnalyticsResponse.builder()
                .totalInterruptions(all.size())
                .currentlyPausedCount(paused.size())
                .totalPausedHours(totalPausedHours)
                .avgPauseDurationHours(Math.round(avgDuration * 10.0) / 10.0)
                .mostInterruptedEmployee(mostInterruptedEmp)
                .mostInterruptedProject(mostInterruptedProj)
                .avgInterruptionsPerEmployee(Math.round(avgPerEmployee * 10.0) / 10.0)
                .currentlyPausedTasks(paused.stream().map(this::toResponse).collect(Collectors.toList()))
                .recentInterruptions(all.stream().limit(10).map(this::toResponse).collect(Collectors.toList()))
                .build();
    }

    // ════════════════════════════════════════════════════════════════════════
    // PRODUCTIVITY ENGINE INTEGRATION
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Used by DeadlineRiskService and ProductivityService to get total
     * paused time for a task, so delay penalty can be adjusted.
     */
    @Transactional(readOnly = true)
    public int getTotalPausedHoursForTask(Long taskId) {
        return interruptionRepository.findByTaskIdOrderByPausedAtDesc(taskId).stream()
                .filter(i -> i.getInterruptionDurationHours() != null)
                .mapToInt(TaskInterruption::getInterruptionDurationHours)
                .sum();
    }

    /**
     * Returns true if the task missed its deadline but has valid
     * interruption-based justification (approved delay).
     */
    @Transactional(readOnly = true)
    public boolean hasApprovedDelayJustification(Long taskId) {
        return !interruptionRepository.findWithDelayJustificationByTask(taskId).isEmpty();
    }

    // ════════════════════════════════════════════════════════════════════════
    // MAPPER
    // ════════════════════════════════════════════════════════════════════════

    private TaskInterruptionResponse toResponse(TaskInterruption i) {
        return TaskInterruptionResponse.builder()
                .id(i.getId())
                .taskId(i.getTask() != null ? i.getTask().getId() : null)
                .taskTitle(i.getTask() != null ? i.getTask().getTitle() : null)
                .employeeId(i.getEmployee() != null ? i.getEmployee().getId() : null)
                .employeeName(i.getEmployee() != null ? i.getEmployee().getFullName() : null)
                .pausedAt(i.getPausedAt())
                .resumedAt(i.getResumedAt())
                .pauseReason(i.getPauseReason())
                .resumeNote(i.getResumeNote())
                .interruptionDurationHours(i.getInterruptionDurationHours())
                .delayJustification(i.getDelayJustification())
                .currentlyPaused(i.getResumedAt() == null)
                .createdAt(i.getCreatedAt())
                .build();
    }
}