package com.ncode.smarttask.repository;

import com.ncode.smarttask.entity.Task;
import com.ncode.smarttask.enums.Priority;
import com.ncode.smarttask.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository
        extends JpaRepository<Task, Long> {

    // Tasks assigned to employee
    List<Task> findByAssignedToId(
            Long userId
    );

    // Filter employee task by status
    List<Task> findByAssignedToIdAndStatus(
            Long userId,
            TaskStatus status
    );

    // Tasks of a project
    List<Task> findByProjectId(
            Long projectId
    );

    // Find by priority
    List<Task> findByPriority(
            Priority priority
    );
}