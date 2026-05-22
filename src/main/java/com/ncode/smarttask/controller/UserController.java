package com.ncode.smarttask.controller;

import com.ncode.smarttask.dto.UpdateUserRequest;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // GET /api/users
    // Returns all users in the system (Admin use)
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // GET /api/users/{id}
    // Returns a specific user by their ID
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // GET /api/users/employees
    // Returns all users with role EMPLOYEE
    @GetMapping("/employees")
    public ResponseEntity<List<User>> getEmployees() {
        return ResponseEntity.ok(userService.getEmployees());
    }

    // GET /api/users/managers
    // Returns all users with role MANAGER
    @GetMapping("/managers")
    public ResponseEntity<List<User>> getManagers() {
        return ResponseEntity.ok(userService.getManagers());
    }

    // PUT /api/users/{id}
    // Updates user fields — only non-null fields are changed
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id,
                                           @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    // DELETE /api/users/{id}
    // Soft delete — sets isActive = false, user stays in DB
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deactivateUser(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok("User deactivated successfully");
    }
}
