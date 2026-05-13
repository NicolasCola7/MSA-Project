package com.acme.rental.dto.rental;

import com.fasterxml.jackson.annotation.JsonProperty;

public record BookVehicleRequest(
        @JsonProperty("userId") Long userId,
        @JsonProperty("vehicleId") Long vehicleId
) {
}
