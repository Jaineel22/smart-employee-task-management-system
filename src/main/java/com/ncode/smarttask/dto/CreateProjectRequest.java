package com.ncode.smarttask.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Getter
@Setter
public class CreateProjectRequest {
    @NotBlank(message = "Project name is required")
    private String name;
    private String description;
    @NotNull(message = "Manager ID is required")
    private Long managerId;
    private LocalDate startDate;
    private LocalDate endDate;
}