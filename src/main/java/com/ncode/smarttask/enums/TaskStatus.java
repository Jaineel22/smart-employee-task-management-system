package com.ncode.smarttask.enums;

/**
 * TaskStatus — extended with interruption states.
 *
 * Existing values are PRESERVED in original order (ordinal unchanged):
 *   PENDING, IN_PROGRESS, COMPLETED, OVERDUE
 *
 * New values appended at the end to avoid ordinal shift issues
 * (though we always use EnumType.STRING in JPA, so order doesn't matter).
 */
public enum TaskStatus {

    // ── EXISTING (unchanged) ──────────────────────────────────────────────────
    PENDING,
    IN_PROGRESS,
    COMPLETED,
    OVERDUE,

    // ── NEW: Interruption states ──────────────────────────────────────────────

    /**
     * Task is paused by employee — usually due to higher-priority work.
     * A TaskInterruption record is created when transitioning to PAUSED.
     * The pauseReason is mandatory.
     */
    PAUSED,

    /**
     * Task was previously PAUSED and has been resumed.
     * The corresponding TaskInterruption record is updated with resumedAt.
     * Status transitions to IN_PROGRESS after resume.
     * RESUMED is a transient state — used in the interruption log.
     */
    RESUMED,

    /**
     * Task is blocked by an external dependency or impediment.
     * Different from PAUSED: BLOCKED = waiting on someone else,
     * PAUSED = employee chose to work on something else.
     */
    BLOCKED
}