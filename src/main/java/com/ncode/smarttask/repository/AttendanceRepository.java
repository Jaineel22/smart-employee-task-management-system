package com.ncode.smarttask.repository;

import com.ncode.smarttask.entity.Attendance;
import com.ncode.smarttask.enums.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    // Used by clock-in to check if already clocked in today
    Optional<Attendance> findByUserIdAndDate(Long userId, LocalDate date);

    // Employee's full history
    List<Attendance> findByUserIdOrderByDateDesc(Long userId);

    // Date range — used for monthly summary
    List<Attendance> findByUserIdAndDateBetweenOrderByDateDesc(Long userId, LocalDate from, LocalDate to);

    // Manager: all attendance for a date (today's attendance board)
    List<Attendance> findByDateOrderByUserFullNameAsc(LocalDate date);

    // Manager: team attendance in a date range
    List<Attendance> findByDateBetweenOrderByDateDesc(LocalDate from, LocalDate to);

    // Count by status in a date range (for percentage calculation)
    long countByUserIdAndDateBetweenAndAttendanceStatus(
            Long userId, LocalDate from, LocalDate to, AttendanceStatus status);

    // Total days with any attendance record in range
    long countByUserIdAndDateBetween(Long userId, LocalDate from, LocalDate to);

    // Manager: count present employees today
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.date = :date AND a.attendanceStatus IN ('PRESENT', 'LATE')")
    long countPresentToday(@Param("date") LocalDate date);

    // Manager: count late employees today
    long countByDateAndAttendanceStatus(LocalDate date, AttendanceStatus status);

    // Average hours worked in a date range for one employee
    @Query("SELECT COALESCE(AVG(a.totalHoursWorked), 0) FROM Attendance a " +
           "WHERE a.user.id = :userId AND a.date BETWEEN :from AND :to " +
           "AND a.totalHoursWorked IS NOT NULL")
    Double avgHoursWorkedInRange(@Param("userId") Long userId,
                                  @Param("from") LocalDate from,
                                  @Param("to") LocalDate to);

    // Sum of hours worked in a date range
    @Query("SELECT COALESCE(SUM(a.totalHoursWorked), 0) FROM Attendance a " +
           "WHERE a.user.id = :userId AND a.date BETWEEN :from AND :to " +
           "AND a.totalHoursWorked IS NOT NULL")
    Double sumHoursWorkedInRange(@Param("userId") Long userId,
                                  @Param("from") LocalDate from,
                                  @Param("to") LocalDate to);
}