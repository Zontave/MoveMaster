package com.movemaster.backend.controller;

import com.movemaster.backend.entity.User;
import com.movemaster.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public Map<String, String> register(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        if (userRepository.findByEmail(email).isPresent()) {
            return Collections.singletonMap("error", "Email already exists");
        }
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setProvider("local");
        user.setRoles(Collections.singleton("ROLE_USER"));
        userRepository.save(user);
        return Collections.singletonMap("status", "registered");
    }

    // Pour la connexion, Spring Security gère /login automatiquement
}
