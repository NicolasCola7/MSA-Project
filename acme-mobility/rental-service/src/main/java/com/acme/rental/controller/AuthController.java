package com.acme.rental.controller;

import com.acme.rental.model.User;
import com.acme.rental.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Per permettere le chiamate da Angular
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        System.out.println("[DEBUG] Login attempt received");
        System.out.println("[DEBUG] Request Email: [" + request.email() + "]");
        System.out.println("[DEBUG] Request Password: [" + request.password() + "]");

        Optional<User> userOpt = userRepository.findByEmail(request.email());
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            System.out.println("[DEBUG] User found in DB: " + user.getEmail());
            System.out.println("[DEBUG] DB Password: [" + user.getPassword() + "]");

            if (user.getPassword().equals(request.password())) {
                System.out.println("[DEBUG] Password match! Login successful.");
                return ResponseEntity.ok(new LoginResponse(String.valueOf(user.getId()), user.getName(), true, "Login successful"));
            } else {
                System.out.println("[DEBUG] Password mismatch.");
            }
        } else {
            System.out.println("[DEBUG] User NOT found in DB for email: " + request.email());
        }
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new LoginResponse(null, null, false, "Invalid email or password"));
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@RequestBody RegisterRequest request) {
        System.out.println("[DEBUG] Register attempt: " + request.email());

        // Check if email is already taken
        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new RegisterResponse(false, "Email already registered."));
        }

        User newUser = new User();
        newUser.setName(request.name());
        newUser.setEmail(request.email());
        newUser.setPassword(request.password());

        userRepository.save(newUser);
        System.out.println("[DEBUG] User registered successfully: " + request.email());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegisterResponse(true, "Registration completed successfully!"));
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────────

    public record LoginRequest(
        @JsonProperty("email") String email, 
        @JsonProperty("password") String password
    ) {}
    
    public record LoginResponse(String userId, String userName, boolean success, String message) {}

    public record RegisterRequest(
        @JsonProperty("name") String name,
        @JsonProperty("email") String email,
        @JsonProperty("password") String password
    ) {}

    public record RegisterResponse(boolean success, String message) {}
}
