package com.acme.rental.dto.rental;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ScanQrRequest(
        @JsonProperty("userId") String userId,
        @JsonProperty("vehicleId") String vehicleId
) {
}
