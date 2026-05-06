package com.messconnect.controller;

import com.messconnect.entity.MealAttendance;
import com.messconnect.entity.Menu;
import com.messconnect.entity.Plan;
import com.messconnect.entity.Subscription;
import com.messconnect.entity.Vendor;
import com.messconnect.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/vendors")
public class VendorController {
    @Autowired
    VendorRepository vendorRepository;

    @Autowired
    PlanRepository planRepository;

    @Autowired
    MenuRepository menuRepository;

    @Autowired
    MealAttendanceRepository attendanceRepository;

    @Autowired
    SubscriptionRepository subscriptionRepository;

    @GetMapping("/public/list")
    public List<Vendor> getAllApprovedVendors() {
        return vendorRepository.findByStatus(Vendor.VendorStatus.APPROVED);
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<Vendor> getVendorById(@PathVariable Long id) {
        return vendorRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/public/{id}/plans")
    public List<Plan> getVendorPlans(@PathVariable Long id) {
        return planRepository.findByVendorId(id);
    }

    @GetMapping("/public/{id}/menu")
    public List<Menu> getVendorMenu(@PathVariable Long id, @RequestParam(required = false) Long planId) {
        if (planId != null) {
            return menuRepository.findByPlanId(planId);
        }
        return menuRepository.findByVendorId(id);
    }

    @PostMapping("/{vendorId}/plans")
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    public Plan createPlan(@PathVariable Long vendorId, @RequestBody Plan plan) {
        Vendor vendor = vendorRepository.findById(vendorId).orElseThrow();
        plan.setVendor(vendor);
        return planRepository.save(plan);
    }

    @PutMapping("/plans/{planId}")
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    public Plan updatePlan(@PathVariable Long planId, @RequestBody Plan planDetails) {
        Plan plan = planRepository.findById(planId).orElseThrow();
        plan.setName(planDetails.getName());
        plan.setPrice(planDetails.getPrice());
        plan.setDuration(planDetails.getDuration());
        plan.setMealsPerDay(planDetails.getMealsPerDay());
        return planRepository.save(plan);
    }

    @DeleteMapping("/plans/{planId}")
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    public ResponseEntity<?> deletePlan(@PathVariable Long planId) {
        planRepository.deleteById(planId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{vendorId}/menu")
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    public Menu createMenu(@PathVariable Long vendorId, @RequestParam(required = false) Long planId, @RequestBody Menu menu) {
        Vendor vendor = vendorRepository.findById(vendorId).orElseThrow();
        menu.setVendor(vendor);
        if (planId != null) {
            Plan plan = planRepository.findById(planId).orElseThrow();
            menu.setPlan(plan);
        }
        return menuRepository.save(menu);
    }

    @PutMapping("/menu/{menuId}")
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    public Menu updateMenu(@PathVariable Long menuId, @RequestBody Menu menuDetails) {
        Menu menu = menuRepository.findById(menuId).orElseThrow();
        menu.setMenuDay(menuDetails.getMenuDay());
        menu.setBreakfast(menuDetails.getBreakfast());
        menu.setLunch(menuDetails.getLunch());
        menu.setDinner(menuDetails.getDinner());
        return menuRepository.save(menu);
    }

    @DeleteMapping("/menu/{menuId}")
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteMenu(@PathVariable Long menuId) {
        menuRepository.deleteById(menuId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    public Vendor updateVendor(@PathVariable Long id, @RequestBody Vendor vendorDetails) {
        Vendor vendor = vendorRepository.findById(id).orElseThrow();
        vendor.setMessName(vendorDetails.getMessName());
        vendor.setOwnerName(vendorDetails.getOwnerName());
        vendor.setPhone(vendorDetails.getPhone());
        vendor.setAddress(vendorDetails.getAddress());
        vendor.setDescription(vendorDetails.getDescription());
        vendor.setImage(vendorDetails.getImage());
        return vendorRepository.save(vendor);
    }
    @PostMapping("/attendance/mark")
    @PreAuthorize("hasRole('VENDOR')")
    public MealAttendance markAttendance(@RequestParam Long subscriptionId, @RequestParam String status) {
        Subscription sub = subscriptionRepository.findById(subscriptionId).orElseThrow();
        MealAttendance attendance = new MealAttendance();
        attendance.setSubscription(sub);
        attendance.setCustomer(sub.getCustomer());
        attendance.setDate(java.time.LocalDate.now());
        attendance.setStatus(MealAttendance.AttendanceStatus.valueOf(status));
        
        if (attendance.getStatus() == MealAttendance.AttendanceStatus.MISSED) {
            // Extend period by 1 day
            sub.setEndDate(sub.getEndDate().plusDays(1));
            subscriptionRepository.save(sub);
        }
        
        return attendanceRepository.save(attendance);
    }

    @GetMapping("/{vendorId}/subscribers")
    @PreAuthorize("hasRole('VENDOR')")
    public List<Subscription> getSubscribers(@PathVariable Long vendorId) {
        return subscriptionRepository.findByPlanVendorId(vendorId);
    }

    @GetMapping("/attendance/{subscriptionId}")
    @PreAuthorize("hasRole('VENDOR')")
    public List<MealAttendance> getAttendanceHistory(@PathVariable Long subscriptionId) {
        return attendanceRepository.findBySubscriptionId(subscriptionId);
    }
}
