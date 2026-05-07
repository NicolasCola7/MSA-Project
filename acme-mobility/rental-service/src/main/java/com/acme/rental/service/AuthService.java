package com.acme.rental.service;

import com.acme.rental.dto.auth.LoginRequest;
import com.acme.rental.dto.auth.LoginResponse;
import com.acme.rental.dto.auth.RegisterRequest;
import com.acme.rental.dto.auth.RegisterResponse;
import com.acme.rental.model.User;
import com.acme.rental.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public LoginResponse authenticateUser(LoginRequest request) {
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
                return new LoginResponse(
                        String.valueOf(user.getId()),
                        user.getName(),
                        true,
                        "Login successful"
                );
            }

            System.out.println("[DEBUG] Password mismatch.");
        } else {
            System.out.println("[DEBUG] User NOT found in DB for email: " + request.email());
        }

        return new LoginResponse(null, null, false, "Invalid email or password");
    }

    public RegisterResponse registerNewUser(RegisterRequest request) {
        System.out.println("[DEBUG] Register attempt: " + request.email());

        if (userRepository.findByEmail(request.email()).isPresent()) {
            return new RegisterResponse(false, "Email already registered.");
        }

        User newUser = new User();
        newUser.setName(request.name());
        newUser.setEmail(request.email());
        newUser.setPassword(request.password());
        newUser.setAccountId(request.accountId());

        userRepository.save(newUser);
        System.out.println("[DEBUG] User registered successfully: " + request.email());

        return new RegisterResponse(true, "Registration completed successfully!");
    }
}
