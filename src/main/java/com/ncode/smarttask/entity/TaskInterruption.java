package com.ncode.smarttask.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * TaskInterruption — records every pause/resume event for a task.
 *
 * One task can have multiple interruptions over its lifecycle.
 * Used by:
 *   - Productivity engine: paused time is excluded from delay penalty
 *   - Risk engine: interruption count increases risk score
 *   - Manager dashboard: delay justification visibility
 */
@Entity
@Table(name = "task_interruptions",
        indexes = {
            @Index(name = "idx_ti_task",     columnList = "task_id"),
            @Index(name = "idx_ti_employee", columnList = "employee_id"),
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskInterruption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The task being interrupted */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    /** The employee who paused/resumed the task */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    /** When the task was paused */
    @Column(nullable = false)
    private LocalDateTime pausedAt;

    /** When the task was resumed — null while still paused */
    private LocalDateTime resumedAt;

    /** Mandatory reason for pausing — used in delay justification */
    @Column(nullable = false, length = 1000)
    private String pauseReason;

    /** Optional note added when resuming */
    @Column(length = 1000)
    private String resumeNote;

    /**
     * Duration in hours between pausedAt and resumedAt.
     * Calculated automatically on resume — stored for analytics.
     */
    private Integer interruptionDurationHours;

    /**
     * Employee-provided justification when task misses deadline due to this interruption.
     * E.g. "Task paused due to urgent production hotfix assigned by manager."
     * Used by productivity engine to avoid unfair penalty.
     */
    @Column(length = 2000)
    private String delayJustification;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}