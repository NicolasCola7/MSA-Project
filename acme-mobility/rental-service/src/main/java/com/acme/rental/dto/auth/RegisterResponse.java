package com.acme.rental.dto.auth;

public record RegisterResponse(
        boolean success,
        String message
) {
}
