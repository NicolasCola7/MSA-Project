package com.acme.rental.dto.auth;

public record LoginResponse(
        String userId,
        String userName,
        boolean success,
        String message,
        String targetRoute,
        String vehicleId
) {
}
