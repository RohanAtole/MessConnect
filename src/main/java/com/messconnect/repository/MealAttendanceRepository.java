package com.messconnect.repository;

import com.messconnect.entity.MealAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface MealAttendanceRepository extends JpaRepository<MealAttendance, Long> {
    List<MealAttendance> findBySubscriptionId(Long subscriptionId);
    List<MealAttendance> findByCustomerIdAndDate(Long customerId, LocalDate date);
}
