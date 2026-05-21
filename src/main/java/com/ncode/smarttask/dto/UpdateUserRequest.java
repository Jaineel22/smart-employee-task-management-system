package com.ncode.smarttask.dto;

import com.ncode.smarttask.enums.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserRequest {
    private String fullName;
    private String department;
    private Role role;
    private Boolean isActive;
}