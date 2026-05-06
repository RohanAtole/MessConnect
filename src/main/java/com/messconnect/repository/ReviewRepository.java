package com.messconnect.repository;

import com.messconnect.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByVendorId(Long vendorId);
    List<Review> findByCustomerId(Long customerId);
}
