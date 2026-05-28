package com.ncode.smarttask.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClockOutRequest {
    // Optional note on clock-out
    private String remarks;
}