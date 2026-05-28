package com.ncode.smarttask.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClockInRequest {
    // Optional note on clock-in (e.g. "Working from home")
    private String remarks;
}