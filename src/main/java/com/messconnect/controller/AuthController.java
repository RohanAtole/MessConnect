package com.messconnect.controller;

import com.messconnect.dto.JwtResponse;
import com.messconnect.dto.LoginRequest;
import com.messconnect.dto.MessageResponse;
import com.messconnect.dto.RegisterRequest;
import com.messconnect.entity.Customer;
import com.messconnect.entity.Vendor;
import com.messconnect.repository.CustomerRepository;
import com.messconnect.repository.VendorRepository;
import com.messconnect.security.JwtUtils;
import com.messconnect.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    CustomerRepository customerRepository;

    @Autowired
    VendorRepository vendorRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserPrincipal userDetails = (UserPrincipal) authentication.getPrincipal();

        return ResponseEntity.ok(new JwtResponse(jwt, "Bearer",
                userDetails.getId(),
                userDetails.getEmail(),
                userDetails.getRole()));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
        if (customerRepository.existsByEmail(signUpRequest.getEmail()) || vendorRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        if ("VENDOR".equalsIgnoreCase(signUpRequest.getRole())) {
            Vendor vendor = new Vendor();
            vendor.setOwnerName(signUpRequest.getName());
            vendor.setMessName(signUpRequest.getMessName());
            vendor.setEmail(signUpRequest.getEmail());
            vendor.setPassword(encoder.encode(signUpRequest.getPassword()));
            vendor.setPhone(signUpRequest.getPhone());
            vendor.setAddress(signUpRequest.getAddress());
            vendor.setDescription(signUpRequest.getDescription());
            vendor.setStatus(Vendor.VendorStatus.PENDING);
            vendorRepository.save(vendor);
        } else {
            Customer customer = new Customer();
            customer.setName(signUpRequest.getName());
            customer.setEmail(signUpRequest.getEmail());
            customer.setPassword(encoder.encode(signUpRequest.getPassword()));
            customer.setPhone(signUpRequest.getPhone());
            customer.setAddress(signUpRequest.getAddress());
            customerRepository.save(customer);
        }

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }
}
