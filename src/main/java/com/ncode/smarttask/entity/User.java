package com.ncode.smarttask.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.ncode.smarttask.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String department;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // One manager → many projects
    @OneToMany(mappedBy = "manager")
    @JsonIgnore
    @Builder.Default
    private List<Project> managedProjects =
            new ArrayList<>();

    // One employee → many tasks
    @OneToMany(mappedBy = "assignedTo")
    @JsonIgnore
    @Builder.Default
    private List<Task> assignedTasks =
            new ArrayList<>();

    // One user → many reports
    @OneToMany(mappedBy = "user")
    @JsonIgnore
    @Builder.Default
    private List<DailyWorkReport> workReports =
            new ArrayList<>();

    // One user → many notifications
    @OneToMany(mappedBy = "user")
    @JsonIgnore
    @Builder.Default
    private List<Notification> notifications =
            new ArrayList<>();
}