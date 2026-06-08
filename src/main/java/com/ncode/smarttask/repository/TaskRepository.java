package com.ncode.smarttask.repository;

import com.ncode.smarttask.entity.Task;
import com.ncode.smarttask.enums.Priority;
import com.ncode.smarttask.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // ── EXISTING METHODS (unchanged) ──────────────────────────────────────────

    /**
     * Tasks assigned to employee
     */
    List<Task> findByAssignedToId(Long userId);

    /**
     * Filter employee task by status
     */
    List<Task> findByAssignedToIdAndStatus(Long userId, TaskStatus status);

    /**
     * Tasks of a project
     */
    List<Task> findByProjectId(Long projectId);

    /**
     * Find by priority
     */
    List<Task> findByPriority(Priority priority);

    // ── AI-5 / AI-6 ADDITIONS ─────────────────────────────────────────────────

    /**
     * All non-completed tasks for an employee that have a deadline set.
     * Used by DeadlineRiskService to evaluate per-employee deadline risk.
     */
    @Query("""
        SELECT t FROM Task t
        WHERE t.assignedTo.id = :employeeId
          AND t.status <> com.ncode.smarttask.enums.TaskStatus.COMPLETED
          AND t.deadline IS NOT NULL
        ORDER BY t.deadline ASC
        """)
    List<Task> findActiveTasksWithDeadlineByEmployee(@Param("employeeId") Long employeeId);

    /**
     * All active tasks across the entire team (any assignee) that have deadlines.
     * Used by team-level risk aggregation.
     */
    @Query("""
        SELECT t FROM Task t
        WHERE t.status <> com.ncode.smarttask.enums.TaskStatus.COMPLETED
          AND t.deadline IS NOT NULL
        ORDER BY t.deadline ASC
        """)
    List<Task> findAllActiveTasksWithDeadline();

    /**
     * Active tasks for a project — used by /api/risk/project/{projectId}.
     */
    @Query("""
        SELECT t FROM Task t
        WHERE t.project.id = :projectId
          AND t.status <> com.ncode.smarttask.enums.TaskStatus.COMPLETED
          AND t.deadline IS NOT NULL
        ORDER BY t.deadline ASC
        """)
    List<Task> findActiveTasksWithDeadlineByProject(@Param("projectId") Long projectId);

    /**
     * All non-completed tasks for an employee regardless of deadline.
     * Used by RecommendationService to count pending and overdue tasks.
     */
    @Query("""
        SELECT t FROM Task t
        WHERE t.assignedTo.id = :employeeId
          AND t.status <> com.ncode.smarttask.enums.TaskStatus.COMPLETED
        """)
    List<Task> findActiveTasks(@Param("employeeId") Long employeeId);

    /**
     * Count of tasks that are past their deadline and not completed.
     * "Overdue" = deadline < now AND status != COMPLETED.
     */
    @Query("""
        SELECT COUNT(t) FROM Task t
        WHERE t.assignedTo.id = :employeeId
          AND t.status <> com.ncode.smarttask.enums.TaskStatus.COMPLETED
          AND t.deadline IS NOT NULL
          AND t.deadline < :now
        """)
    long countOverdueTasks(
            @Param("employeeId") Long employeeId,
            @Param("now") LocalDateTime now);

    /**
     * Historical on-time completion rate for an employee.
     * Returns ratio of on-time completions to total completed-with-deadline tasks.
     * Used as the "Historical Delivery" component in risk scoring.
     */
    @Query("""
        SELECT COUNT(t) FROM Task t
        WHERE t.assignedTo.id = :employeeId
          AND t.status = com.ncode.smarttask.enums.TaskStatus.COMPLETED
          AND t.deadline IS NOT NULL
          AND t.completedAt IS NOT NULL
          AND t.completedAt <= t.deadline
        """)
    long countOnTimeCompletions(@Param("employeeId") Long employeeId);

    /**
     * Total completed tasks with a deadline — denominator for on-time rate.
     */
    @Query("""
        SELECT COUNT(t) FROM Task t
        WHERE t.assignedTo.id = :employeeId
          AND t.status = com.ncode.smarttask.enums.TaskStatus.COMPLETED
          AND t.deadline IS NOT NULL
          AND t.completedAt IS NOT NULL
        """)
    long countCompletedWithDeadline(@Param("employeeId") Long employeeId);
}