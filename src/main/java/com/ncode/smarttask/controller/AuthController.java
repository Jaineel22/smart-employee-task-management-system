package com.ncode.smarttask.controller;

import com.ncode.smarttask.dto.AuthResponse;
import com.ncode.smarttask.dto.LoginRequest;
import com.ncode.smarttask.dto.RegisterRequest;
import com.ncode.smarttask.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public String register(
            @Valid
            @RequestBody RegisterRequest request
    ) {

        return authService.register(
                request
        );
    }
    
    @PostMapping("/login")
        public AuthResponse login(
                @Valid
                @RequestBody
                LoginRequest request
        ) {

            return authService.login(
                    request
            );
        }
}
