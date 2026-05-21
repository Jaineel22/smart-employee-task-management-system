package com.ncode.smarttask.dto;

import com.ncode.smarttask.enums.TaskStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskProgressRequest {
    private TaskStatus taskStatus;
    private Integer completionPercentage;
}