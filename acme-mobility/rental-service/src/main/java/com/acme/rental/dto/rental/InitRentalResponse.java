package com.acme.rental.dto.rental;

public record InitRentalResponse(
        Long processInstanceKey,
        boolean success,
        String message
) {
}
