package com.messconnect.repository;

import com.messconnect.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByCustomerId(Long customerId);
    Optional<Payment> findByTransactionId(String transactionId);
    List<Payment> findBySubscriptionCustomerId(Long customerId);
    List<Payment> findBySubscriptionPlanVendorId(Long vendorId);
}
