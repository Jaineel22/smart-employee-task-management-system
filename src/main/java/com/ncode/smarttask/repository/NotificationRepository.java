package com.ncode.smarttask.repository;

import com.ncode.smarttask.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository
        extends JpaRepository<
                Notification,
                Long> {

    // User notifications
    List<Notification>
    findByUserId(Long userId);

    // Unread notifications
    List<Notification>
    findByUserIdAndIsReadFalse(
            Long userId
    );
}