package com.messconnect.controller;

import com.messconnect.entity.Customer;
import com.messconnect.entity.Payment;
import com.messconnect.entity.Plan;
import com.messconnect.entity.Subscription;
import com.messconnect.repository.CustomerRepository;
import com.messconnect.repository.PaymentRepository;
import com.messconnect.repository.PlanRepository;
import com.messconnect.repository.SubscriptionRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    @Autowired
    PaymentRepository paymentRepository;

    @Autowired
    CustomerRepository customerRepository;

    @Autowired
    PlanRepository planRepository;

    @Autowired
    SubscriptionRepository subscriptionRepository;

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public List<Payment> getCustomerPayments(@PathVariable Long customerId) {
        return paymentRepository.findByCustomerId(customerId);
    }

    @PostMapping("/create-order")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createOrder(@RequestParam Long planId, @RequestParam Long customerId) {
        try {
            // Check for active subscriptions
            List<Subscription> activeSubs = subscriptionRepository.findByCustomerId(customerId).stream()
                    .filter(s -> s.getStatus() == Subscription.SubscriptionStatus.ACTIVE)
                    .toList();
            
            if (!activeSubs.isEmpty()) {
                return ResponseEntity.status(400).body("You already have an active subscription. Please wait until it expires.");
            }

            Plan plan = planRepository.findById(planId).orElseThrow();
            Customer customer = customerRepository.findById(customerId).orElseThrow();
            
            RazorpayClient razorpay = new RazorpayClient(keyId, keySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", plan.getPrice().multiply(new BigDecimal(100)).intValue()); // amount in paise
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

            Order order = razorpay.orders.create(orderRequest);

            // Create pending payment record
            Payment payment = new Payment();
            payment.setCustomer(customer);
            payment.setAmount(plan.getPrice());
            payment.setPaymentMethod("RAZORPAY");
            payment.setTransactionId(order.get("id")); // Store Order ID initially
            payment.setStatus(Payment.PaymentStatus.PENDING);
            paymentRepository.save(payment);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.get("id"));
            response.put("amount", order.get("amount"));
            response.put("key", keyId);

            return ResponseEntity.ok(response);
        } catch (RazorpayException e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    @PostMapping("/verify-payment")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> data, @RequestParam Long customerId, @RequestParam Long planId) {
        String orderId = data.get("razorpay_order_id");
        String paymentId = data.get("razorpay_payment_id");
        String signature = data.get("razorpay_signature");

        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);

            boolean isValid = Utils.verifyPaymentSignature(options, keySecret);

            Payment payment = paymentRepository.findByTransactionId(orderId).orElse(new Payment());

            if (isValid) {
                Customer customer = customerRepository.findById(customerId).orElseThrow();
                Plan plan = planRepository.findById(planId).orElseThrow();

                // Create subscription
                Subscription subscription = new Subscription();
                subscription.setCustomer(customer);
                subscription.setPlan(plan);
                subscription.setStartDate(LocalDate.now());
                subscription.setEndDate(LocalDate.now().plusDays(plan.getDuration()));
                subscription.setStatus(Subscription.SubscriptionStatus.ACTIVE);
                subscription = subscriptionRepository.save(subscription);

                // Update payment record
                payment.setCustomer(customer);
                payment.setSubscription(subscription);
                payment.setAmount(plan.getPrice());
                payment.setPaymentMethod("RAZORPAY");
                payment.setTransactionId(paymentId); // Update with Payment ID
                payment.setStatus(Payment.PaymentStatus.SUCCESS);
                paymentRepository.save(payment);

                return ResponseEntity.ok(subscription);
            } else {
                payment.setStatus(Payment.PaymentStatus.FAILED);
                paymentRepository.save(payment);
                return ResponseEntity.status(400).body("Invalid signature");
            }
        } catch (RazorpayException e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }
}

