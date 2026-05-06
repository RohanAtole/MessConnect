package com.messconnect.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "meal_attendance")
@Data
@NoArgsConstructor
public class MealAttendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "subscription_id")
    private Subscription subscription;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    private LocalDate date;

    @Enumerated(EnumType.STRING)
    private AttendanceStatus status; // TAKEN, MISSED

    public enum AttendanceStatus {
        TAKEN, MISSED
    }
}
