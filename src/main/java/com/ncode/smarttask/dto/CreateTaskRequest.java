package com.ncode.smarttask.dto;

import com.ncode.smarttask.enums.Priority;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Getter
@Setter
public class CreateTaskRequest {
    @NotBlank(message = "Task title is required")
    private String title;
    private String description;
    private Priority priority;
    private LocalDateTime deadline;
    @NotNull(message = "Assigned to (employee ID) is required")
    private Long assignedToId;
    @NotNull(message = "Assigned by (manager ID) is required")
    private Long assignedById;
    @NotNull(message = "Project ID is required")
    private Long projectId;
}