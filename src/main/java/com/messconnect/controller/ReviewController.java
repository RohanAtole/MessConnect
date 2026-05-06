package com.messconnect.controller;

import com.messconnect.entity.Customer;
import com.messconnect.entity.Review;
import com.messconnect.entity.Vendor;
import com.messconnect.repository.CustomerRepository;
import com.messconnect.repository.ReviewRepository;
import com.messconnect.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    @Autowired
    ReviewRepository reviewRepository;

    @Autowired
    CustomerRepository customerRepository;

    @Autowired
    VendorRepository vendorRepository;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public Review addReview(@RequestParam Long customerId, @RequestParam Long vendorId, @RequestBody Review review) {
        Customer customer = customerRepository.findById(customerId).orElseThrow();
        Vendor vendor = vendorRepository.findById(vendorId).orElseThrow();

        review.setCustomer(customer);
        review.setVendor(vendor);
        return reviewRepository.save(review);
    }

    @GetMapping("/vendor/{vendorId}")
    public List<Review> getVendorReviews(@PathVariable Long vendorId) {
        return reviewRepository.findByVendorId(vendorId);
    }
}
