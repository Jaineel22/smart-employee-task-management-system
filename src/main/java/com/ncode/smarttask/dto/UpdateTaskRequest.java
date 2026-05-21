package com.ncode.smarttask.dto;

import com.ncode.smarttask.enums.Priority;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UpdateTaskRequest {
    private String title;
    private String description;
    private Priority priority;
    private LocalDateTime deadline;
}