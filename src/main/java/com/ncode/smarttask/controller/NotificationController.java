package com.ncode.smarttask.controller;

import com.ncode.smarttask.dto.CreateNotificationRequest;
import com.ncode.smarttask.entity.Notification;
import com.ncode.smarttask.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // POST /api/notifications
    // Creates a new notification and delivers it to a specific user
    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody CreateNotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.createNotification(request));
    }

    // GET /api/notifications
    // Admin view — returns all notifications across all users
    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    // GET /api/notifications/{id}
    // Returns a specific notification by its ID
    @GetMapping("/{id}")
    public ResponseEntity<Notification> getNotificationById(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.getNotificationById(id));
    }

    // GET /api/notifications/user/{userId}
    // Returns all notifications for a specific user, ordered newest first
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getNotificationsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getNotificationsByUser(userId));
    }

    // GET /api/notifications/user/{userId}/unread
    // Returns only unread notifications for a user (for notification badge/bell)
    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUnreadNotifications(userId));
    }

    // PATCH /api/notifications/{id}/read
    // Marks a single notification as read
    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    // DELETE /api/notifications/{id}
    // Deletes a notification by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok("Notification deleted successfully");
    }
}