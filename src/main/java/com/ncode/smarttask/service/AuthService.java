package com.ncode.smarttask.service;

import com.ncode.smarttask.dto.AuthResponse;
import com.ncode.smarttask.dto.LoginRequest;
import com.ncode.smarttask.dto.RegisterRequest;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.repository.UserRepository;
import com.ncode.smarttask.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // REGISTER USER
    public String register(
            RegisterRequest request
    ) {

        // Check existing email
        if (userRepository.existsByEmail(
                request.getEmail()
        )) {
            return "Email already registered";
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())

                // Encrypt Password
                .password(
                        passwordEncoder.encode(
                                request.getPassword()
                        )
                )

                .department(request.getDepartment())
                .role(request.getRole())
                .build();

        userRepository.save(user);

        return "User Registered Successfully";
    }

    // LOGIN USER
    public AuthResponse login(
            LoginRequest request
    ) {

        // Find user by email
        User user = userRepository
                .findByEmail(
                        request.getEmail()
                )
                .orElse(null);

        if (user == null) {
            throw new RuntimeException(
                    "User not found"
            );
        }

        // Verify password
        boolean passwordMatch =
                passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                );

        if (!passwordMatch) {
            throw new RuntimeException(
                    "Invalid Password"
            );
        }

        // Generate JWT token
        String token =
                jwtService.generateToken(
                        user.getEmail()
                );

        // Return token
        return new AuthResponse(
                token
        );
    }
}