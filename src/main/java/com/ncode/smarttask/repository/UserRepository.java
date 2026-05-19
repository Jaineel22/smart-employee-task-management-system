package com.ncode.smarttask.repository;

import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository
        extends JpaRepository<User, Long> {

    // Find user by email (login)
    Optional<User> findByEmail(String email);

    // Check email already exists
    boolean existsByEmail(String email);

    // Find users by role
    List<User> findByRole(Role role);

    // Get only active users
    List<User> findByIsActiveTrue();
}