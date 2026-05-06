package com.acme.rental.dto.rental;

public record ScanQrResponse(
        boolean success,
        String message
) {
}
