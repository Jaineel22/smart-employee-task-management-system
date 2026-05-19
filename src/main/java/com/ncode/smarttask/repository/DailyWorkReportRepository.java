package com.ncode.smarttask.repository;

import com.ncode.smarttask.entity.DailyWorkReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailyWorkReportRepository
        extends JpaRepository<
                DailyWorkReport,
                Long> {

    // Reports of employee
    List<DailyWorkReport>
    findByUserId(Long userId);

    // Reports by date
    List<DailyWorkReport>
    findByReportDate(LocalDate date);
}