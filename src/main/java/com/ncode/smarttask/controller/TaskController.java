package com.ncode.smarttask.controller;

import com.ncode.smarttask.dto.CreateTaskRequest;
import com.ncode.smarttask.dto.TaskProgressRequest;
import com.ncode.smarttask.dto.UpdateTaskRequest;
import com.ncode.smarttask.entity.Task;
import com.ncode.smarttask.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // POST /api/tasks
    // Creates a new task and assigns it to an employee inside a project
    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody CreateTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(request));
    }

    // GET /api/tasks
    // Returns all tasks in the system
    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    // GET /api/tasks/{id}
    // Returns a specific task by ID
    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    // GET /api/tasks/employee/{employeeId}
    // Returns all tasks assigned to a specific employee
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Task>> getTasksByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(taskService.getTasksByEmployee(employeeId));
    }

    // GET /api/tasks/project/{projectId}
    // Returns all tasks belonging to a specific project
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Task>> getTasksByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId));
    }

    // PUT /api/tasks/{id}
    // Updates task details (title, description, priority, deadline)
    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id,
                                           @RequestBody UpdateTaskRequest request) {
        return ResponseEntity.ok(taskService.updateTask(id, request));
    }

    // PATCH /api/tasks/{id}/progress
    // Updates task status and/or completion percentage
    // Auto-marks COMPLETED if percentage reaches 100
    @PatchMapping("/{id}/progress")
    public ResponseEntity<Task> updateTaskProgress(@PathVariable Long id,
                                                    @RequestBody TaskProgressRequest request) {
        return ResponseEntity.ok(taskService.updateTaskProgress(id, request));
    }

    // DELETE /api/tasks/{id}
    // Hard deletes a task
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok("Task deleted successfully");
    }
}
