package com.acme.rental.dto.auth;

public record LoginResponse(
        String userId,
        String userName,
        String accountId,
        String targetRoute,
        boolean success,
        String message
) {
}
