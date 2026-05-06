package com.messconnect.controller;

import com.messconnect.entity.Customer;
import com.messconnect.entity.Plan;
import com.messconnect.entity.Subscription;
import com.messconnect.repository.CustomerRepository;
import com.messconnect.repository.PlanRepository;
import com.messconnect.repository.SubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {
    @Autowired
    SubscriptionRepository subscriptionRepository;

    @Autowired
    CustomerRepository customerRepository;

    @Autowired
    PlanRepository planRepository;

    @PostMapping("/subscribe")
    @PreAuthorize("hasRole('CUSTOMER')")
    public Subscription subscribe(@RequestParam Long customerId, @RequestParam Long planId) {
        Customer customer = customerRepository.findById(customerId).orElseThrow();
        
        // Check for active subscriptions
        List<Subscription> activeSubs = subscriptionRepository.findByCustomerId(customerId).stream()
                .filter(s -> s.getStatus() == Subscription.SubscriptionStatus.ACTIVE)
                .toList();
        
        if (!activeSubs.isEmpty()) {
            throw new RuntimeException("You already have an active subscription. Please wait until it expires.");
        }

        Plan plan = planRepository.findById(planId).orElseThrow();

        Subscription subscription = new Subscription();
        subscription.setCustomer(customer);
        subscription.setPlan(plan);
        subscription.setStartDate(LocalDate.now());
        subscription.setEndDate(LocalDate.now().plusDays(plan.getDuration()));
        subscription.setStatus(Subscription.SubscriptionStatus.ACTIVE);

        return subscriptionRepository.save(subscription);
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public List<Subscription> getCustomerSubscriptions(@PathVariable Long customerId) {
        return subscriptionRepository.findByCustomerId(customerId);
    }

    @GetMapping("/vendor/{vendorId}")
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    public List<Subscription> getVendorSubscriptions(@PathVariable Long vendorId) {
        return subscriptionRepository.findByPlanVendorId(vendorId);
    }
}
