package com.ncode.smarttask.repository;

import com.ncode.smarttask.entity.TaskInterruption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * TaskInterruptionRepository — all queries for Feature 2.
 * Zero changes to existing repositories.
 */
@Repository
public interface TaskInterruptionRepository extends JpaRepository<TaskInterruption, Long> {

    /** All interruptions for a task, most recent first */
    List<TaskInterruption> findByTaskIdOrderByPausedAtDesc(Long taskId);

    /** All interruptions by an employee */
    List<TaskInterruption> findByEmployeeIdOrderByPausedAtDesc(Long employeeId);

    /** Currently active pause — resumedAt is null */
    Optional<TaskInterruption> findByTaskIdAndResumedAtIsNull(Long taskId);

    /** All tasks currently paused by an employee */
    @Query("""
        SELECT ti FROM TaskInterruption ti
        WHERE ti.employee.id = :employeeId
          AND ti.resumedAt IS NULL
        ORDER BY ti.pausedAt DESC
        """)
    List<TaskInterruption> findCurrentlyPausedByEmployee(@Param("employeeId") Long employeeId);

    /** All currently paused tasks across the team */
    @Query("SELECT ti FROM TaskInterruption ti WHERE ti.resumedAt IS NULL ORDER BY ti.pausedAt DESC")
    List<TaskInterruption> findAllCurrentlyPaused();

    /** Count interruptions per employee — for analytics */
    @Query("""
        SELECT ti.employee.fullName, COUNT(ti)
        FROM TaskInterruption ti
        GROUP BY ti.employee.id, ti.employee.fullName
        ORDER BY COUNT(ti) DESC
        """)
    List<Object[]> countInterruptionsPerEmployee();

    /** Count interruptions per project */
    @Query("""
        SELECT ti.task.project.name, COUNT(ti)
        FROM TaskInterruption ti
        WHERE ti.task.project IS NOT NULL
        GROUP BY ti.task.project.id, ti.task.project.name
        ORDER BY COUNT(ti) DESC
        """)
    List<Object[]> countInterruptionsPerProject();

    /** Total paused hours for an employee (completed interruptions only) */
    @Query("""
        SELECT COALESCE(SUM(ti.interruptionDurationHours), 0)
        FROM TaskInterruption ti
        WHERE ti.employee.id = :employeeId
          AND ti.interruptionDurationHours IS NOT NULL
        """)
    Integer sumPausedHoursByEmployee(@Param("employeeId") Long employeeId);

    /** All interruptions for a specific task that have delay justifications */
    @Query("""
        SELECT ti FROM TaskInterruption ti
        WHERE ti.task.id = :taskId
          AND ti.delayJustification IS NOT NULL
        """)
    List<TaskInterruption> findWithDelayJustificationByTask(@Param("taskId") Long taskId);

    /** Recent interruptions for manager dashboard (all employees) */
    @Query("""
        SELECT ti FROM TaskInterruption ti
        ORDER BY ti.pausedAt DESC
        """)
    List<TaskInterruption> findAllOrderByPausedAtDesc();
}