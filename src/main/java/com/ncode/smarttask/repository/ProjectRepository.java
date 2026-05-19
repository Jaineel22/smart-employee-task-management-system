package com.ncode.smarttask.repository;

import com.ncode.smarttask.entity.Project;
import com.ncode.smarttask.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository
        extends JpaRepository<Project, Long> {

    // Manager's projects
    List<Project> findByManagerId(
            Long managerId
    );

    // Filter by status
    List<Project> findByStatus(
            ProjectStatus status
    );
}   