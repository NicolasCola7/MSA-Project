package com.acme.rental.dto.rental;

public record BookVehicleResponse(
        boolean success,
        String message,
        String userId
) {
}
