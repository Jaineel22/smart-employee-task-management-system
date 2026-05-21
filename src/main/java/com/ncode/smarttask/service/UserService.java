package com.ncode.smarttask.service;

import com.ncode.smarttask.dto.UpdateUserRequest;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.enums.Role;
import com.ncode.smarttask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    // Get all users regardless of role or status
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Get a single user by ID — throws if not found
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    // Get all users with role EMPLOYEE
    public List<User> getEmployees() {
        return userRepository.findByRole(Role.EMPLOYEE);
    }

    // Get all users with role MANAGER
    public List<User> getManagers() {
        return userRepository.findByRole(Role.MANAGER);
    }

    // Partial update — only update fields that are non-null in the request
    public User updateUser(Long id, UpdateUserRequest request) {
        User user = getUserById(id);

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }

        return userRepository.save(user);
    }

    // Soft delete — sets isActive to false, does not remove from DB
    public void deactivateUser(Long id) {
        User user = getUserById(id);
        user.setIsActive(false);
        userRepository.save(user);
    }
}
