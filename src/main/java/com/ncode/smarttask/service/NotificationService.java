package com.ncode.smarttask.service;

import com.ncode.smarttask.dto.CreateNotificationRequest;
import com.ncode.smarttask.entity.Notification;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.repository.NotificationRepository;
import com.ncode.smarttask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    public Notification createNotification(CreateNotificationRequest request) {

        // Validate user exists before creating notification
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getUserId()));

        Notification notification = Notification.builder()
                .title(request.getTitle())
                .message(request.getMessage())
                .type(request.getType())
                .user(user)
                .isRead(false)
                .build();

        return notificationRepository.save(notification);
    }

    public List<Notification> getAllNotifications() {
        log.debug("Fetching all notifications");
        return notificationRepository.findAll();
    }

    public Notification getNotificationById(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
    }

    public List<Notification> getNotificationsByUser(Long userId) {
        log.debug("Fetching notifications for user {}", userId);
        // Confirm user exists before querying
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        log.debug("Fetching unread notifications for user {}", userId);
        // Confirm user exists before querying
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        return notificationRepository.findByUserIdAndIsReadFalse(userId);
    }

    public Notification markAsRead(Long id) {
        Notification notification = getNotificationById(id);
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    public void deleteNotification(Long id) {
        Notification notification = getNotificationById(id);
        notificationRepository.delete(notification);
    }
}