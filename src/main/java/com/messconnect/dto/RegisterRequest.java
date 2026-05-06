package com.messconnect.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String phone;
    private String address;
    private String role; // CUSTOMER or VENDOR
    
    // Vendor specific
    private String messName;
    private String description;
}
