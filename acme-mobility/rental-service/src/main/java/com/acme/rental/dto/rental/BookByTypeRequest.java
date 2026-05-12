package com.acme.rental.dto.rental;

import com.fasterxml.jackson.annotation.JsonProperty;

public record BookByTypeRequest(
        @JsonProperty("userId") String userId,
        @JsonProperty("stationId") Long stationId,
        @JsonProperty("vehicleType") String vehicleType
) {
}
