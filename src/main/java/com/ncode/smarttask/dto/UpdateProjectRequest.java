package com.ncode.smarttask.dto;

import com.ncode.smarttask.enums.ProjectStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UpdateProjectRequest {
    private String name;
    private String description;
    private ProjectStatus status;
    private LocalDate endDate;
}