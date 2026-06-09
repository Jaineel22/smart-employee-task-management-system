package com.ncode.smarttask.service;

import com.ncode.smarttask.dto.CreateTaskRequest;
import com.ncode.smarttask.dto.TaskProgressRequest;
import com.ncode.smarttask.dto.UpdateTaskRequest;
import com.ncode.smarttask.entity.Project;
import com.ncode.smarttask.entity.Task;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.enums.TaskStatus;
import com.ncode.smarttask.repository.ProjectRepository;
import com.ncode.smarttask.repository.TaskRepository;
import com.ncode.smarttask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * TaskService — extended to recognise PAUSED and BLOCKED status transitions.
 *
 * All existing methods are preserved with identical signatures.
 * updateTaskProgress now handles PAUSED/BLOCKED without auto-completing.
 *
 * Note: actual pause/resume business logic (creating TaskInterruption records)
 * lives in TaskInterruptionService. TaskService only updates the status field.
 */
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository    taskRepository;
    private final UserRepository    userRepository;
    private final ProjectRepository projectRepository;

    // ── EXISTING METHODS (unchanged) ─────────────────────────────────────────

    public Task createTask(CreateTaskRequest request) {
        User assignedTo = userRepository.findById(request.getAssignedToId())
                .orElseThrow(() -> new RuntimeException("Employee not found: " + request.getAssignedToId()));
        User assignedBy = userRepository.findById(request.getAssignedById())
                .orElseThrow(() -> new RuntimeException("Manager not found: " + request.getAssignedById()));
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found: " + request.getProjectId()));

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .deadline(request.getDeadline())
                .assignedTo(assignedTo)
                .assignedBy(assignedBy)
                .project(project)
                .status(TaskStatus.PENDING)
                .completionPercentage(0)
                .build();

        return taskRepository.save(task);
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found: " + id));
    }

    public List<Task> getTasksByEmployee(Long employeeId) {
        return taskRepository.findByAssignedToId(employeeId);
    }

    public List<Task> getTasksByProject(Long projectId) {
        return taskRepository.findByProjectId(projectId);
    }

    public Task updateTask(Long id, UpdateTaskRequest request) {
        Task task = getTaskById(id);
        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        if (request.getDeadline() != null) {
            task.setDeadline(request.getDeadline());
        }
        return taskRepository.save(task);
    }

    public Task updateTaskProgress(Long id, TaskProgressRequest request) {
        Task task = getTaskById(id);

        if (request.getTaskStatus() != null) {
            TaskStatus newStatus = request.getTaskStatus();

            // ── PAUSED / BLOCKED: no auto-complete logic ─────────────────
            // Business logic for interruption record creation is handled
            // by TaskInterruptionService.pauseTask() / resumeTask().
            // This method only updates the status column.
            if (newStatus == TaskStatus.PAUSED || newStatus == TaskStatus.BLOCKED) {
                task.setStatus(newStatus);
                return taskRepository.save(task);
            }

            task.setStatus(newStatus);
        }

        if (request.getCompletionPercentage() != null) {
            int pct = request.getCompletionPercentage();
            if (pct < 0 || pct > 100) {
                throw new RuntimeException("Completion percentage must be between 0 and 100");
            }
            task.setCompletionPercentage(pct);

            // Auto-complete at 100%
            if (pct == 100) {
                task.setStatus(TaskStatus.COMPLETED);
                if (task.getCompletedAt() == null) {
                    task.setCompletedAt(LocalDateTime.now());
                }
            }
        }

        if (request.getTaskStatus() == TaskStatus.COMPLETED && task.getCompletedAt() == null) {
            task.setCompletedAt(LocalDateTime.now());
        }

        return taskRepository.save(task);
    }

    public void deleteTask(Long id) {
        taskRepository.delete(getTaskById(id));
    }
}