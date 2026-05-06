package com.messconnect.config;

import com.messconnect.entity.Admin;
import com.messconnect.entity.Vendor;
import com.messconnect.entity.Plan;
import com.messconnect.entity.Menu;
import com.messconnect.repository.AdminRepository;
import com.messconnect.repository.VendorRepository;
import com.messconnect.repository.PlanRepository;
import com.messconnect.repository.MenuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    AdminRepository adminRepository;

    @Autowired
    VendorRepository vendorRepository;

    @Autowired
    PlanRepository planRepository;

    @Autowired
    MenuRepository menuRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (adminRepository.count() == 0) {
            Admin admin = new Admin();
            admin.setEmail("admin@messconnect.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            adminRepository.save(admin);
        }

        if (vendorRepository.count() == 0) {
            Vendor vendor1 = new Vendor();
            vendor1.setOwnerName("John Doe");
            vendor1.setMessName("Healthy Bites Mess");
            vendor1.setEmail("john@healthybites.com");
            vendor1.setPassword(passwordEncoder.encode("vendor123"));
            vendor1.setPhone("1234567890");
            vendor1.setAddress("123 Food Street, City");
            vendor1.setDescription("Providing healthy and nutritious meals for students.");
            vendor1.setStatus(Vendor.VendorStatus.APPROVED);
            vendorRepository.save(vendor1);

            Plan plan1 = new Plan();
            plan1.setVendor(vendor1);
            plan1.setName("Monthly Special");
            plan1.setPrice(new BigDecimal("3000.00"));
            plan1.setDuration(30);
            plan1.setMealsPerDay(2);
            planRepository.save(plan1);

            String[] days = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};
            for (String day : days) {
                Menu menu = new Menu();
                menu.setVendor(vendor1);
                menu.setMenuDay(day);
                menu.setBreakfast("Poha, Tea");
                menu.setLunch("Rice, Dal, 2 Sabzi, Roti");
                menu.setDinner("Jeera Rice, Paneer, Roti");
                menuRepository.save(menu);
            }

            Vendor vendor2 = new Vendor();
            vendor2.setOwnerName("Jane Smith");
            vendor2.setMessName("Royal Tiffin");
            vendor2.setEmail("jane@royaltiffin.com");
            vendor2.setPassword(passwordEncoder.encode("vendor123"));
            vendor2.setPhone("9876543210");
            vendor2.setAddress("456 Gourmet Lane, City");
            vendor2.setDescription("Authentic home-style food delivered to your doorstep.");
            vendor2.setStatus(Vendor.VendorStatus.APPROVED);
            vendorRepository.save(vendor2);
        }
    }
}
