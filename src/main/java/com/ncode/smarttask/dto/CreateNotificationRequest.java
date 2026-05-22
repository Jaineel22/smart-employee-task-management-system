package com.ncode.smarttask.dto;

import com.ncode.smarttask.enums.NotificationType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateNotificationRequest {
    private String title;
    private String message;
    private NotificationType type;
    private Long userId;
}