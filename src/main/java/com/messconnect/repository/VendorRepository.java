package com.messconnect.repository;

import com.messconnect.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
    Optional<Vendor> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Vendor> findByStatus(Vendor.VendorStatus status);
}
