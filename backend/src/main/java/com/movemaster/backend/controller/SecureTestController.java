package com.movemaster.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SecureTestController {
    @GetMapping("/api/secure/user")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public String userAccess() {
        return "User or Admin can access this endpoint.";
    }

    @GetMapping("/api/secure/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminAccess() {
        return "Only Admin can access this endpoint.";
    }
}
