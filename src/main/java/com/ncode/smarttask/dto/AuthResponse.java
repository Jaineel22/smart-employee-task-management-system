package com.ncode.smarttask.dto;

import com.ncode.smarttask.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;

    private Long id;

    private String fullName;

    private String email;

    private Role role;
}