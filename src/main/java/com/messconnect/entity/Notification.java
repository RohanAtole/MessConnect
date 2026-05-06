package com.messconnect.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String userType; // ADMIN, CUSTOMER, VENDOR

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    private String type;

    private Boolean isRead = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
