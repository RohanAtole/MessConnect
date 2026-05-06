package com.messconnect.controller;

import com.messconnect.entity.Admin;
import com.messconnect.entity.Customer;
import com.messconnect.entity.Vendor;
import com.messconnect.repository.AdminRepository;
import com.messconnect.repository.CustomerRepository;
import com.messconnect.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    @Autowired
    VendorRepository vendorRepository;

    @Autowired
    AdminRepository adminRepository;

    @Autowired
    CustomerRepository customerRepository;

    @GetMapping("/vendors/pending")
    public List<Vendor> getPendingVendors() {
        return vendorRepository.findByStatus(Vendor.VendorStatus.PENDING);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long totalVendors = vendorRepository.count();
        long pendingVendors = vendorRepository.findByStatus(Vendor.VendorStatus.PENDING).size();
        long totalCustomers = customerRepository.count();

        return ResponseEntity.ok(Map.of(
            "totalVendors", totalVendors,
            "pendingVendors", pendingVendors,
            "totalCustomers", totalCustomers
        ));
    }

    @GetMapping("/vendors/all")
    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    @GetMapping("/users/all")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(Map.of(
            "vendors", vendorRepository.findAll(),
            "customers", customerRepository.findAll(),
            "admins", adminRepository.findAll()
        ));
    }

    @PutMapping("/vendors/{id}/approve")
    public Vendor approveVendor(@PathVariable Long id) {
        Vendor vendor = vendorRepository.findById(id).orElseThrow();
        vendor.setStatus(Vendor.VendorStatus.APPROVED);
        return vendorRepository.save(vendor);
    }

    @PutMapping("/vendors/{id}/reject")
    public Vendor rejectVendor(@PathVariable Long id) {
        Vendor vendor = vendorRepository.findById(id).orElseThrow();
        vendor.setStatus(Vendor.VendorStatus.REJECTED);
        return vendorRepository.save(vendor);
    }

    @DeleteMapping("/vendors/{id}")
    public ResponseEntity<?> deleteVendor(@PathVariable Long id) {
        vendorRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/vendors/{id}")
    public Vendor updateVendor(@PathVariable Long id, @RequestBody Vendor details) {
        Vendor vendor = vendorRepository.findById(id).orElseThrow();
        vendor.setMessName(details.getMessName());
        vendor.setOwnerName(details.getOwnerName());
        vendor.setEmail(details.getEmail());
        vendor.setPhone(details.getPhone());
        vendor.setAddress(details.getAddress());
        vendor.setDescription(details.getDescription());
        return vendorRepository.save(vendor);
    }

    @DeleteMapping("/customers/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Long id) {
        customerRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/customers/{id}")
    public Customer updateCustomer(@PathVariable Long id, @RequestBody Customer details) {
        Customer customer = customerRepository.findById(id).orElseThrow();
        customer.setName(details.getName());
        customer.setEmail(details.getEmail());
        customer.setPhone(details.getPhone());
        customer.setAddress(details.getAddress());
        return customerRepository.save(customer);
    }

    @PutMapping("/profile/{id}")
    public Admin updateAdmin(@PathVariable Long id, @RequestBody Admin adminDetails) {
        Admin admin = adminRepository.findById(id).orElseThrow();
        admin.setEmail(adminDetails.getEmail());
        return adminRepository.save(admin);
    }
}
