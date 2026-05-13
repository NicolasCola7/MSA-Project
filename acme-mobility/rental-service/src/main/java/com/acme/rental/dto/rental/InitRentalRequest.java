package com.acme.rental.dto.rental;

import com.fasterxml.jackson.annotation.JsonProperty;

public record InitRentalRequest(
        @JsonProperty("userId") Long userId
) {
}
