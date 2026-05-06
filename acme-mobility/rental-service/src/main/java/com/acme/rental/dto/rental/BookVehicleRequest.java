package com.acme.rental.dto.rental;

import com.fasterxml.jackson.annotation.JsonProperty;

public record BookVehicleRequest(
        @JsonProperty("userId") String userId,
        @JsonProperty("vehicleId") String vehicleId
) {
}
