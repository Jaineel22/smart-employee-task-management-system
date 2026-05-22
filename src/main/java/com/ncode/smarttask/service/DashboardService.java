package com.ncode.smarttask.service;

import com.ncode.smarttask.dto.AdminDashboardResponse;
import com.ncode.smarttask.dto.EmployeeDashboardResponse;
import com.ncode.smarttask.entity.Task;
import com.ncode.smarttask.enums.Priority;
import com.ncode.smarttask.enums.Role;
import com.ncode.smarttask.enums.TaskStatus;
import com.ncode.smarttask.repository.DailyWorkReportRepository;
import com.ncode.smarttask.repository.NotificationRepository;
import com.ncode.smarttask.repository.ProjectRepository;
import com.ncode.smarttask.repository.TaskRepository;
import com.ncode.smarttask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final DailyWorkReportRepository dailyWorkReportRepository;
    private final NotificationRepository notificationRepository;

    public AdminDashboardResponse getAdminDashboard() {

        // User counts by role
        long totalEmployees = userRepository.findByRole(Role.EMPLOYEE).size();
        long totalManagers  = userRepository.findByRole(Role.MANAGER).size();

        // Project and task totals
        long totalProjects  = projectRepository.count();
        List<Task> allTasks = taskRepository.findAll();
        long totalTasks     = allTasks.size();

        // Task breakdowns using streams + enum comparison
        long completedTasks   = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED)
                .count();

        long pendingTasks     = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.PENDING)
                .count();

        long inProgressTasks  = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS)
                .count();

        long highPriorityTasks = allTasks.stream()
                .filter(t -> t.getPriority() == Priority.HIGH || t.getPriority() == Priority.URGENT)
                .count();

        // Report and notification totals
        long totalReports       = dailyWorkReportRepository.count();
        long totalNotifications = notificationRepository.count();

        return AdminDashboardResponse.builder()
                .totalEmployees(totalEmployees)
                .totalManagers(totalManagers)
                .totalProjects(totalProjects)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .pendingTasks(pendingTasks)
                .inProgressTasks(inProgressTasks)
                .highPriorityTasks(highPriorityTasks)
                .totalReports(totalReports)
                .totalNotifications(totalNotifications)
                .build();
    }

    public EmployeeDashboardResponse getEmployeeDashboard(Long employeeId) {

        // Confirm employee exists before building their dashboard
        userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + employeeId));

        // All tasks assigned to this employee
        List<Task> myTasks = taskRepository.findByAssignedToId(employeeId);
        long totalTasks    = myTasks.size();

        long completedTasks  = myTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED)
                .count();

        long pendingTasks    = myTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.PENDING)
                .count();

        long inProgressTasks = myTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS)
                .count();

        // Daily reports submitted by this employee
        long totalReports = dailyWorkReportRepository.findByUserId(employeeId).size();

        // Unread notifications in employee's inbox
        long unreadNotifications = notificationRepository.countByUserIdAndIsReadFalse(employeeId);

        // Average completion percentage across all assigned tasks
        // Defaults to 0.0 if no tasks are assigned yet
        double averageCompletionPercentage = myTasks.stream()
                .mapToInt(Task::getCompletionPercentage)
                .average()
                .orElse(0.0);

        // Round to 2 decimal places for clean output
        averageCompletionPercentage = Math.round(averageCompletionPercentage * 100.0) / 100.0;

        return EmployeeDashboardResponse.builder()
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .pendingTasks(pendingTasks)
                .inProgressTasks(inProgressTasks)
                .totalReports(totalReports)
                .unreadNotifications(unreadNotifications)
                .averageCompletionPercentage(averageCompletionPercentage)
                .build();
    }
}