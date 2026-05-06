package com.messconnect.security;

import com.messconnect.entity.Admin;
import com.messconnect.entity.Customer;
import com.messconnect.entity.Vendor;
import com.messconnect.repository.AdminRepository;
import com.messconnect.repository.CustomerRepository;
import com.messconnect.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    AdminRepository adminRepository;

    @Autowired
    CustomerRepository customerRepository;

    @Autowired
    VendorRepository vendorRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Try Admin
        Admin admin = adminRepository.findByEmail(email).orElse(null);
        if (admin != null) {
            return UserPrincipal.create(admin.getId(), admin.getEmail(), admin.getPassword(), "ADMIN");
        }

        // Try Vendor
        Vendor vendor = vendorRepository.findByEmail(email).orElse(null);
        if (vendor != null) {
            return UserPrincipal.create(vendor.getId(), vendor.getEmail(), vendor.getPassword(), "VENDOR");
        }

        // Try Customer
        Customer customer = customerRepository.findByEmail(email).orElse(null);
        if (customer != null) {
            return UserPrincipal.create(customer.getId(), customer.getEmail(), customer.getPassword(), "CUSTOMER");
        }

        throw new UsernameNotFoundException("User Not Found with email: " + email);
    }
}
