package com.ncode.smarttask.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CreateProjectRequest {
    private String name;
    private String description;
    private Long managerId;
    private LocalDate startDate;
    private LocalDate endDate;
}