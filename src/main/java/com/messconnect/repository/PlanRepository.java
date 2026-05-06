package com.messconnect.repository;

import com.messconnect.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlanRepository extends JpaRepository<Plan, Long> {
    List<Plan> findByVendorId(Long vendorId);
}
