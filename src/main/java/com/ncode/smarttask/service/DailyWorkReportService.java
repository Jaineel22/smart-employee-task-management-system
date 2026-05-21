package com.ncode.smarttask.service;

import com.ncode.smarttask.dto.CreateDailyWorkReportRequest;
import com.ncode.smarttask.dto.UpdateDailyWorkReportRequest;
import com.ncode.smarttask.entity.DailyWorkReport;
import com.ncode.smarttask.entity.Task;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.repository.DailyWorkReportRepository;
import com.ncode.smarttask.repository.TaskRepository;
import com.ncode.smarttask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DailyWorkReportService {

    private final DailyWorkReportRepository dailyWorkReportRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    public DailyWorkReport createReport(CreateDailyWorkReportRequest request) {

        // Validate user exists
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getUserId()));

        // Validate task exists
        Task task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + request.getTaskId()));

        // Validate hours worked is positive
        if (request.getHoursWorked() == null || request.getHoursWorked().doubleValue() <= 0) {
            throw new RuntimeException("Hours worked must be greater than 0");
        }

        // Validate completion percentage range
        if (request.getCompletionPercentage() != null &&
                (request.getCompletionPercentage() < 0 || request.getCompletionPercentage() > 100)) {
            throw new RuntimeException("Completion percentage must be between 0 and 100");
        }

        // Prevent duplicate: one report per user per task per day
        dailyWorkReportRepository
                .findByUserIdAndTaskIdAndReportDate(request.getUserId(), request.getTaskId(), request.getReportDate())
                .ifPresent(existing -> {
                    throw new RuntimeException(
                            "A report for this task on " + request.getReportDate() + " already exists for this user"
                    );
                });

        DailyWorkReport report = DailyWorkReport.builder()
                .workDescription(request.getWorkDescription())
                .hoursWorked(request.getHoursWorked().doubleValue())
                .completionPercentage(request.getCompletionPercentage() != null ? request.getCompletionPercentage() : 0)
                .reportDate(request.getReportDate())
                .user(user)
                .task(task)
                .build();

        return dailyWorkReportRepository.save(report);
    }

    public List<DailyWorkReport> getAllReports() {
        return dailyWorkReportRepository.findAll();
    }

    public DailyWorkReport getReportById(Long id) {
        return dailyWorkReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found with id: " + id));
    }

    public List<DailyWorkReport> getReportsByUser(Long userId) {
        // Confirm user exists before querying reports
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        return dailyWorkReportRepository.findByUserId(userId);
    }

    public List<DailyWorkReport> getReportsByDate(LocalDate date) {
        return dailyWorkReportRepository.findByReportDate(date);
    }

    public DailyWorkReport updateReport(Long id, UpdateDailyWorkReportRequest request) {
        DailyWorkReport report = getReportById(id);

        if (request.getWorkDescription() != null) {
            report.setWorkDescription(request.getWorkDescription());
        }

        if (request.getHoursWorked() != null) {
            if (request.getHoursWorked().doubleValue() <= 0) {
                throw new RuntimeException("Hours worked must be greater than 0");
            }
            report.setHoursWorked(request.getHoursWorked().doubleValue());
        }

        if (request.getCompletionPercentage() != null) {
            if (request.getCompletionPercentage() < 0 || request.getCompletionPercentage() > 100) {
                throw new RuntimeException("Completion percentage must be between 0 and 100");
            }
            report.setCompletionPercentage(request.getCompletionPercentage());
        }

        return dailyWorkReportRepository.save(report);
    }

    public void deleteReport(Long id) {
        DailyWorkReport report = getReportById(id);
        dailyWorkReportRepository.delete(report);
    }
}